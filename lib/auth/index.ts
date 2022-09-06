import {
	appconfig,
	applogger,
	AuthenticationError,
	AuthorizationError,
	bcryptCompare,
	bcryptEncrypt,
	create,
	ExistingUserError,
	extractValidationErrorMessage,
	getNumericDate,
	isEmpty,
	isNull,
	ObjectId,
	User,
	validate,
	ValidationError,
	verify,
} from '../../deps.ts';
import type {
	NextFunction,
	OpineRequest,
	OpineResponse,
	Payload,
} from '../../deps.ts';
import { UserRepository } from '../mongo/repo/userRepository.ts';
import { Role } from '../mongo/models/user.ts';
import { requestLogger } from '../../container.ts';
import { UnAuthorizedVaultAccessError } from "../../error.ts";
import { VaultRepository } from "../mongo/repo/vaultRepository.ts";

const key = await crypto.subtle.generateKey(
	{ name: 'HMAC', hash: 'SHA-512' },
	true,
	['sign', 'verify'],
);

const CreateJwtToken = async (
	payload: { id: string; email: string; role: Role; username: string },
	algorithm: 'HS512',
): Promise<string> => {
	try {
		const expire = getNumericDate(60 * 60 * appconfig.jwtExpire);
		applogger.info(
			`encrypting data:[${payload.email}] into a JWT token at ${
				new Date().toISOString()
			}`,
		);
		return await create({ alg: algorithm, typ: 'JWT' }, {
			...payload,
			exp: expire,
		}, key);
	} catch (err) {
		applogger.error(`error occured while creating token for [${payload}]`);
		throw err;
	}
};

const VerifyJwtToken = async (token: string): Promise<Payload> => {
	try {
		const payload = await verify(token, key);
		return payload;
	} catch (err) {
		applogger.error(`verification error occured for token [${token}]`);
		throw err;
	}
};

export const login = (db: UserRepository) =>
	async (
		req: OpineRequest,
		res: OpineResponse,
		next: NextFunction,
	) => {
		const { email, password } = req.body;

		const user: User | undefined = await db.findOne({ email });

		if (user != null && bcryptCompare(password, user.password)) {
			requestLogger.debug(`Found User : ${JSON.stringify(user)}`);
			const token = await CreateJwtToken({
				id: user._id.toString(),
				email: user.email,
				username: user.username,
				role: user.role,
			}, 'HS512');
			return res.setStatus(200).json({
				status: 'SUCCESS',
				token: token,
			});
		}
		applogger.error(
			`login request failed for email : ${email} at ${
				new Date().toISOString()
			}`,
		);
		return res.setStatus(404).json({
			status: 'SUCCESS',
			message: 'User does not exist or invalid credential in details',
		});
	};

export const signup = (db: UserRepository) =>
	async (
		req: OpineRequest,
		res: OpineResponse,
		next: NextFunction,
	) => {
		const { username, password, email } = req.body;
		const newUser = new User();
		newUser.email = email;
		newUser.username = username;
		newUser.password = password;
		newUser.role = Role.OWNER;

		try {
			const errors = await validate(newUser, {
				validationError: { target: false },
			});
			if (errors.length > 0) {
				return res.setStatus(400).json({
					status: 'FAILURE',
					error: extractValidationErrorMessage(errors),
				});
			}
			newUser.password = await bcryptEncrypt(newUser.password, 10);
			const id = await db.create(newUser);
			if (isNull(id)) {
				return res.setStatus(401).json({
					status: 'FAILURE',
					message: 'Could not create user',
				});
			}
			applogger.info(`Created a user with id : [${id}] 🐙`);
			return res.setStatus(201).jsonp({
				status: 'SUCCESS',
				message: `Created a user with id : [${id}] 🐙`,
			});
		} catch (err) {
			console.log(err);
			return res.setStatus(500).json({ status: 'FAILURE', err });
		}
	};

function isExpired(exp: number, leeway = 0): boolean {
	return exp + leeway < Date.now() / 1000;
}

export const validateLoginCredentials = (
	req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,
) => {
	const { email, password } = req.body;
	if (!email || !password || isEmpty(email) || isEmpty(password)) {
		return next(
			new ValidationError('email or password should not be empty'),
		);
	}
	next();
};

export const isAuthenticated = async (
	req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,
) => {
	try {
		if (!req.headers.has('authorization')) {
			return next(new AuthenticationError());
		} else {
			const authorization: string | null = req.headers.get(
				'authorization',
			);

			const [type, token] = authorization != null
				? authorization.split(' ')
				: [null, null];

			if ((type == null || token == null) && type != 'Bearer') {
				return next(new AuthenticationError('Invalid Auth Token 🧨'));
			}
			// @ts-ignore: Temporary workaround (see ticket #422)
			const credentials = await VerifyJwtToken(
				token as string,
			);
			if (credentials == null) {
				return next(new AuthenticationError('Invalid Credentials 🧨'));
			}
			const hasExpired = isExpired(credentials.exp as number);
			if (hasExpired) {
				return next(
					new AuthenticationError('Expired Credentials Token 🧨'),
				);
			}
			// @ts-ignore: Temporary workaround (see ticket #422)
			req.user = {
				id: credentials.id,
				email: credentials.email,
				username: credentials.username,
				role: credentials.role,
			};
			return next();
		}
	} catch (err) {
		return next(err);
	}
};

export const validatePassword = (
	req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,
) => {
	const { password, confirmPassword } = req.body;
	if (password !== confirmPassword) {
		return next(new ValidationError('password does not match'));
	}
	next();
};

export const isAuthorized = (...roles: Role[]) => {
	return (
		req: OpineRequest,
		res: OpineResponse,
		next: NextFunction,
	) => {
		// @ts-ignore: Temporary workaround (see ticket #422)
		const userRole = req.user.role;
		let isAllowed = roles.includes(userRole);
		if (isAllowed) {
			return next();
		}
		return next(new AuthorizationError());
	};
};

export const isOwner = (db:VaultRepository)=>{
	return async (req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,)=>{
	// @ts-ignore
	let {password} = req.headers.owner ? req.headers.owner : null ;
	// @ts-ignore
	let {id} = req.user;
	let data = await db.findOne({userId:new ObjectId(id)});
	if (data && await bcryptCompare(password,data.settings.password)){
		return next()
	}
	return next(new UnAuthorizedVaultAccessError())
}}

export const checkForUserExistence = (db: UserRepository) =>
	async (
		req: OpineRequest,
		res: OpineResponse,
		next: NextFunction,
	) => {
		// @ts-ignore: Temporary workaround (see ticket #422)
		const { username, email } = req.body;
		const user = await db.getCollection().findOne({
			$or: [
				{ username: username },
				{ email: email },
			],
		});

		if (!isNull(user)) {
			if (user?.email === email) {
				return next(
					new ExistingUserError(`A user with email ${email} exist`),
				);
			} else if (user?.username === username) {
				return next(
					new ExistingUserError(`A user with username ${user} exist`),
				);
			}
		}
		next();
	};

export const parseIDParams = async (
	req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,
) => {
	// @ts-ignore: Temporary workaround (see ticket #422)
	if (req.user) {
		// @ts-ignore: Temporary workaround (see ticket #422)
		req.params.id = req.user.id;
	}
	next();
};

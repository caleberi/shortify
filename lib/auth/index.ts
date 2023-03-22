import {
	appconfig,
	applogger,
	AuthenticationError,
	AuthorizationError,
	create,
	ExistingUserError,
	extractValidationErrorMessage,
	getNumericDate,
	isEmpty,
	isNull,
	passwordCompare,
	passwordEncrypt,
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
import { UserRepository } from '../mongo/repo/user.repository.ts';
import { Role } from '../mongo/models/user.ts';
import { requestLogger } from '../../container.ts';

const key = await crypto.subtle.generateKey(
	{ name: 'HMAC', hash: 'SHA-512' },
	true,
	['sign', 'verify'],
);

const CreateJwtToken = async (
	payload: { id: string; email: string; role: Role; username: string },
	algorithm: 'HS512',
): Promise<string> => {
	const expire = getNumericDate(60 * 60 * appconfig.jwtExpire);
	applogger.info(
		`encrypting data:[${payload.email}] into a JWT token at ${
			new Date().toISOString()
		}`,
	);
	const token = await create({ alg: algorithm, typ: 'JWT' }, {
		...payload,
		exp: expire,
	}, key);
	return token;
};

const verifyJwtToken = async (token: string): Promise<Payload> => {
	const payload = await verify(token, key);
	return payload;
};

export const login =
	(db: UserRepository) =>
	async (req: OpineRequest, res: OpineResponse, next: NextFunction) => {
		const { email, password } = req.body;

		const user: User | undefined = await db.findOne({ email });
		if (user) {
			const passwordValid = await passwordCompare(
				password,
				Deno.env.get('SECRET_KEY') as string,
				user.password as string,
			);
			if (!passwordValid) {
				return res.setStatus(404).json({
					status: 'SUCCESS',
					message:
						'User does not exist or invalid credential in details',
				});
			}
			const token = await CreateJwtToken({
				id: user._id?.toString() as string,
				email: user.email as string,
				username: user.username as string,
				role: user.role,
			}, 'HS512');
			return res.setStatus(200).json({
				status: 'SUCCESS',
				token: token,
			});
		}
		return res.setStatus(404).json({
			status: 'SUCCESS',
			message: 'User does not exist or invalid credential in details',
		});
	};

export const signup =
	(db: UserRepository) =>
	async (req: OpineRequest, res: OpineResponse, next: NextFunction) => {
		const { username, password, email } = req.body;

		const newUser = new User();

		newUser.email = email;
		newUser.username = username;
		newUser.password = password;
		newUser.role = Role.OWNER;

		const errors = await validate(newUser, {
			validationError: { target: false },
		});

		if (errors.length > 0) {
			return res.setStatus(400).json({
				status: 'FAILURE',
				error: extractValidationErrorMessage(errors),
			});
		}

		let id = null;
		try {
			newUser.password = await passwordEncrypt(
				newUser.password as string,
				Deno.env.get('SECRET_KEY') as string,
			);
			id = await db.create(newUser);
		} catch (err) {
			return res.setStatus(500).json({ status: 'FAILURE', err });
		}

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
	if (!req.headers.has('authorization')) {
		return next(new AuthenticationError());
	}

	const authorization: string | null = req.headers.get(
		'authorization',
	);

	const [type, token] = authorization != null
		? authorization.split(' ')
		: [null, null];

	if ((type == null || token == null) && type != 'Bearer') {
		return next(new AuthenticationError('Invalid Auth Token 🧨'));
	}

	try {
		const credentials = await verifyJwtToken(
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

		req.app.locals.user = {
			id: credentials.id,
			email: credentials.email,
			username: credentials.username,
			role: credentials.role,
		};

		return next();
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
		const user = req.app.locals.user as any;

		let isAllowed = roles.includes(user.role);
		if (isAllowed) {
			return next();
		}
		return next(new AuthorizationError());
	};
};

export const checkForUserExistence = (db: UserRepository) =>
async (
	req: OpineRequest,
	res: OpineResponse,
	next: NextFunction,
) => {
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
	if (req.app.locals.user) {
		let user = req.app.locals.user as any;
		req.params.id = user ? user.id : null;
	}
	next();
};

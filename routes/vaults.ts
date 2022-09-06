import { errorlogger } from "../container.ts";
import {
	applogger,
	AuthorizationError,
	bcryptEncrypt,
	extractValidationErrorMessage,
	isNull,
	ObjectId,
	Router,
	validate,
	ValidationError,
	Vault,
} from '../deps.ts';
import { NoExistingVaultError, UnAuthorizedVaultAccessError } from '../error.ts';
import { isAuthenticated, isAuthorized, isOwner } from '../lib/auth/index.ts';
import { Role } from '../lib/mongo/models/user.ts';
import { VaultSetting } from '../lib/mongo/models/vault.ts';
import { VaultEntryRepository } from '../lib/mongo/repo/vaultEntryRepository.ts';
import { VaultRepository } from '../lib/mongo/repo/vaultRepository.ts';
import { matchVaultEncryptionSupport } from '../lib/utils/helpers.ts';
import VaultEntriesRouter from './entries.ts';

export default function (
	vdb: VaultRepository,
	veDb: VaultEntryRepository,
) {
	const router = Router({ mergeParams: true });

	router.use(
		isAuthenticated,
		isAuthorized(Role.OWNER),
		VaultEntriesRouter(veDb),
	);
	router.get(
		'/all',
		isAuthenticated,
		isAuthorized(Role.ADMIN),
		async (req, res, next) => {
			let { page, limit } = {
				page: parseInt(req.query.page, 10) || 0,
				limit: parseInt(req.query.limit, 10) || 10,
			};
			let skips = page * (page * limit - 1);
			try {
				const vaults = await Promise.resolve(
					vdb.getCollection()
						.find()
						.skip(skips)
						.limit(page).map((user) => (user)),
				);
				return res.setStatus(200).json({
					status: 'SUCCESS',
					page: page,
					page_size: limit,
					data: vaults,
				});
			} catch (err) {
				res.setStatus(400).json({
					status: 'FAILURE',
					err: err,
				});
			}
		},
	);
	router
		.route('/')
		.post(
			isAuthenticated,
			isAuthorized(Role.OWNER),
			async (req, res, next) => {
				try {
					// .... do something
					let {
						name,
						settings: { password, phrase, encryption },
						userId,
						meta,
					} = req.body;
					if (phrase.split(' ').length <= 3) {
						return new ValidationError(
							'phrase should be more than  or equal to 3 words',
						);
					}
					let newVault = new Vault();
					let vaultSettings = new VaultSetting();
					newVault.userId = new ObjectId(userId);
					newVault.name = name;
					newVault.meta = meta;

					vaultSettings.encryption = encryption
						? matchVaultEncryptionSupport(encryption)
						: null;
					vaultSettings.password = await bcryptEncrypt(password, 10);
					vaultSettings.phrase = await bcryptEncrypt(phrase, 10);

					const errors = await validate(newVault, {
						validationError: { target: false },
					});
					if (errors.length > 0) {
						return res.setStatus(400).json({
							status: 'FAILURE',
							error: extractValidationErrorMessage(errors),
						});
					}
					const vaultId = await vdb.create(newVault);
					if (isNull(vaultId)) {
						return res.setStatus(401).json({
							status: 'FAILURE',
							message: 'Could not create user',
						});
					}
					applogger.info(`Created a vault with id : [${vaultId}] 🐙`);
					return res.setStatus(201).jsonp({
						status: 'SUCCESS',
						message: `Created a vault with id : [${vaultId}] 🐙`,
					});
				} catch (err) {
					console.log(err);
					return res.setStatus(500).json({ status: 'FAILURE', err });
				}
			},
		);
	router.route('/:id')
		.get(
			isAuthenticated,
			isAuthorized(Role.OWNER),
			isOwner(vdb),
			async (req, res, next) => {
				try {
					// @ts-ignore
					let userId = req.user ? req.user.id : undefined;
					if (!userId) {
						throw new AuthorizationError('User not found 🔎');
					}
					const vault = await vdb.findOne({
						userId,
					});

					if (vault) {
						return res.setStatus(200).json({
							status: 'SUCCESS',
							data: vault,
						});
					}
					return res.setStatus(400).json({
						status: 'FAILURE',
						data: {},
					});
				} catch (err) {
					errorlogger.error(err);
					return res.setStatus(500).json({ status: 'FAILURE', err });
				}
			},
		).put(async (req, res, next) => {
			try {
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				if (!userId) {
					throw new AuthorizationError('User not found 🔎');
				}
				let {
					name,
					settings: { password, phrase, encryption },
					meta,
				} = req.body;
				if (phrase.split(' ').length <= 3) {
					return new ValidationError(
						'phrase should be more than  or equal to 3 words',
					);
				}
				let oldVault = await vdb.findOne({ userId });
				if (!oldVault) {
					throw new NoExistingVaultError();
				}
				let newVault = new Vault();
				let vaultSettings = new VaultSetting();

				newVault.userId = new ObjectId(userId);
				newVault.name = oldVault.name != name ? name : oldVault;
				newVault.meta = meta;

				vaultSettings.encryption = encryption
					? matchVaultEncryptionSupport(encryption)
					: null;
				vaultSettings.password = await bcryptEncrypt(password, 10);
				vaultSettings.phrase = await bcryptEncrypt(phrase, 10);

				const errors = await validate(newVault, {
					validationError: { target: false },
				});
				if (errors.length > 0) {
					return res.setStatus(400).json({
						status: 'FAILURE',
						error: extractValidationErrorMessage(errors),
					});
				}
				const { upsertedId } = await vdb.updateOne(
					{ userId: userId },
					newVault,
				);
				if (isNull(upsertedId)) {
					return res.setStatus(401).json({
						status: 'FAILURE',
						message: 'Could not create user',
					});
				}
				applogger.info(`Created a vault with id : [${upsertedId}] 🐙`);
				return res.setStatus(201).jsonp({
					status: 'SUCCESS',
					message: `Created a vault with id : [${upsertedId}] 🐙`,
				});
			} catch (err) {
				console.log(err);
				return res.setStatus(500).json({ status: 'FAILURE', err });
			}
		}).delete(async (req, res, next) => {
			try {
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				if (!userId) {
					throw new AuthorizationError('User not found 🔎');
				}
				const result = await vdb.deleteOne({ userId });
				return res.setStatus(201).jsonp({
					status: 'SUCCESS',
					message: `Number : [${result}] deleted 🐙`,
				});
			} catch (err) {
				console.log(err);
				return res.setStatus(500).json({ status: 'FAILURE', err });
			}
		});
	return router;
}

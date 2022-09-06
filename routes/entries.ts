import { AuthorizationError, ObjectId, Router } from '../deps.ts';
import { NoExistingVaultError } from '../error.ts';
import { VaultEntryRepository } from '../lib/mongo/repo/vaultEntryRepository.ts';
import {
	decryptWithDecryptionInfo,
	encryptWithDecryptionInfo,
} from '../lib/utils/helpers.ts';

export default function (veDb: VaultEntryRepository) {
	const router = Router();

	router.post('/:vaultId/entries', async (req, res, next) => {
		try {
			// @ts-ignore
			let userId = req.user ? req.user.id : undefined;
			let { vaultEntryId, vaultId } = req.params;
			let {
				decryption_key,
				decryption_rnd_val,
				data,
			} = req.body;
			if (!userId) {
				throw new AuthorizationError('User not found 🔎');
			}
			if (!vaultId) {
				throw new NoExistingVaultError();
			}
			if (!vaultEntryId) {
				throw new Error('Please provide a valid vault entry id');
			}
			const id = await veDb.create({
				userId: new ObjectId(userId),
				vaultId: new ObjectId(vaultId),
				_id: new ObjectId(vaultEntryId),
				data: encryptWithDecryptionInfo(
					data,
					decryption_key,
					parseInt(decryption_rnd_val),
				),
				decryption_key: decryption_key,
				decryption_rnd_val: decryption_rnd_val,
			});

			return res.setStatus(200).json({
				status: 'SUCCESS',
				data: `Created a vault with id : [${id}] 🐙`,
			});
		} catch (err) {
			return res.setStatus(400).json({
				status: 'FAILURE',
				err: err,
			});
		}
	});

	router
		.route('/:vaultId/entries/all')
		.get(async (req, res, next) => {
			let { page, limit } = {
				page: parseInt(req.query.page, 10) || 0,
				limit: parseInt(req.query.limit, 10) || 10,
			};
			let skips = page * (page * limit - 1);

			try {
				let { vaultId } = req.params;
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				if (!userId || !vaultId) {
					throw new AuthorizationError('User not found 🔎');
				}

				const entries = await Promise.resolve(
					veDb.getCollection()
						.find({ vaultId: new ObjectId(vaultId) })
						.skip(skips)
						.limit(page).map((v) => {
							v.data = decryptWithDecryptionInfo(
								v.data,
								v.decryption_key,
								v.decryption_rnd_val,
							);
							return v;
						}),
				);
				return res.setStatus(200).json({
					status: 'SUCCESS',
					page: page,
					page_size: limit,
					data: entries,
				});
			} catch (err) {
				console.log(err);
				return res.setStatus(500).json({ status: 'FAILURE', err });
			}
		}).delete(async (req, res, next) => {
			try {
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				let { vaultId } = req.params;
				if (!userId || !vaultId) {
					throw new AuthorizationError('User not found 🔎');
				}
				const result = await veDb.deleteMany({
					userId: new ObjectId(userId),
					vaultId: new ObjectId(vaultId),
				});
				return res.setStatus(201).jsonp({
					status: 'SUCCESS',
					message: `Number : [${result}] deleted 🐙`,
				});
			} catch (err) {
				console.log(err);
				return res.setStatus(500).json({ status: 'FAILURE', err });
			}
		});

	router
		.route('/:vaultId/entries/:vaultEntryId')
		.put(
			async (req, res, next) => {
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				let { vaultEntryId, vaultId } = req.params;
				let {
					decryption_key,
					decryption_rnd_val,
					data,
				} = req.body;
				if (!userId) {
					throw new AuthorizationError('User not found 🔎');
				}
				if (!vaultId) {
					throw new NoExistingVaultError();
				}
				if (!vaultEntryId) {
					throw new Error('Please provide a valid vault entry id');
				}
				const doc = await veDb.updateOne({
					userId: new ObjectId(userId),
					vaultId: new ObjectId(vaultId),
					_id: new ObjectId(vaultEntryId),
				}, {
					data: encryptWithDecryptionInfo(
						data,
						decryption_key,
						decryption_rnd_val,
					),
					decryption_key: decryption_key,
					decryption_rnd_val: decryption_rnd_val,
				});

				return res.setStatus(200).json({
					status: 'SUCCESS',
					data: doc,
				});
			},
		).delete(async (req, res, next) => {
			try {
				// @ts-ignore
				let userId = req.user ? req.user.id : undefined;
				let { vaultEntryId, vaultId } = req.params;
				if (!userId || !vaultId || !vaultEntryId) {
					throw new AuthorizationError('User not found 🔎');
				}
				const result = await veDb.deleteOne({
					userId: new ObjectId(userId),
					vaultId: new ObjectId(vaultId),
					_id: new ObjectId(vaultEntryId),
				});
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

import { base64Decode, Link, Router } from '../deps.ts';
import { LinkRepository } from '../lib/mongo/repo/link.repository.ts';
import { errorlogger } from '../container.ts';

export default function (ldb: LinkRepository) {
	const router = Router();

	router.get('/', (_req, res, _next) => {
		res.redirect(
			'https://documenter.getpostman.com/view/4514816/2s8YswSXUU',
		);
	});

	router.get('/short/:link', async (req, res, next) => {
		try {
			let { link } = req.params as any;

			const url = await Promise.resolve(
				ldb.getCollection().findOne({
					shortId: link,
				}),
			);

			if (!url) {
				return res.setStatus(400).json({
					status: 'FAILURE',
					data: 'Not matched url link found',
				});
			}

			if (link) {
				return res.redirect(url.longUrl as string);
			}
		} catch (err) {
			next(err);
		}
	});

	return router;
}

import { join } from 'https://deno.land/x/opine@2.1.5/deps.ts';
import { Router } from '../deps.ts';

export default function () {
	const router = Router({ mergeParams: true });

	router.get('/build-report', async function (req, res, next) {
		const filePath = join(Deno.cwd(), 'files', req.params.file);

		try {
			await res.download(filePath);
		} catch (err) {
			// file for download not found
			if (err instanceof Deno.errors.NotFound) {
				res.status = 404;
				res.send('Cant find that file, sorry!');
				return;
			}

			// non-404 error
			return next(err);
		}
	});

	router.get('/generate-report', async function (req, res, next) {
		const filePath = join(Deno.cwd(), 'files', req.params.file);

		try {
			await res.download(filePath);
		} catch (err) {
			// file for download not found
			if (err instanceof Deno.errors.NotFound) {
				res.status = 404;
				res.send('Cant find that file, sorry!');

				return;
			}

			// non-404 error
			return next(err);
		}
	});

	return router;
}

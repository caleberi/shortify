import { Router } from '../deps.ts';

export default function () {
	const router = Router();

	// GET home page.
	router.get('/ping', (_req, res, _next) => {
		res.send('Pinged');
	});
	return router;
}

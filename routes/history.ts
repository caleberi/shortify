import { Router } from '../deps.ts';
import reportRouter from './reports.ts';

export default function () {
	const router = Router();

	router.use('/reports', reportRouter);

	// GET users listing.
	router.get('/', (_req, res, _next) => {
		res.send('Histories are coming shortly!');
	});

	router.get('/:id', (_req, res, _next) => {
		res.send('Histories are coming shortly!');
	});

	return router;
}

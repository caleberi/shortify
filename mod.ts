import app from './app.ts';
import { appconfig, applogger, errorlogger } from './container.ts';
import {
	Database,
	MongoClient,
	NextFunction,
	Opine,
	OpineRequest,
	OpineResponse,
} from './deps.ts';
import { UserRepository } from './lib/mongo/repo/user.repository.ts';
import { LinkRepository } from './lib/mongo/repo/link.repository.ts';
import indexRouter from './routes/index.ts';
import usersRouter from './routes/users.ts';
import linkRouter from './routes/links.ts';

const port = appconfig.port ? appconfig.port : 3000;
app.set('port', port);

const env = appconfig.environment ? appconfig.environment : 'development';
app.set('env', env);

function errorHandler(
	err: any,
	_req: OpineRequest,
	res: OpineResponse,
	_next: NextFunction,
) {
	// respond with custom 500 "Internal Server Error".
	res.setStatus(500);
	res.json({ message: 'Internal Server Error', error: err.message });
}

function _init(app: Opine): void {
	new MongoClient()
		.connect({
			db: Deno.env.get('DB_NAME') as string,
			tls: true,
			servers: [
				{
					host: 'nodeclusterbased-shard-00-01.cpkfe.mongodb.net',
					port: 27017,
				},
				{
					host: 'nodeclusterbased-shard-00-02.cpkfe.mongodb.net',
					port: 27017,
				},
				{
					host: 'nodeclusterbased-shard-00-00.cpkfe.mongodb.net',
					port: 27017,
				},
			],
			credential: {
				username: (Deno.env.get('DB_USER') as string) || 'AstraVilla',
				password: Deno.env.get('DB_PASSWORD') as string,
				db: Deno.env.get('DB_NAME') as string,
				mechanism: 'SCRAM-SHA-1',
			},
		})
		.then(async (database: Database) => {
			applogger.info(
				`Connected database to [${appconfig.mongoServerUrl}]`,
			);

			const userDb = new UserRepository(database, 'users');

			const linkDb = new LinkRepository(database, 'links');

			await linkDb.createIndexes({
				indexes: [
					{
						key: {
							shortId: 1,
						},
						name: 'short_id_idx',
						unique: true,
					},
				],
				comment: {
					userId: 'shortId for fast location of links',
				},
			});

			// Mount routers
			app.use('/', indexRouter(linkDb));
			app.use('/users', usersRouter(userDb));
			app.use('/links', linkRouter(userDb, linkDb));

			app.use(errorHandler);
			// Start our Opine server on the provided or default port.
			const server = app.listen(
				port,
				() => applogger.info(`Server ⛳ listening on port ${port}`),
			);

			Deno.addSignalListener('SIGINT', () => {
				applogger.info(
					'🚩 Shutting server gracefully after 3000ms ...!',
				);
				server.close();
				setTimeout(() => {}, 3000);
				Deno.exit();
			});
		})
		.catch((err) => {
			errorlogger.error(`Error:[${JSON.stringify(err)}]`);
			throw err;
		});
}

if (import.meta.main) {
	applogger.info(`🧧 Running application from ${Deno.mainModule} ...`);
	_init(app);
}

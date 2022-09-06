import app from './app.ts';
import { appconfig, applogger, errorlogger } from './container.ts';
import {
	Database,
	IRouter,
	MongoClient,
	NextFunction,
	Opine,
	OpineRequest,
	OpineResponse,
	Router,
} from './deps.ts';
import { AccessRepository } from './lib/mongo/repo/accessHistoryRepository.ts';
import { UserRepository } from './lib/mongo/repo/userRepository.ts';
import { VaultEntryRepository } from './lib/mongo/repo/vaultEntryRepository.ts';
import { VaultRepository } from './lib/mongo/repo/vaultRepository.ts';
// import { swaggerDoc as Swagger } from "https://deno.land/x/deno_swagger_doc@releavev2.0.1/mod.ts";
import indexRouter from './routes/index.ts';
import usersRouter from './routes/users.ts';
import vaultRouter from './routes/vaults.ts';
// import historyRouter from './routes/history.ts';

// const SwaggerDefinition = {
// 	info: {
// 	  title: 'Vault App', // Title (required)
// 	  version: '1.0.0',  // Version (required)
// 	  description: 'A personal password management system ', // Description (optional)
// 	},
// 	host: `localhost:8000`, // Host (optional)
// 	basePath: '/', // Base path (optional)
// 	swagger: '2.0', // Swagger version (optional)
// };

// const SwaggerOptions = {
// 	SwaggerDefinition,
// 	apis: [
// 		'./routes/*.ts'
// 	],
// };

// Get the PORT from the environment variables and store in Opine.
const port = appconfig.port ? appconfig.port : 3000;
app.set('port', port);

// Get the DENO_ENV from the environment variables and store in Opine.
const env = appconfig.environment ? appconfig.environment : 'development';
app.set('env', env);

// const SwaggerSpecification = Swagger(SwaggerOptions);

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
		.connect(appconfig.mongoServerUrl)
		.then(async (database: Database) => {
			applogger.info(
				`Connected database to [${appconfig.mongoServerUrl}]`,
			);

			const userDb = new UserRepository(database, 'users');
			const accessHistoryDb = new AccessRepository(database, 'history');
			const vaultDb = new VaultRepository(database, 'vault');
			await vaultDb.createIndexes({
				indexes: [
					{
						key: {
							userId: 1,
						},
						name: 'vault_idx',
						unique: true,
					},
				],
				comment: {
					userId: 'userId for fast location of vaults',
				},
			});
			const vaultEntryDb = new VaultEntryRepository(
				database,
				'vault_entry',
			);

			// Mount routers
			// app.get("/docs", (req, res) => (res.json(SwaggerSpecification)));
			app.use('/', indexRouter());
			app.use('/users', usersRouter(userDb));
			app.use('/vaults', vaultRouter(vaultDb, vaultEntryDb));
			// app.use('/access_histories', historyRouter);

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

import configuration, { getEnvironmentVariable } from './config.ts';
import logger from './logger.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.4/mod.ts';
import * as log from 'https://deno.land/std@0.133.0/log/mod.ts';

async function runRedis() {
	setTimeout(async () => {
		await connect({
			hostname: appconfig.redisHostname,
			port: appconfig.redisPort,
		});
	}, 1000);
}

await logger._init_logger([
	{
		name: 'request',
		opts: {
			default: { consoleOnly: true },
			console: {
				level: 'DEBUG',
			},
			level: 'DEBUG',
		},
	},
	// {
	//   name: "app-error",
	//   opts: {
	//     file: {
	//       filename: "./error.txt",
	//       level: "ERROR",
	//       mode: "a",
	//       formatter: (rec) =>
	//         JSON.stringify(
	//           `logger:${rec.loggerName}=> date:[${rec.datetime}] | level:[${
	//             rec.level
	//           }] | msg:[${rec.msg}] | meta: [${JSON.stringify(rec.args)}] `
	//         ),
	//     },
	//     level: "ERROR",
	//   },
	// },
	// {
	//   name: "app-info",
	//   opts: {
	//     file: {
	//       filename: "./info.txt",
	//       level: "INFO",
	//       mode: "a",
	//       formatter: (rec) =>
	//         JSON.stringify(
	//           `logger:${rec.loggerName}=> date:[${rec.datetime}] | level:[${
	//             rec.level
	//           }] | msg:[${rec.msg}] | meta: [${JSON.stringify(rec.args)}] `
	//         ),
	//     },
	//     level: "INFO",
	//   },
	// },
]);

export const applogger = log.getLogger('app-info');
export const errorlogger = log.getLogger('app-info');
export const requestLogger = log.getLogger('app-info');

export const appconfig = configuration({
	port: parseInt(getEnvironmentVariable('PORT')),
	redisHostname: getEnvironmentVariable('REDIS_HOSTNAME'),
	redisPort: getEnvironmentVariable('REDIS_PORT'),
	mongoServerUrl: getEnvironmentVariable('MONGODB_SERVER_URL'),
	jwtSecret: getEnvironmentVariable('JWT_SECRET'),
	jwtExpire: getEnvironmentVariable('JWT_EXPIRE'),
	redisEnabled: Boolean(getEnvironmentVariable('ENABLE_REDIS')),
	tempLocation: getEnvironmentVariable('TEMP_FILE_LOCATION'),
	environment: getEnvironmentVariable('APP_ENV'),
});

// export const redis = appconfig.redisEnabled ? await runRedis() : null;

import { BaseHandler } from 'https://deno.land/std@0.133.0/log/handlers.ts';
import * as log from 'https://deno.land/std@0.133.0/log/mod.ts';
import { LogMode } from 'https://deno.land/std@0.133.0/log/mod.ts';

/**
 * LoggerFactory basically uses the singleton pattern to produce new loggers
 * while still maintaining the normal instanciation process at
 * `https://deno.land/std@0.133.0/log/mod.ts`.
 * Ensure when adding addon to logger please follow the handler creation of the link
 * Why SingletonPattern ?
 * Essentially to avoid duplicate creation of loggers with the same name even without having the same propertie
 */

type LogEntry = {
	name: string;
	opts?: {
		default?: {
			consoleOnly?: boolean;
			spreadPresetLoggers?: boolean;
		};
		console?: {
			formatter?: string;
			level:
				| 'NOTSET'
				| 'DEBUG'
				| 'INFO'
				| 'WARNING'
				| 'ERROR'
				| 'CRITICAL';
		};
		file?: {
			filename: string;
			mode: LogMode;
			level:
				| 'NOTSET'
				| 'DEBUG'
				| 'INFO'
				| 'WARNING'
				| 'ERROR'
				| 'CRITICAL';
			formatter?: string | ((rec: log.LogRecord) => string);
		};
		addon?: { [key: string]: typeof log.handlers.BaseHandler };
		level:
			| 'NOTSET'
			| 'DEBUG'
			| 'INFO'
			| 'WARNING'
			| 'ERROR'
			| 'CRITICAL';
	};
};

class LoggerFactory {
	static async _init_logger(loggers: LogEntry[]): Promise<void> {
		let _handlers: { [key: string]: BaseHandler } = {};
		let _loggers: { [name: string]: log.LoggerConfig } = {};
		loggers.forEach((logger) => {
			let { name, opts } = logger;
			// @ts-ignore: Temporary workaround (see ticket #422)
			let loghandler: { [key: string]: BaseHandler } = {
				console: opts?.console
					? new log.handlers.ConsoleHandler(opts.console.level, {
						formatter: opts.console.formatter,
					})
					: new log.handlers.ConsoleHandler('DEBUG', {
						formatter: '{datetime} {levelName} {msg}',
					}),
				...opts?.addon,
			};

			if (opts?.file) {
				loghandler = {
					...loghandler,
					[`${name}-file`]: new log.handlers.FileHandler(opts.file.level, {
						filename: opts.file.filename,
						formatter: opts.file.formatter,
						mode: opts.file.mode,
					}),
				};
			}

			let defaulthandler: string[] = [];
			defaulthandler = opts?.default?.consoleOnly
				? [...defaulthandler, 'console']
				: defaulthandler;
			defaulthandler = opts?.default?.spreadPresetLoggers
				? [...defaulthandler, ...Object.keys(loghandler)]
				: defaulthandler;

			_handlers = { ..._handlers, ...loghandler };
			_loggers[name] = {
				level: logger.opts?.level,
				handlers: [...Object.keys(loghandler)],
			};
		});
		await log.setup({
			//define handlers
			handlers: _handlers,
			//assign handlers to loggers
			loggers: _loggers,
		});
	}
}

export default LoggerFactory;

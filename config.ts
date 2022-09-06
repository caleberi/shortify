import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { ConfigurationError } from './error.ts';
import {
	assign,
	isNull,
	toUpper,
} from 'https://deno.land/x/lodash@4.17.15-es/lodash.js';

config({ export: true });

// deno-lint-ignore no-explicit-any
let configurationInstance: any = null;

export function getEnvironmentVariable(key: string) {
	const parsedKey = toUpper(key);
	const env = Deno.env.toObject();
	if (!(parsedKey in env)) {
		throw new ConfigurationError(`${key} is not present in environment`);
	}
	return env[parsedKey];
}

const configuration = function (options = {}) {
	if (isNull(configurationInstance)) {
		configurationInstance = assign({}, options);
	}
	return configurationInstance;
};

export default configuration;

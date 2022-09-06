import { NextFunction, OpineRequest, OpineResponse } from '../../deps.ts';
import { VaultEncryptionSupport } from '../mongo/models/vault.ts';
import {
	decode,
	encode,
} from 'https://deno.land/std@0.133.0/encoding/base64.ts';
export const matchVaultEncryptionSupport = (input: string) => {
	let m = input.toUpperCase();
	switch (m) {
		case 'SHA256':
			return VaultEncryptionSupport.SHA256;
		case 'SHA512':
			return VaultEncryptionSupport.SHA512;
	}
	return null;
};

export const catchAsync = (fn: Function) => {
	return (req: OpineRequest, res: OpineResponse, next: NextFunction) =>
		fn(req, res, next).catch((err: Error) => next(err));
};

export const encryptWithDecryptionInfo = (
	data: string,
	key: string,
	rand: number,
): string => {
	let s: number = rand + 23;
	let entry: string = `***DATA=>***[${data}]-||-${s}+${key}${
		Math.round(Math.random() * 3801029)
	}`;
	let hash = encode(entry);
	return hash;
};

export const decryptWithDecryptionInfo = (
	data: string,
	key: string,
	rand: number,
): string => {
	let decryptedData = decode(data).toString();
	let minusIdx = decryptedData.indexOf('-');
	let firstBrace = decryptedData.indexOf('[');
	return decryptedData.slice(firstBrace, minusIdx - 1);
};

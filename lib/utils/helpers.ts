import { NextFunction, OpineRequest, OpineResponse } from '../../deps.ts';
import {
	decode,
	encode,
} from 'https://deno.land/std@0.133.0/encoding/base64.ts';
export const URL_CODE_LENGTH = 8;
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

export function getId() {
	var arr = new Uint8Array(URL_CODE_LENGTH / 2);
	crypto.getRandomValues(arr);
	const toHex = (d: any) => d.toString(16).padStart(2, '0');
	return Array.from(arr, toHex).join('');
}

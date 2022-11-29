import { sha256 } from 'https://denopkg.com/chiefbiiko/sha256@master/mod.ts';

export const passwordEncrypt = async (
	password: string,
	secretData: string,
): Promise<string> => {
	let data = password + secretData;
	return sha256(data as string, 'utf8', 'hex').toString();
};

export const passwordCompare = async (
	plaintext: string,
	secretData: string,
	password: string,
): Promise<boolean> => {
	let data = plaintext + secretData;
	return sha256(data as string, 'utf8', 'hex').toString() === password;
};

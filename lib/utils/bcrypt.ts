import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

export const bcryptEncrypt = async (
	payload: string,
	salt: number,
): Promise<string> => {
	const generatedSalt = await bcrypt.genSalt(salt);
	const hash = await bcrypt.hash(payload, generatedSalt);
	return hash;
};

export const bcryptCompare = async (
	plaintext: string,
	hash: string,
): Promise<boolean> => {
	return await bcrypt.compare(plaintext, hash);
};

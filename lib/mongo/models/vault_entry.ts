import { IsNotEmpty, IsNumber, ObjectId } from '../../../deps.ts';
export class VaultEntry {
	// @ts-ignore: Temporary workaround (see ticket #422)
	public _id: ObjectId;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public userId: ObjectId;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public vaultId: ObjectId;
	@IsNotEmpty()
	// @ts-ignore: Temporary workaround (see ticket #422)
	public decryption_key: string;
	@IsNumber()
	// @ts-ignore: Temporary workaround (see ticket #422)
	public decryption_rnd_val: number;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public data: string;
}

import { Length, ObjectId } from '../../../deps.ts';

export enum VaultEncryptionSupport {
	SHA256,
	SHA512,
}

export class VaultSetting {
	// @ts-ignore: Temporary workaround (see ticket #422)
	// @ts-ignore: Temporary workaround (see ticket #422)
	@Length(8, 50)
	public password!: string;
	@Length(15, 100)
	//@ts-ignore: Temporary workaround (see ticket #422)
	public phrase: string;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public encryption: VaultEncryptionSupport | null;
}

export class Vault {
	// @ts-ignore: Temporary workaround (see ticket #422)
	// @ts-ignore: Temporary workaround (see ticket #422)
	@Length(3, 50)
	public name!: string;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public _id: ObjectId;
	// @ts-ignore: Temporary workaround (see ticket #422)
	userId: ObjectId;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public meta: { [key: typeof string]: any };
	// @ts-ignore: Temporary workaround (see ticket #422)
	public settings: VaultSetting;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public history: ObjectId[];
	// @ts-ignore: Temporary workaround (see ticket #422)
	public entries: { ref: ObjectId[] };
}

import { ObjectId } from '../../../deps.ts';
export class AccessHistory {
	// @ts-ignore: Temporary workaround (see ticket #422)
	public user_id: ObjectId;
	// @ts-ignore: Temporary workaround (see ticket #422)
	public access_dates: Date[];
	// @ts-ignore: Temporary workaround (see ticket #422)
	public updated_at: Date;
}

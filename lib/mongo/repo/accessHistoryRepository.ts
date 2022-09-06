import { AccessHistory } from '../models/access_history.ts';
import Repository from './repository.ts';
import { Database } from 'https://deno.land/x/mongo@v0.29.3/mod.ts';

export class AccessRepository extends Repository<AccessHistory> {
	constructor(database: Database, collectionName: string) {
		super(database, collectionName);
	}
}

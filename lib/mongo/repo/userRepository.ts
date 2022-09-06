import { User } from '../models/user.ts';
import Repository from './repository.ts';
import { Database } from 'https://deno.land/x/mongo@v0.29.3/mod.ts';

export class UserRepository extends Repository<User> {
	constructor(database: Database, collectionName: string) {
		super(database, collectionName);
	}
}

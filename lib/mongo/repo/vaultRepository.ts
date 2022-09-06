import Repository from './repository.ts';
import { Database } from 'https://deno.land/x/mongo@v0.29.3/mod.ts';
import { Vault } from '../models/vault.ts';

export class VaultRepository extends Repository<Vault> {
	constructor(database: Database, collectionName: string) {
		super(database, collectionName);
	}
}

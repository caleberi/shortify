import Repository from './repository.ts';
import { Database } from 'https://deno.land/x/mongo@v0.29.3/mod.ts';
import { VaultEntry } from '../models/vault_entry.ts';

export class VaultEntryRepository extends Repository<VaultEntry> {
	constructor(database: Database, collectionName: string) {
		super(database, collectionName);
	}
}

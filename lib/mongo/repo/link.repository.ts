import Repository from './repository.ts';
import { Database } from 'https://deno.land/x/mongo@v0.29.3/mod.ts';
import { Link } from '../models/link.ts';

export class LinkRepository extends Repository<Link> {
	constructor(database: Database, collectionName: string) {
		super(database, collectionName);
	}
}

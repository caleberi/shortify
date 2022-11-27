import { ObjectId } from '../../../deps.ts';
import {
	IsEmail,
	IsNotEmpty,
	IsDate
} from 'https://deno.land/x/deno_class_validator@v1.0.0/mod.ts';

export enum Role {
	OWNER = 'OWNER',
	ADMIN = 'ADMIN',
}
export class User {
	public _id: ObjectId|undefined;

	@IsNotEmpty({ message: 'Username must be provided' })
	public username: string|undefined;

	@IsNotEmpty({ message: 'Password must be provided' })
	public password: string|undefined;

	public profileImageUrl: string|undefined;

	@IsEmail({}, { message: 'Missing or incorrect email address' })
	public email: string|undefined;

	public role: Role = Role.OWNER;

	@IsDate()
	public updatedAt: Date|undefined;

	@IsDate()
    public createdAt: Date|undefined;

	constructor(){
		this.createdAt = new Date();
		this.updatedAt = new Date()
	}
}

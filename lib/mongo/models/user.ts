import { ObjectId } from '../../../deps.ts';
import {
	IsEmail,
	IsNotEmpty,
} from 'https://deno.land/x/deno_class_validator@v1.0.0/mod.ts';

export enum Role {
	OWNER = 'OWNER',
	ADMIN = 'ADMIN',
}
export class User {
	// @ts-ignore: Temporary workaround (see ticket #422)
	public _id: ObjectId;

	@IsNotEmpty({ message: 'Username must be provided' })
	// @ts-ignore: Temporary workaround (see ticket #422)
	public username: string;

	@IsNotEmpty({ message: 'Password must be provided' })
	// @ts-ignore: Temporary workaround (see ticket #422)
	public password: string;

	// @ts-ignore: Temporary workaround (see ticket #422)
	public profileImageUrl: string;

	@IsEmail({}, { message: 'Missing or incorrect email address' })
	// @ts-ignore: Temporary workaround (see ticket #422)
	public email: string;

	// @ts-ignore: Temporary workaround (see ticket #422)
	public role: Role = Role.OWNER;
}

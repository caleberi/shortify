import { IsNotEmpty, ObjectId } from '../../../deps.ts';

export class Link {
    public _id: ObjectId|undefined;

    @IsNotEmpty({ message: 'shortId must be provided' })
	public shortId!: string;

    @IsNotEmpty({ message: 'longUrl must be provided' })
	public longUrl: string|undefined;

    @IsNotEmpty({ message: 'siteName must be provided' })
	public siteName: string|undefined;

    public userId: ObjectId|undefined;

    public updatedAt: Date|undefined;
    
    public createdAt: Date|undefined;

    constructor(){
		this.createdAt = new Date();
		this.updatedAt = new Date()
	}
}

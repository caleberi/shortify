import {
  Collection,
  CountOptions,
  CreateIndexOptions,
  Database,
  DeleteOptions,
  Filter,
  FindOptions,
  InsertDocument,
  InsertOptions,
  ObjectId,
  UpdateFilter,
  UpdateOptions,
} from "https://deno.land/x/mongo@v0.29.3/mod.ts";

export default abstract class Repository<
  T extends { _id?: ObjectId | undefined }
> {
  protected readonly collection: Collection<T>;
  private readonly db: Database;
  constructor(database: Database, collectionName: string) {
    this.db = database;
    this.collection = this.db.collection<T>(collectionName);
  }

  getCollection() {
    return this.collection;
  }

  async createIndexes(options: CreateIndexOptions) {
    await this.collection.createIndexes(options);
    return this;
  }

  async create(
    doc: InsertDocument<T>,
    options?: InsertOptions | undefined
  ): Promise<ObjectId | Required<InsertDocument<T>>["_id"]> {
    return await this.collection.insertOne(doc, options);
  }

  async findOne(
    filter: { [Key in keyof T]?: T[Key] | Filter<T[Key]> | undefined },
    options?: FindOptions | undefined
  ): Promise<T | undefined> {
    return await this.collection.findOne(filter, options);
  }
  async findAll(
    filter: { [Key in keyof T]?: T[Key] | Filter<T[Key]> | undefined },
    options?: FindOptions | undefined
  ): Promise<T[] | undefined> {
    return await this.collection.find(filter, options).toArray();
  }
  async updateOne(
    filter: { [Key in keyof T]?: T[Key] | Filter<T[Key]> | undefined },
    update: UpdateFilter<T>,
    options?: UpdateOptions
  ): Promise<{
    upsertedId: ObjectId;
    upsertedCount: number;
    matchedCount: number;
    modifiedCount: number;
  }> {
    return await this.collection.updateOne(filter, update, options);
  }
  async deleteOne(filter: Filter<T>, options?: DeleteOptions): Promise<number> {
    return await this.collection.deleteOne(filter, options);
  }
  async deleteMany(
    filter: Filter<T>,
    options?: DeleteOptions
  ): Promise<number> {
    return await this.collection.deleteMany(filter, options);
  }

  protected async updateMany(
    filter: { [Key in keyof T]?: T[Key] | Filter<T[Key]> | undefined },
    doc: UpdateFilter<T>,
    options?: UpdateOptions | undefined
  ): Promise<{
    upsertedIds: ObjectId[] | undefined;
    upsertedCount: number;
    matchedCount: number;
    modifiedCount: number;
  }> {
    return await this.collection.updateMany(filter, doc, options);
  }

  protected async count(
    filter?: Filter<T> | undefined,
    options?: CountOptions | undefined
  ): Promise<number> {
    return await this.collection.countDocuments(filter, options);
  }
}

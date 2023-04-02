interface IMongooseUpdateResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedId: ObjectId;
}

interface IMongooseDeleteResult {
  acknowledged: boolean;
  deletedCount: number;
}

/*
 * Check whether the result from mongoose is successful
 */

const isUpdated: (result: IMongooseUpdateResult) => boolean = (result) => result.modifiedCount > 0;

const isRemoved: (result: IMongooseDeleteResult) => boolean = (result) => result.deletedCount > 0;

export { isUpdated, isRemoved };

import ApiError from '../errors/ApiError';
import Database from './Database';

export default class CategoriesRepository {
  static async getCategoryNames(type: string): Promise<string[] | null> {
    const mongo = await Database.getInstance();
    try {
      return mongo.db
        .collection(`${type}-categories`)
        .distinct('name') as Promise<string[]>;
    } catch (error) {
      throw new ApiError({
        code: 500,
        message: error.message,
      });
    }
  }

  static async isValidCategory(
    type: string,
    category: string,
  ): Promise<boolean> {
    const mongo = await Database.getInstance();
    try {
      const result = await mongo.db
        .collection(`${type}-categories`)
        .findOne({ name: category });
      return !!result;
    } catch (error) {
      throw new ApiError({
        code: 500,
        message: error.message,
      });
    }
  }
}

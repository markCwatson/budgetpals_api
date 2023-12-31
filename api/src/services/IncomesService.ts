import { ObjectId } from 'mongodb';
import IncomesRepository, {
  IncomesModel,
} from '../repositories/IncomesRepository';
import IncomeCategoryService from './categories/IncomeCategoryService';
import FrequencyService from './FrequencyService';
import BudgetsService from './BudgetsService';

export type Income = IncomesModel;

class IncomesService {
  static async addIncomeByUserId(
    userId: ObjectId,
    income: IncomesModel,
  ): Promise<Boolean> {
    const category = new IncomeCategoryService();
    const isValidCategory = await category.isValidCategory(income.category);
    if (!isValidCategory) return false;

    const isValidFrequency = await FrequencyService.isValidFrequency(
      income.frequency,
    );
    if (!isValidFrequency) return false;

    // convert dates to Date objects in DB
    const incomeToAdd = IncomesService.convertDates(income);
    const result = await IncomesRepository.addIncomeByUserId(
      userId,
      incomeToAdd,
    );
    if (!result) return false;

    if (!incomeToAdd.isPlanned) {
      // not a planned income means it's income that has already happened
      await BudgetsService.modifyRunningAccountBalance(
        userId,
        'income',
        incomeToAdd.amount,
      );
    }

    return result;
  }

  static async getIncomeById(
    userId: ObjectId,
    incomeId: string,
  ): Promise<IncomesModel | null> {
    const income = await IncomesRepository.getIncomeById(incomeId);
    if (!income.userId) return null;
    if (!income.userId.equals(userId)) return null;

    return income;
  }

  static async getIncomesByUserId(
    userId: ObjectId,
    filter?: Partial<IncomesModel>,
  ): Promise<IncomesModel[] | null> {
    return IncomesRepository.getIncomesByUserId(userId, filter);
  }

  static async getCategoryNames(): Promise<string[] | null> {
    const categories = new IncomeCategoryService();
    return categories.getCategoryNames();
  }

  static async getFrequencyNames(): Promise<string[] | null> {
    return FrequencyService.getFrequencyNames();
  }

  static async deleteIncomeById(
    userId: ObjectId,
    incomeId: string,
  ): Promise<Boolean> {
    const income = await IncomesRepository.getIncomeById(incomeId);
    if (!income.userId) return false;
    if (!income.userId.equals(userId)) return false;

    const result = IncomesRepository.deleteIncomeById(userId, incomeId);
    if (!result) return false;

    if (!income.isPlanned) {
      // not a planned income means it's income that has already happened
      await BudgetsService.modifyRunningAccountBalance(
        userId,
        'income',
        -income.amount,
      );
    }

    return result;
  }

  private static convertDates(income: IncomesModel): IncomesModel {
    let incomeToAdd = {
      ...income,
      date: new Date(income.date),
    };

    if (income.isEnding === false) {
      delete incomeToAdd.endDate;
    } else {
      incomeToAdd = {
        ...incomeToAdd,
        endDate: new Date(income.endDate),
      };
    }

    return incomeToAdd;
  }
}

export default IncomesService;

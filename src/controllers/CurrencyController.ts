import { Request, Response, NextFunction } from 'express';
import { CurrencyService } from '../services/impl/CurrencyService';

export class CurrencyController {
  private readonly currencyService: CurrencyService;

  constructor(currencyService: CurrencyService) {
    this.currencyService = currencyService;
  }

  /** GET /api/v1/currencies */
  getAllCurrencies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currencies = await this.currencyService.getAllCurrencies();
      res.status(200).json(currencies);
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/currencies/code/:code */
  getCurrencyByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      if (typeof code !== 'string') {
        return next({ status: 400, message: 'Invalid currency code parameter' });
      }
      const currency = await this.currencyService.getCurrencyByCode(code);
      res.status(200).json(currency);
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/currencies/:id */
  getCurrencyById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        return next({ status: 400, message: 'Invalid currency ID parameter' });
      }
      const currency = await this.currencyService.getCurrencyById(id);
      res.status(200).json(currency);
    } catch (error) {
      next(error);
    }
  };
}
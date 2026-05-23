import type { Request, Response } from "express";
import type { ICurrencyService } from "../services/interfaces/ICurrencyService";
import { getServiceContext } from "../http/requestContext";
import { sendData } from "../http/response";
export class CurrencyController {
  constructor(private readonly currencyService: ICurrencyService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const currencies = await this.currencyService.getAllCurrencies(getServiceContext(req));
    sendData(res, req, currencies);
  };

  getByCode = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { code: string } };
    const currency = await this.currencyService.getCurrencyByCode(
      params.code,
      getServiceContext(req),
    );
    sendData(res, req, currency);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const currency = await this.currencyService.getCurrencyById(params.id, getServiceContext(req));
    sendData(res, req, currency);
  };
}

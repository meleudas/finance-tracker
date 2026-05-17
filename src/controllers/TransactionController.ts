import type { Request, Response } from "express";
import type { ITransactionService } from "../services/interfaces/ITransactionService";
import { getServiceContext } from "../http/requestContext";
import { sendData, sendPaginated } from "../http/response";
import { unauthorizedError } from "../utils/apiError";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw unauthorizedError();
  }
  return userId;
}

export class TransactionController {
  constructor(private readonly transactionService: ITransactionService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as {
      body: Parameters<ITransactionService["createTransaction"]>[0];
    };
    const data = await this.transactionService.createTransaction(
      body,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as {
      query: Parameters<ITransactionService["getTransactions"]>[0];
    };
    const result = await this.transactionService.getTransactions(
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  listByAccount = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { accountId: string };
      query: Parameters<ITransactionService["getTransactionsByAccountId"]>[1];
    };
    const result = await this.transactionService.getTransactionsByAccountId(
      { id: params.accountId },
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  listByCategory = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { categoryId: string };
      query: Parameters<ITransactionService["getTransactionsByCategoryId"]>[1];
    };
    const result = await this.transactionService.getTransactionsByCategoryId(
      { id: params.categoryId },
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.transactionService.getTransaction(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<ITransactionService["updateTransaction"]>[0];
    };
    const data = await this.transactionService.updateTransaction(
      body,
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.transactionService.deleteTransaction(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}

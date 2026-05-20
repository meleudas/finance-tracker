import type { Request, Response } from "express";
import type { IBudgetService } from "../services/interfaces/IBudgetService";
import { getServiceContext } from "../http/requestContext";
import { sendData, sendPaginated } from "../http/response";
import { UnauthorizedError } from "../utils/errors/securityErrors";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export class BudgetController {
  constructor(private readonly budgetService: IBudgetService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as {
      query: Parameters<IBudgetService["listBudgets"]>[1];
    };
    const result = await this.budgetService.listBudgets(
      getUserId(req),
      query,
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.budgetService.getBudgetById(
      getUserId(req),
      params.id,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as {
      body: Parameters<IBudgetService["createBudget"]>[1];
    };
    const data = await this.budgetService.createBudget(
      getUserId(req),
      body,
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<IBudgetService["updateBudget"]>[2];
    };
    const data = await this.budgetService.updateBudget(
      getUserId(req),
      params.id,
      body,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  updateLimit = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<IBudgetService["updateBudgetLimit"]>[2];
    };
    const data = await this.budgetService.updateBudgetLimit(
      getUserId(req),
      params.id,
      body,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.budgetService.deleteBudget(
      getUserId(req),
      params.id,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  getProgress = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as { query?: { date?: Date } };
    const targetDate = query?.date ?? new Date();
    const data = await this.budgetService.getBudgetsProgress(
      getUserId(req),
      targetDate,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}

import type { Request, Response } from "express";
import type { IRecurringRuleService } from "../services/interfaces/IRecurringRuleService";
import { getServiceContext } from "../http/requestContext";
import { sendData, sendPaginated } from "../http/response";
import { UnauthorizedError } from "../utils/errors/securityErrors";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

export class RecurringRuleController {
  constructor(private readonly ruleService: IRecurringRuleService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as {
      query: Parameters<IRecurringRuleService["list"]>[1];
    };
    const result = await this.ruleService.list(getUserId(req), query, getServiceContext(req));
    sendPaginated(res, req, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.ruleService.getById(getUserId(req), params.id, getServiceContext(req));
    sendData(res, req, data);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as {
      body: Parameters<IRecurringRuleService["create"]>[1];
    };
    const data = await this.ruleService.create(getUserId(req), body, getServiceContext(req));
    sendData(res, req, data, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<IRecurringRuleService["update"]>[2];
    };
    const data = await this.ruleService.update(
      getUserId(req),
      params.id,
      body,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.ruleService.remove(getUserId(req), params.id, getServiceContext(req));
    sendData(res, req, data);
  };
}

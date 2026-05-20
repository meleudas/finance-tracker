import type { Request, Response } from "express";
import type { IAccountService } from "../services/interfaces/IAccountService";
import { getServiceContext } from "../http/requestContext";
import { sendData, sendPaginated } from "../http/response";
import { unauthorizedError } from "../utils/apiError";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw unauthorizedError();
  return userId;
}

export class AccountController {
  constructor(private readonly accountService: IAccountService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as { body: Parameters<IAccountService["createAccount"]>[0] };
    const data = await this.accountService.createAccount(
      body,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as { query: Parameters<IAccountService["getAccounts"]>[0] };
    const result = await this.accountService.getAccounts(
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.accountService.getAccount(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<IAccountService["updateAccount"]>[0];
    };
    const data = await this.accountService.updateAccount(
      body,
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.accountService.deleteAccount(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}

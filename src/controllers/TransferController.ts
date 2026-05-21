import type { Request, Response } from "express";
import type { ITransferService } from "../services/interfaces/ITransferService";
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

export class TransferController {
  constructor(private readonly transferService: ITransferService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const { body } = req.validated as { body: Parameters<ITransferService["createTransfer"]>[0] };
    const data = await this.transferService.createTransfer(
      body,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.validated as {
      query: Parameters<ITransferService["getTransfers"]>[0];
    };
    const result = await this.transferService.getTransfers(
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  listByAccount = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { accountId: string };
      query: Parameters<ITransferService["getTransfersByAccountId"]>[1];
    };
    const result = await this.transferService.getTransfersByAccountId(
      { id: params.accountId },
      query,
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendPaginated(res, req, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.transferService.getTransfer(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { id: string };
      body: Parameters<ITransferService["updateTransfer"]>[0];
    };
    const data = await this.transferService.updateTransfer(
      body,
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { id: string } };
    const data = await this.transferService.deleteTransfer(
      { id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}

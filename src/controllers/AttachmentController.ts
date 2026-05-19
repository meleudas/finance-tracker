import type { Request, Response } from "express";
import { uploadAttachmentSchema } from "../dtos/attachment/UploadAttachment.dto";
import type { IAttachmentService } from "../services/interfaces/IAttachmentService";
import { getServiceContext } from "../http/requestContext";
import { sendData } from "../http/response";
import { parseOrThrow } from "../utils/zodParse";
import { unauthorizedError, validationError } from "../utils/apiError";

function getUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw unauthorizedError();
  }
  return userId;
}

function readMultipartField(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export class AttachmentController {
  constructor(private readonly attachmentService: IAttachmentService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { transactionId: string };
      query?: Parameters<IAttachmentService["getAttachments"]>[2];
    };
    const data = await this.attachmentService.getAttachments(
      { transactionId: params.transactionId },
      { id: getUserId(req) },
      query,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { transactionId: string; id: string };
      query?: Parameters<IAttachmentService["getAttachment"]>[2];
    };
    const data = await this.attachmentService.getAttachment(
      { transactionId: params.transactionId, id: params.id },
      { id: getUserId(req) },
      query,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  getDownloadUrl = async (req: Request, res: Response): Promise<void> => {
    const { params, query } = req.validated as {
      params: { transactionId: string; id: string };
      query?: Parameters<IAttachmentService["getAttachmentDownloadUrl"]>[2];
    };
    const data = await this.attachmentService.getAttachmentDownloadUrl(
      { transactionId: params.transactionId, id: params.id },
      { id: getUserId(req) },
      query,
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  upload = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as { params: { transactionId: string } };
    const file = req.file;

    if (!file) {
      throw validationError("File field is required");
    }

    const metadata = parseOrThrow(uploadAttachmentSchema, {
      originalName: readMultipartField(req.body, "originalName") ?? file.originalname,
      mimeType: readMultipartField(req.body, "mimeType") ?? file.mimetype,
    });

    const data = await this.attachmentService.uploadAttachment(
      {
        ...metadata,
        buffer: file.buffer,
      },
      { transactionId: params.transactionId },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  createPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { transactionId: string };
      body: Parameters<IAttachmentService["getPresignedUploadUrl"]>[0];
    };
    const data = await this.attachmentService.getPresignedUploadUrl(
      body,
      { transactionId: params.transactionId },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { params, body } = req.validated as {
      params: { transactionId: string; id: string };
      body: Parameters<IAttachmentService["updateAttachment"]>[0];
    };
    const data = await this.attachmentService.updateAttachment(
      body,
      { transactionId: params.transactionId, id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { params } = req.validated as {
      params: { transactionId: string; id: string };
    };
    const data = await this.attachmentService.deleteAttachment(
      { transactionId: params.transactionId, id: params.id },
      { id: getUserId(req) },
      getServiceContext(req),
    );
    sendData(res, req, data);
  };
}

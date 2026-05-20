import type { RequestHandler } from "express";
import { z } from "zod";

import { CreateTransferSchema } from "../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferSchema } from "../dtos/transfer/UpdateTransfer.dto";
import { transferListQuerySchema } from "../dtos/transfer/TransferListQuery.dto";
import { idDtoSchema } from "../dtos/common/id.dto";

interface ValidationTarget {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

interface ValidatedRequest {
  validated: Record<string, unknown>;
}

const createRequestValidator = (config: ValidationTarget): RequestHandler => {
  return (req, res, next) => {
    try {
      const validated: Record<string, unknown> = {};
      if (config.body) validated.body = config.body.parse(req.body);
      if (config.params) validated.params = config.params.parse(req.params);
      if (config.query) validated.query = config.query.parse(req.query);

      (req as unknown as ValidatedRequest).validated = validated;
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
      } else {
        next(error);
      }
    }
  };
};

const accountIdParamSchema = z.object({ accountId: idDtoSchema.shape.id });

export const ListTransfersRequestValidator = createRequestValidator({
  query: transferListQuerySchema,
});

export const ListTransfersByAccountRequestValidator = createRequestValidator({
  params: accountIdParamSchema,
  query: transferListQuerySchema,
});

export const CreateTransferRequestValidator = createRequestValidator({
  body: CreateTransferSchema,
});

export const GetTransferRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateTransferRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateTransferSchema,
});

export const DeleteTransferRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

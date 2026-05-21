import type { RequestHandler } from "express";
import { z } from "zod";

import { CreateTransactionSchema } from "../dtos/transaction/CreateTransaction.dto";
import { UpdateTransactionSchema } from "../dtos/transaction/UpdateTransaction.dto";
import { transactionListQuerySchema } from "../dtos/transaction/TransactionListQuery.dto";
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
const categoryIdParamSchema = z.object({ categoryId: idDtoSchema.shape.id });

export const ListTransactionsRequestValidator = createRequestValidator({
  query: transactionListQuerySchema,
});

export const ListTransactionsByAccountRequestValidator = createRequestValidator({
  params: accountIdParamSchema,
  query: transactionListQuerySchema,
});

export const ListTransactionsByCategoryRequestValidator = createRequestValidator({
  params: categoryIdParamSchema,
  query: transactionListQuerySchema,
});

export const CreateTransactionRequestValidator = createRequestValidator({
  body: CreateTransactionSchema,
});

export const GetTransactionRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

export const UpdateTransactionRequestValidator = createRequestValidator({
  params: idDtoSchema,
  body: UpdateTransactionSchema,
});

export const DeleteTransactionRequestValidator = createRequestValidator({
  params: idDtoSchema,
});

import { z } from "zod";
import { idDtoSchema } from "../dtos/common/id.dto";
import { CreateTransactionSchema } from "../dtos/transaction/CreateTransaction.dto";
import { UpdateTransactionSchema } from "../dtos/transaction/UpdateTransaction.dto";
import { transactionListQuerySchema } from "../dtos/transaction/TransactionListQuery.dto";

const emptyQuerySchema = z.object({}).strict();

/** GET /transactions/:id */
export const GetTransactionRequestValidator = z.object({
  params: idDtoSchema,
  query: emptyQuerySchema.optional(),
});

/** GET /transactions */
export const ListTransactionsRequestValidator = z.object({
  query: transactionListQuerySchema,
});

/** POST /transactions */
export const CreateTransactionRequestValidator = z.object({
  body: CreateTransactionSchema,
});

/** PATCH /transactions/:id */
export const UpdateTransactionRequestValidator = z.object({
  params: idDtoSchema,
  body: UpdateTransactionSchema,
});

/** DELETE /transactions/:id */
export const DeleteTransactionRequestValidator = z.object({
  params: idDtoSchema,
});

/** GET /transactions/accounts/:accountId */
export const ListTransactionsByAccountRequestValidator = z.object({
  params: z.object({ accountId: idDtoSchema.shape.id }),
  query: transactionListQuerySchema,
});

/** GET /transactions/categories/:categoryId */
export const ListTransactionsByCategoryRequestValidator = z.object({
  params: z.object({ categoryId: idDtoSchema.shape.id }),
  query: transactionListQuerySchema,
});

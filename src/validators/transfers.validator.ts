import { z } from "zod";
import { idDtoSchema } from "../dtos/common/id.dto";
import { CreateTransferSchema } from "../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferSchema } from "../dtos/transfer/UpdateTransfer.dto";
import { transferListQuerySchema } from "../dtos/transfer/TransferListQuery.dto";

const emptyQuerySchema = z.object({}).strict();

/** GET /transfers/:id */
export const GetTransferRequestValidator = z.object({
  params: idDtoSchema,
  query: emptyQuerySchema.optional(),
});

/** GET /transfers */
export const ListTransfersRequestValidator = z.object({
  query: transferListQuerySchema,
});

/** POST /transfers */
export const CreateTransferRequestValidator = z.object({
  body: CreateTransferSchema,
});

/** PATCH /transfers/:id */
export const UpdateTransferRequestValidator = z.object({
  params: idDtoSchema,
  body: UpdateTransferSchema,
});

/** DELETE /transfers/:id */
export const DeleteTransferRequestValidator = z.object({
  params: idDtoSchema,
});

/** GET /transfers/accounts/:accountId */
export const ListTransfersByAccountRequestValidator = z.object({
  params: z.object({ accountId: idDtoSchema.shape.id }),
  query: transferListQuerySchema,
});

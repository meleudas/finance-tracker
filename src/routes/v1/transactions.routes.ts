import { Router } from "express";
import { transactionController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireUser } from "../../middleware/requireUser";
import { validate } from "../../middleware/validate";
import {
  CreateTransactionRequestValidator,
  DeleteTransactionRequestValidator,
  GetTransactionRequestValidator,
  ListTransactionsByAccountRequestValidator,
  ListTransactionsByCategoryRequestValidator,
  ListTransactionsRequestValidator,
  UpdateTransactionRequestValidator,
} from "../../validators/transactions.validator";

const router = Router();

router.use(requireUser);

router.get(
  "/",
  validate(ListTransactionsRequestValidator),
  asyncHandler(transactionController.list),
);

router.get(
  "/accounts/:accountId",
  validate(ListTransactionsByAccountRequestValidator),
  asyncHandler(transactionController.listByAccount),
);

router.get(
  "/categories/:categoryId",
  validate(ListTransactionsByCategoryRequestValidator),
  asyncHandler(transactionController.listByCategory),
);

router.post(
  "/",
  validate(CreateTransactionRequestValidator),
  asyncHandler(transactionController.create),
);

router.get(
  "/:id",
  validate(GetTransactionRequestValidator),
  asyncHandler(transactionController.getById),
);

router.patch(
  "/:id",
  validate(UpdateTransactionRequestValidator),
  asyncHandler(transactionController.update),
);

router.delete(
  "/:id",
  validate(DeleteTransactionRequestValidator),
  asyncHandler(transactionController.remove),
);

export default router;

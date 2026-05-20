import { Router } from "express";
import { transactionController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
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

router.get("/", ListTransactionsRequestValidator, asyncHandler(transactionController.list));

router.get(
  "/accounts/:accountId",
  ListTransactionsByAccountRequestValidator,
  asyncHandler(transactionController.listByAccount),
);

router.get(
  "/categories/:categoryId",
  ListTransactionsByCategoryRequestValidator,
  asyncHandler(transactionController.listByCategory),
);

router.post("/", CreateTransactionRequestValidator, asyncHandler(transactionController.create));

router.get("/:id", GetTransactionRequestValidator, asyncHandler(transactionController.getById));

router.patch("/:id", UpdateTransactionRequestValidator, asyncHandler(transactionController.update));

router.delete(
  "/:id",
  DeleteTransactionRequestValidator,
  asyncHandler(transactionController.remove),
);

export default router;

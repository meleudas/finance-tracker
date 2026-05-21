import { Router } from "express";
import { transferController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateTransferRequestValidator,
  DeleteTransferRequestValidator,
  GetTransferRequestValidator,
  ListTransfersByAccountRequestValidator,
  ListTransfersRequestValidator,
  UpdateTransferRequestValidator,
} from "../../validators/transfers.validator";

const router = Router();

router.get("/", ListTransfersRequestValidator, asyncHandler(transferController.list));

router.get(
  "/accounts/:accountId",
  ListTransfersByAccountRequestValidator,
  asyncHandler(transferController.listByAccount),
);

router.post("/", CreateTransferRequestValidator, asyncHandler(transferController.create));

router.get("/:id", GetTransferRequestValidator, asyncHandler(transferController.getById));

router.patch("/:id", UpdateTransferRequestValidator, asyncHandler(transferController.update));

router.delete("/:id", DeleteTransferRequestValidator, asyncHandler(transferController.remove));

export default router;

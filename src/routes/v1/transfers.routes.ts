import { Router } from "express";
import { transferController } from "../../container";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireUser } from "../../middleware/requireUser";
import { validate } from "../../middleware/validate";
import {
  CreateTransferRequestValidator,
  DeleteTransferRequestValidator,
  GetTransferRequestValidator,
  ListTransfersByAccountRequestValidator,
  ListTransfersRequestValidator,
  UpdateTransferRequestValidator,
} from "../../validators/transfers.validator";

const router = Router();

router.use(requireUser);

router.get("/", validate(ListTransfersRequestValidator), asyncHandler(transferController.list));

router.get(
  "/accounts/:accountId",
  validate(ListTransfersByAccountRequestValidator),
  asyncHandler(transferController.listByAccount),
);

router.post("/", validate(CreateTransferRequestValidator), asyncHandler(transferController.create));

router.get("/:id", validate(GetTransferRequestValidator), asyncHandler(transferController.getById));

router.patch(
  "/:id",
  validate(UpdateTransferRequestValidator),
  asyncHandler(transferController.update),
);

router.delete(
  "/:id",
  validate(DeleteTransferRequestValidator),
  asyncHandler(transferController.remove),
);

export default router;

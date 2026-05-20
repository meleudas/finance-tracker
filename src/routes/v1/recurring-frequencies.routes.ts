import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateRecurringFrequencyRequestValidator,
  DeleteRecurringFrequencyRequestValidator,
  GetRecurringFrequencyRequestValidator,
  ListRecurringFrequenciesRequestValidator,
  UpdateRecurringFrequencyRequestValidator,
} from "../../validators/recurring-frequency.validator";
import { recurringFrequencyController } from "../../container";

const router = Router();

router.get(
  "/",
  ListRecurringFrequenciesRequestValidator,
  asyncHandler(recurringFrequencyController.list),
);
router.post(
  "/",
  CreateRecurringFrequencyRequestValidator,
  asyncHandler(recurringFrequencyController.create),
);
router.get(
  "/:id",
  GetRecurringFrequencyRequestValidator,
  asyncHandler(recurringFrequencyController.getById),
);
router.patch(
  "/:id",
  UpdateRecurringFrequencyRequestValidator,
  asyncHandler(recurringFrequencyController.update),
);
router.delete(
  "/:id",
  DeleteRecurringFrequencyRequestValidator,
  asyncHandler(recurringFrequencyController.remove),
);

export default router;

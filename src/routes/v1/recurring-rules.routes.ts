import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateRecurringRuleRequestValidator,
  DeleteRecurringRuleRequestValidator,
  GetRecurringRuleRequestValidator,
  ListRecurringRulesRequestValidator,
  UpdateRecurringRuleRequestValidator,
} from "../../validators/recurring-rule.validator";
import { recurringRuleController } from "../../container";

const router = Router();

router.get("/", ListRecurringRulesRequestValidator, asyncHandler(recurringRuleController.list));
router.post("/", CreateRecurringRuleRequestValidator, asyncHandler(recurringRuleController.create));
router.get("/:id", GetRecurringRuleRequestValidator, asyncHandler(recurringRuleController.getById));
router.patch(
  "/:id",
  UpdateRecurringRuleRequestValidator,
  asyncHandler(recurringRuleController.update),
);
router.delete(
  "/:id",
  DeleteRecurringRuleRequestValidator,
  asyncHandler(recurringRuleController.remove),
);

export default router;

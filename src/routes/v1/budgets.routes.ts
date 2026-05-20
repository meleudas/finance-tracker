import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  BudgetProgressQueryValidator,
  CreateBudgetRequestValidator,
  DeleteBudgetRequestValidator,
  GetBudgetRequestValidator,
  ListBudgetsRequestValidator,
  UpdateBudgetLimitRequestValidator,
  UpdateBudgetRequestValidator,
} from "../../validators/budget.validator";
import { budgetController } from "../../container";

const router = Router();

router.get("/", ListBudgetsRequestValidator, asyncHandler(budgetController.list));
router.get("/progress", BudgetProgressQueryValidator, asyncHandler(budgetController.getProgress));
router.post("/", CreateBudgetRequestValidator, asyncHandler(budgetController.create));
router.get("/:id", GetBudgetRequestValidator, asyncHandler(budgetController.getById));
router.patch("/:id", UpdateBudgetRequestValidator, asyncHandler(budgetController.update));
router.put(
  "/:id/limit",
  UpdateBudgetLimitRequestValidator,
  asyncHandler(budgetController.updateLimit),
);
router.delete("/:id", DeleteBudgetRequestValidator, asyncHandler(budgetController.remove));

export default router;

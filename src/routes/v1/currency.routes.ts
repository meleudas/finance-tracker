import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  GetCurrencyByCodeRequestValidator,
  GetCurrencyByIdRequestValidator,
  ListCurrenciesRequestValidator,
} from "../../validators/currency.validator";
import { currencyController } from "../../container";

const router = Router();

router.get(
  "/code/:code",
  GetCurrencyByCodeRequestValidator,
  asyncHandler(currencyController.getByCode),
);
router.get("/:id", GetCurrencyByIdRequestValidator, asyncHandler(currencyController.getById));
router.get("/", ListCurrenciesRequestValidator, asyncHandler(currencyController.list));

export default router;

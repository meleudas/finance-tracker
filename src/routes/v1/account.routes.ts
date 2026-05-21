import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  CreateAccountRequestValidator,
  DeleteAccountRequestValidator,
  GetAccountRequestValidator,
  ListAccountsRequestValidator,
  UpdateAccountRequestValidator,
} from "../../validators/account.validator";
import { accountController } from "../../container";

const router = Router();
router.get("/", ListAccountsRequestValidator, asyncHandler(accountController.list));
router.post("/", CreateAccountRequestValidator, asyncHandler(accountController.create));
router.get("/:id", GetAccountRequestValidator, asyncHandler(accountController.getById));
router.patch("/:id", UpdateAccountRequestValidator, asyncHandler(accountController.update));
router.delete("/:id", DeleteAccountRequestValidator, asyncHandler(accountController.remove));

export default router;

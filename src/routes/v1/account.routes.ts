import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireUser } from "../../middleware/requireUser";
import {
  CreateAccountRequestValidator,
  DeleteAccountRequestValidator,
  GetAccountRequestValidator,
  ListAccountsRequestValidator,
  UpdateAccountRequestValidator,
} from "../../validators/account.validator";
import { AccountRepository } from "../../repositories/impl/AccountRepository";
import { AccountService } from "../../services/impl/AccountService";
import { AccountController } from "../../controllers/AccountController";
import { Cache } from "../../redis";

const accountRepository = new AccountRepository();
const cache = new Cache();
const accountService = new AccountService(accountRepository, cache);
const accountController = new AccountController(accountService);

const router = Router();
router.use(requireUser);

router.get("/", ListAccountsRequestValidator, asyncHandler(accountController.list));
router.post("/", CreateAccountRequestValidator, asyncHandler(accountController.create));
router.get("/:id", GetAccountRequestValidator, asyncHandler(accountController.getById));
router.patch("/:id", UpdateAccountRequestValidator, asyncHandler(accountController.update));
router.delete("/:id", DeleteAccountRequestValidator, asyncHandler(accountController.remove));

export default router;

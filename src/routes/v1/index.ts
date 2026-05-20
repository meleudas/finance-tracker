import { Router } from "express";
import transactionsRouter from "./transactions.routes";
import transfersRouter from "./transfers.routes";
import attachmentsRouter from "./attachments.routes";
import accountRoutes from "./account.routes";
import budgetsRouter from "./budgets.routes";
import categoriesRouter from "./categories.routes";
import currencyRouter from "./currency.routes";
import { createAuthRouter } from "./auth.routes";
import { createRequireAuth } from "../../middleware/requireAuth";
import { getAuthController, getAuthService } from "../../container";

const router = Router();

const authService = getAuthService();
const requireAuth = createRequireAuth(authService);

router.use("/auth", createAuthRouter({ authService, authController: getAuthController() }));

const protectedApi = Router();
protectedApi.use(requireAuth);
protectedApi.use("/transactions", transactionsRouter);
protectedApi.use("/transfers", transfersRouter);
protectedApi.use("/transactions/:transactionId/attachments", attachmentsRouter);
protectedApi.use("/accounts", accountRoutes);
protectedApi.use("/budgets", budgetsRouter);
protectedApi.use("/categories", categoriesRouter);
protectedApi.use("/currencies", currencyRouter);

router.use(protectedApi);

export default router;

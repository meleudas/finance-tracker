import { Router } from "express";
import transactionsRouter from "./transactions.routes";
import transfersRouter from "./transfers.routes";
import attachmentsRouter from "./attachments.routes";
import accountRoutes from "./account.routes";
import budgetsRouter from "./budgets.routes";
import categoriesRouter from "./categories.routes";
import currencyRouter from "./currency.routes";
import reportsRouter from "./reports.routes";
import recurringFrequenciesRouter from "./recurring-frequencies.routes";
import recurringRulesRouter from "./recurring-rules.routes";
import { createAuthRouter } from "./auth.routes";
import { createRequireAuth } from "../../middleware/requireAuth";
import { getAuthController, getAuthService } from "../../container";

const router = Router();

const authService = getAuthService();
const requireAuth = createRequireAuth(authService);

/** Public routes — no JWT (registration/login must stay reachable). */
router.use("/auth", createAuthRouter({ authService, authController: getAuthController() }));
router.use("/currencies", currencyRouter);

/** Protected routes — requireAuth only on these prefixes (never on /auth). */
router.use("/transactions", requireAuth, transactionsRouter);
router.use("/transfers", requireAuth, transfersRouter);
router.use("/transactions/:transactionId/attachments", requireAuth, attachmentsRouter);
router.use("/accounts", requireAuth, accountRoutes);
router.use("/budgets", requireAuth, budgetsRouter);
router.use("/categories", requireAuth, categoriesRouter);
router.use("/reports", requireAuth, reportsRouter);
router.use("/recurring-frequencies", requireAuth, recurringFrequenciesRouter);
router.use("/recurring-rules", requireAuth, recurringRulesRouter);

export default router;

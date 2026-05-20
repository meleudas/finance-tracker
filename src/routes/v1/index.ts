import { Router } from "express";
import transactionsRouter from "./transactions.routes";
import transfersRouter from "./transfers.routes";
import attachmentsRouter from "./attachments.routes";
import authRouter from "./auth.routes";
import accountRoutes from "./account.routes";

const router = Router();

router.use("/transactions", transactionsRouter);
router.use("/transfers", transfersRouter);
router.use("/transactions/:transactionId/attachments", attachmentsRouter);
router.use("/auth", authRouter);
router.use("/accounts", accountRoutes);

export default router;

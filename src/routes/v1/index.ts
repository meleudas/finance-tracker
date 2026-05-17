import { Router } from "express";
import transactionsRouter from "./transactions.routes";
import transfersRouter from "./transfers.routes";
import attachmentsRouter from "./attachments.routes";

const router = Router();

router.use("/transactions", transactionsRouter);
router.use("/transfers", transfersRouter);
router.use("/transactions/:transactionId/attachments", attachmentsRouter);

export default router;

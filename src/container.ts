import { Cache } from "./redis";
import type { ICache } from "./redis";
import { TransactionRepository } from "./repositories/impl/TransactionRepository";
import { TransferRepository } from "./repositories/impl/TransferRepository";
import { AttachmentRepository } from "./repositories/impl/AttachmentRepository";
import { TransactionService } from "./services/impl/TransactionService";
import { TransferService } from "./services/impl/TransferService";
import { AttachmentService } from "./services/impl/AttachmentService";
import { FileStorage } from "./storage";
import type { ITransactionService } from "./services/interfaces/ITransactionService";
import type { ITransferService } from "./services/interfaces/ITransferService";
import type { IAttachmentService } from "./services/interfaces/IAttachmentService";
import { TransactionController } from "./controllers/TransactionController";
import { TransferController } from "./controllers/TransferController";
import { AttachmentController } from "./controllers/AttachmentController";

let cache: ICache | undefined;
let transactionService: ITransactionService | undefined;
let transferService: ITransferService | undefined;
let attachmentService: IAttachmentService | undefined;

function getCache(): ICache {
  cache ??= new Cache();
  return cache;
}

export function getTransactionService(): ITransactionService {
  transactionService ??= new TransactionService(new TransactionRepository(), getCache());
  return transactionService;
}

export function getTransferService(): ITransferService {
  transferService ??= new TransferService(new TransferRepository(), getCache());
  return transferService;
}

export function getAttachmentService(): IAttachmentService {
  attachmentService ??= new AttachmentService(
    new AttachmentRepository(),
    new TransactionRepository(),
    new FileStorage(),
    getCache(),
  );
  return attachmentService;
}

export const transactionController = new TransactionController(getTransactionService());
export const transferController = new TransferController(getTransferService());
export const attachmentController = new AttachmentController(getAttachmentService());

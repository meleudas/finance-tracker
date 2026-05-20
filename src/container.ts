/**
 * Composition root: the only place that instantiates concrete implementations (repos, cache, storage).
 * Services and controllers depend on interfaces (I*Service, I*Repository, IFileStorage, ICache).
 */
import { config } from "./config/ConfigService";
import { Cache } from "./redis";
import type { ICache } from "./redis";
import { TransactionRepository } from "./repositories/impl/TransactionRepository";
import { AccountRepository } from "./repositories/impl/AccountRepository";
import { CategoryRepository } from "./repositories/impl/CategoryRepository";
import { TransferRepository } from "./repositories/impl/TransferRepository";
import { AttachmentRepository } from "./repositories/impl/AttachmentRepository";
import { BudgetRepository } from "./repositories/impl/BudgetRepository";
import { CurrencyRepository } from "./repositories/impl/CurrencyRepository";
import { UserRepository } from "./repositories/impl/UserRepository";
import { TransactionService } from "./services/impl/TransactionService";
import { TransferService } from "./services/impl/TransferService";
import { AttachmentService } from "./services/impl/AttachmentService";
import { AccountService } from "./services/impl/AccountService";
import { CategoryService } from "./services/impl/CategoryService";
import { BudgetService } from "./services/impl/BudgetService";
import { CurrencyService } from "./services/impl/CurrencyService";
import { AuthService } from "./services/impl/AuthService";
import { TokenService } from "./services/impl/TokenService";
import { FileStorage } from "./storage/FileStorage";
import type { IFileStorage } from "./storage/IFileStorage";
import type { IUserRepository } from "./repositories/interfaces/IUserRepository";
import type { ITokenService } from "./services/interfaces/ITokenService";
import type { ITransactionService } from "./services/interfaces/ITransactionService";
import type { ITransferService } from "./services/interfaces/ITransferService";
import type { IAttachmentService } from "./services/interfaces/IAttachmentService";
import type { IAccountService } from "./services/interfaces/IAccountService";
import type { ICategoryService } from "./services/interfaces/ICategoryService";
import type { IBudgetService } from "./services/interfaces/IBudgetService";
import type { ICurrencyService } from "./services/interfaces/ICurrencyService";
import type { IAuthService } from "./services/interfaces/IAuthService";
import { TransactionController } from "./controllers/TransactionController";
import { TransferController } from "./controllers/TransferController";
import { AttachmentController } from "./controllers/AttachmentController";
import { AccountController } from "./controllers/AccountController";
import { CategoryController } from "./controllers/CategoryController";
import { BudgetController } from "./controllers/BudgetController";
import { CurrencyController } from "./controllers/CurrencyController";
import { AuthController } from "./controllers/AuthController";

let cache: ICache | undefined;
let fileStorage: IFileStorage | undefined;
let userRepository: IUserRepository | undefined;
let tokenService: ITokenService | undefined;
let transactionService: ITransactionService | undefined;
let transferService: ITransferService | undefined;
let attachmentService: IAttachmentService | undefined;
let accountService: IAccountService | undefined;
let categoryService: ICategoryService | undefined;
let budgetService: IBudgetService | undefined;
let currencyService: ICurrencyService | undefined;
let authService: IAuthService | undefined;
let authController: AuthController | undefined;

export function getCache(): ICache {
  cache ??= new Cache();
  return cache;
}

export function getFileStorage(): IFileStorage {
  fileStorage ??= new FileStorage();
  return fileStorage;
}

export function getUserRepository(): IUserRepository {
  userRepository ??= new UserRepository();
  return userRepository;
}

export function getTokenService(): ITokenService {
  tokenService ??= new TokenService(config);
  return tokenService;
}

export function getAuthService(): IAuthService {
  authService ??= new AuthService(getUserRepository(), getTokenService(), getCache());
  return authService;
}

export function getAuthController(): AuthController {
  authController ??= new AuthController(getAuthService(), config);
  return authController;
}

export function getTransactionService(): ITransactionService {
  transactionService ??= new TransactionService(
    new TransactionRepository(),
    new AccountRepository(),
    new CategoryRepository(),
    new AttachmentRepository(),
    getCache(),
  );
  return transactionService;
}

export function getTransferService(): ITransferService {
  transferService ??= new TransferService(
    new TransferRepository(),
    new AccountRepository(),
    getCache(),
  );
  return transferService;
}

export function getAttachmentService(): IAttachmentService {
  attachmentService ??= new AttachmentService(
    new AttachmentRepository(),
    new TransactionRepository(),
    getFileStorage(),
    getCache(),
  );
  return attachmentService;
}

export function getAccountService(): IAccountService {
  accountService ??= new AccountService(new AccountRepository(), getCache());
  return accountService;
}

export function getCategoryService(): ICategoryService {
  categoryService ??= new CategoryService(new CategoryRepository(), getCache());
  return categoryService;
}

export function getBudgetService(): IBudgetService {
  budgetService ??= new BudgetService(
    new BudgetRepository(),
    new AccountRepository(),
    new CategoryRepository(),
    new TransactionRepository(),
    new CurrencyRepository(),
    getCache(),
  );
  return budgetService;
}

export function getCurrencyService(): ICurrencyService {
  currencyService ??= new CurrencyService(new CurrencyRepository(), getCache());
  return currencyService;
}

export const transactionController = new TransactionController(getTransactionService());
export const transferController = new TransferController(getTransferService());
export const attachmentController = new AttachmentController(getAttachmentService());
export const accountController = new AccountController(getAccountService());
export const categoryController = new CategoryController(getCategoryService());
export const budgetController = new BudgetController(getBudgetService());
export const currencyController = new CurrencyController(getCurrencyService());

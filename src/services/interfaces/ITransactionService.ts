import { DeleteResponseDto, IdDto } from "../../dtos/common";
import { TransactionListQueryDto } from "../../dtos/transaction/TransactionListQuery.dto";
import {
  CreateTransactionDto,
  TransactionResponseDto,
  UpdateTransactionDto,
} from "../../dtos/transaction";
import { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { ServiceContext } from "../serviceContext";

export interface ITransactionService {
  createTransaction(
    transaction: CreateTransactionDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto>;
  updateTransaction(
    transaction: UpdateTransactionDto,
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto>;
  deleteTransaction(
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto>;
  getTransaction(
    transactionId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransactionResponseDto>;
  getTransactions(
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>>;
  getTransactionsByAccountId(
    accountId: IdDto,
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>>;
  getTransactionsByCategoryId(
    categoryId: IdDto,
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>>;
  getTransactionsByUserId(
    query: TransactionListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransactionResponseDto>>;
}

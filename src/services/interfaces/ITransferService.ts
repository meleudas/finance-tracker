import { DeleteResponseDto, IdDto } from "../../dtos/common";
import { CreateTransferDto } from "../../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferDto } from "../../dtos/transfer/UpdateTransfer.dto";
import { TransferListQueryDto } from "../../dtos/transfer/TransferListQuery.dto";
import { TransferResponseDto } from "../../dtos/transfer/TransferResponse.dto";
import { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { ServiceContext } from "../serviceContext";

export interface ITransferService {
  createTransfer(
    transfer: CreateTransferDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransferResponseDto>;
  updateTransfer(
    transfer: UpdateTransferDto,
    transferId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<TransferResponseDto>;
  deleteTransfer(
    transferId: IdDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<DeleteResponseDto>;
  getTransfer(transferId: IdDto, userId: IdDto, ctx?: ServiceContext): Promise<TransferResponseDto>;
  getTransfers(
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>>;
  getTransfersByAccountId(
    accountId: IdDto,
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>>;
  getTransfersByUserId(
    query: TransferListQueryDto,
    userId: IdDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<TransferResponseDto>>;
}

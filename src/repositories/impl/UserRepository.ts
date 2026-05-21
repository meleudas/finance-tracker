import { IUserRepository } from "../interfaces/IUserRepository";
import { BaseRepository, PrismaDelegate } from "./BaseRepository";
import { User } from "../../generated/prisma/client";
import { withAbortSignal } from "../../utils/helpers/withAbortSignal";
import { UserWithRelations } from "../../types/user/UserWithRelations";
import { UserWithAccounts } from "../../types/user/UserWithAccounts";
import { UserWithTransactions } from "../../types/user/UserWithTransactions";
import { RequestOptions } from "../interfaces/IBaseRepository";

export class UserRepository extends BaseRepository<User> implements IUserRepository {
  protected get delegate(): PrismaDelegate {
    return this.prisma.user as PrismaDelegate;
  }

  async findByEmail(email: string, options?: RequestOptions): Promise<User | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: { email, isDeleted: false },
      }) as Promise<User | null>,
      options?.signal,
    );
  }

  async findByIdWithRelations(
    id: string,
    options?: RequestOptions,
  ): Promise<UserWithRelations | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          accounts: true,
          transactions: true,
          categories: true,
          budgets: true,
          recurringRules: true,
        },
      }) as Promise<UserWithRelations | null>,
      options?.signal,
    );
  }

  async findByEmailWithRelations(
    email: string,
    options?: RequestOptions,
  ): Promise<UserWithRelations | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: {
          email,
          isDeleted: false,
        },
        include: {
          accounts: true,
          transactions: true,
          categories: true,
          budgets: true,
          recurringRules: true,
        },
      }) as Promise<UserWithRelations | null>,
      options?.signal,
    );
  }

  async existsByEmail(email: string, options?: RequestOptions): Promise<boolean> {
    const count = await withAbortSignal(
      this.delegate.count({
        where: {
          email,
          isDeleted: false,
        },
      }) as Promise<number>,
      options?.signal,
    );

    return count > 0;
  }

  async findWithAccounts(id: string, options?: RequestOptions): Promise<UserWithAccounts | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          accounts: true,
        },
      }) as Promise<UserWithAccounts>,
      options?.signal,
    );
  }

  async findWithTransactions(
    id: string,
    options?: RequestOptions,
  ): Promise<UserWithTransactions | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          transactions: true,
        },
      }) as Promise<UserWithTransactions>,
      options?.signal,
    );
  }
}

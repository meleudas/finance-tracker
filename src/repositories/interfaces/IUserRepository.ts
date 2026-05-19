import { IBaseRepository } from "./IBaseRepository";
import { User } from "../../generated/prisma/client";
import { UserWithTransactions } from "../../types/user/UserWithTransactions";
import { UserWithAccounts } from "../../types/user/UserWithAccounts";
import { UserWithRelations } from "../../types/user/UserWithRelations";
import { RequestOptions } from "./IBaseRepository";

export interface IUserRepository extends IBaseRepository<User> {
  /**
   * Пошук користувача за електронною поштою.
   */
  findByEmail(email: string, options?: RequestOptions): Promise<User | null>;

  /**
   * Пошук користувача за ID з усіма пов'язаними сутностями.
   */
  findByIdWithRelations(id: string, options?: RequestOptions): Promise<UserWithRelations | null>;

  /**
   * Пошук користувача за email з усіма пов'язаними сутностями.
   */
  findByEmailWithRelations(
    email: string,
    options?: RequestOptions,
  ): Promise<UserWithRelations | null>;

  /**
   * Перевірка наявності користувача за email.
   */
  existsByEmail(email: string, options?: RequestOptions): Promise<boolean>;

  /**
   * Отримання користувача разом з його рахунками.
   */
  findWithAccounts(id: string, options?: RequestOptions): Promise<UserWithAccounts | null>;

  /**
   * Отримання користувача разом з його транзакціями.
   */
  findWithTransactions(id: string, options?: RequestOptions): Promise<UserWithTransactions | null>;
}

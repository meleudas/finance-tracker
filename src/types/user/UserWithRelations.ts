import {
  User,
  Account,
  Transaction,
  Category,
  Budget,
  RecurringRule,
} from "../../generated/prisma/client";

export type UserWithRelations = User & {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
};

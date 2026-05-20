import {
  Account,
  Attachment,
  Budget,
  Category,
  RecurringFrequency,
  RecurringRule,
  Transaction,
  User,
} from "../../generated/prisma/client";

export type UserInclude = User & {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringRules: RecurringRule[];
  recurringFrequency: RecurringFrequency[];
  attachments: Attachment[];
};

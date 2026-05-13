import { User, Transaction } from "../../generated/prisma/client";

export type UserWithTransactions = User & {
  transactions: Transaction[];
};

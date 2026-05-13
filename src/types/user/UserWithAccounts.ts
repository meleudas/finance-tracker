import { User, Account } from "../../generated/prisma/client";

export type UserWithAccounts = User & {
  accounts: Account[];
};

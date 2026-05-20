import type { PrismaClient } from "../generated/prisma/client";

const softDeleteData = {
  isDeleted: true,
  deletedAt: new Date(),
} as const;

/**
 * Maps prisma.*.delete / deleteMany to updates with isDeleted + deletedAt.
 * DB foreign keys use ON DELETE RESTRICT (no cascade hard deletes).
 */
export function withSoftDeleteExtension(base: PrismaClient) {
  return base.$extends({
    name: "softDelete",
    query: {
      user: {
        delete: ({ args }) => base.user.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.user.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      currency: {
        delete: ({ args }) =>
          base.currency.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.currency.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      account: {
        delete: ({ args }) =>
          base.account.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.account.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      category: {
        delete: ({ args }) =>
          base.category.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.category.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      transaction: {
        delete: ({ args }) =>
          base.transaction.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.transaction.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      budget: {
        delete: ({ args }) =>
          base.budget.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.budget.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      recurringRule: {
        delete: ({ args }) =>
          base.recurringRule.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.recurringRule.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      recurringFrequency: {
        delete: ({ args }) =>
          base.recurringFrequency.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.recurringFrequency.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      attachment: {
        delete: ({ args }) =>
          base.attachment.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.attachment.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
      transfer: {
        delete: ({ args }) =>
          base.transfer.update({ where: args.where, data: { ...softDeleteData } }),
        deleteMany: ({ args }) =>
          base.transfer.updateMany({ where: args.where, data: { ...softDeleteData } }),
      },
    },
  });
}

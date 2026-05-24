import { Prisma } from "../../../src/generated/prisma/client";
import { toTransactionResponse } from "../../../src/mappers/transaction.mapper";
import { toTransferResponse } from "../../../src/mappers/transfer.mapper";
import { toRecurringRuleResponse } from "../../../src/mappers/recurring-rule.mapper";
import { toAttachmentResponse } from "../../../src/mappers/attachment.mapper";
import { toBudgetResponse } from "../../../src/mappers/budget.mapper";

const dates = {
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  deletedAt: new Date("2026-05-02T00:00:00.000Z"),
};

describe("mappers — deletedAt branches", () => {
  it("toTransactionResponse з deletedAt", () => {
    const result = toTransactionResponse({
      id: "clt7v9x1k0000qzq8x8x8x8x1",
      accountId: "cla7v9x1k0000qzq8x8x8x8x2",
      currencyId: "clc7v9x1k0000qzq8x8x8x8x3",
      categoryId: null,
      amount: new Prisma.Decimal(10),
      direction: "EXPENSE",
      occurredAt: dates.createdAt,
      note: null,
      isDeleted: true,
      ...dates,
    } as never);
    expect(result.deletedAt).toBe("2026-05-02T00:00:00.000Z");
  });

  it("toTransferResponse з deletedAt", () => {
    const result = toTransferResponse({
      id: "clt7v9x1k0000qzq8x8x8x8x4",
      userId: "clu7v9x1k0000qzq8x8x8x8x5",
      fromAccountId: "cla7v9x1k0000qzq8x8x8x8x2",
      toAccountId: "cla7v9x1k0000qzq8x8x8x8x6",
      currencyId: "clc7v9x1k0000qzq8x8x8x8x3",
      amount: new Prisma.Decimal(5),
      occurredAt: dates.createdAt,
      note: null,
      isDeleted: true,
      ...dates,
    } as never);
    expect(result.deletedAt).toBeTruthy();
  });

  it("toRecurringRuleResponse з endsAt", () => {
    const result = toRecurringRuleResponse({
      id: "clr7v9x1k0000qzq8x8x8x8x7",
      userId: "clu7v9x1k0000qzq8x8x8x8x5",
      accountId: "cla7v9x1k0000qzq8x8x8x8x2",
      currencyId: "clc7v9x1k0000qzq8x8x8x8x3",
      categoryId: null,
      frequencyId: "clf7v9x1k0000qzq8x8x8x8x8",
      name: "Rent",
      amount: new Prisma.Decimal(100),
      direction: "EXPENSE",
      nextRunAt: dates.createdAt,
      endsAt: dates.updatedAt,
      maxOccurrences: null,
      occurrenceCount: 0,
      isDeleted: false,
      frequency: {
        id: "clf7v9x1k0000qzq8x8x8x8x8",
        name: "Monthly",
        every: 1,
        unit: "MONTH",
        userId: "clu7v9x1k0000qzq8x8x8x8x5",
        createdAt: dates.createdAt,
        updatedAt: dates.updatedAt,
        deletedAt: null,
        isDeleted: false,
      },
      createdAt: dates.createdAt,
      updatedAt: dates.updatedAt,
      deletedAt: null,
    } as never);
    expect(result.endsAt).toBe("2026-05-01T00:00:00.000Z");
  });

  it("toAttachmentResponse з deletedAt", () => {
    const result = toAttachmentResponse({
      id: "clat7v9x1k0000qzq8x8x8x8x",
      transactionId: "clt7v9x1k0000qzq8x8x8x8x1",
      userId: "clu7v9x1k0000qzq8x8x8x8x5",
      originalName: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      storageKey: "k",
      isDeleted: true,
      ...dates,
    } as never);
    expect(result.deletedAt).toBeTruthy();
  });

  it("toBudgetResponse з deletedAt", () => {
    const result = toBudgetResponse({
      id: "clb7v9x1k0000qzq8x8x8x8x9",
      userId: "clu7v9x1k0000qzq8x8x8x8x5",
      accountId: "cla7v9x1k0000qzq8x8x8x8x2",
      currencyId: "clc7v9x1k0000qzq8x8x8x8x3",
      categoryId: null,
      name: "Food",
      limitAmount: new Prisma.Decimal(100),
      periodStart: dates.createdAt,
      periodEnd: dates.updatedAt,
      isDeleted: true,
      ...dates,
    } as never);
    expect(result.deletedAt).toBeTruthy();
  });
});

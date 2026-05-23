// src/mappers/budget.mapper.ts
import type { Budget } from "../generated/prisma/client";
import { BudgetResponseSchema, type BudgetResponseDto } from "../dtos/budget/BudgetResponse.dto";
import { decimalToNumber, toIsoString } from "./prisma-format.utils";

function toBudgetFields(budget: Budget) {
  return {
    id: budget.id,
    name: budget.name,
    accountId: budget.accountId,
    currencyId: budget.currencyId,
    categoryId: budget.categoryId,
    limitAmount: decimalToNumber(budget.limitAmount),
    periodStart: toIsoString(budget.periodStart),
    periodEnd: toIsoString(budget.periodEnd),
    createdAt: toIsoString(budget.createdAt),
    updatedAt: toIsoString(budget.updatedAt),
    deletedAt: budget.deletedAt ? toIsoString(budget.deletedAt) : null,
    isDeleted: budget.isDeleted,
  };
}

export function toBudgetResponse(budget: Budget): BudgetResponseDto {
  return BudgetResponseSchema.parse(toBudgetFields(budget));
}

/**
 * Мапить Budget у BudgetResponseDto з розрахованими полями spentAmount та remainingAmount
 * @param budget - сутність Budget з Prisma
 * @param spentAmount - сума витрачених коштів (опціонально)
 * @param remainingAmount - залишок бюджету (опціонально)
 */
export function toBudgetResponseWithCalculations(
  budget: Budget,
  spentAmount?: number,
  remainingAmount?: number,
): BudgetResponseDto {
  return BudgetResponseSchema.parse({
    ...toBudgetFields(budget),
    ...(spentAmount !== undefined && { spentAmount }),
    ...(remainingAmount !== undefined && { remainingAmount }),
  });
}

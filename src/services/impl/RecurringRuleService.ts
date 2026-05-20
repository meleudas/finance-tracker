import type { TransactionDirection } from "../../generated/prisma/client";
import type { IRecurringRuleService } from "../interfaces/IRecurringRuleService";
import type { IRecurringRuleRepository } from "../../repositories/interfaces/IRecurringRuleRepository";
import type { IRecurringFrequencyRepository } from "../../repositories/interfaces/IRecurringFrequencyRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { CreateRecurringRuleDto } from "../../dtos/recurring-rule/CreateRecurringRule.dto";
import type { UpdateRecurringRuleDto } from "../../dtos/recurring-rule/UpdateRecurringRule.dto";
import type { RecurringRuleResponseDto } from "../../dtos/recurring-rule/RecurringRuleResponse.dto";
import type { RecurringRuleListQueryDto } from "../../dtos/recurring-rule/RecurringRuleListQuery.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import { NotFoundError, ValidationError } from "../../utils/errors/ClientErrors";
import { toRecurringRuleResponse } from "../../mappers/recurring-rule.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { CreateRecurringRuleSchema } from "../../dtos/recurring-rule/CreateRecurringRule.dto";
import { UpdateRecurringRuleSchema } from "../../dtos/recurring-rule/UpdateRecurringRule.dto";
import { recurringRuleListQuerySchema } from "../../dtos/recurring-rule/RecurringRuleListQuery.dto";
import type { ICache } from "../../redis";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const LIST_CACHE_PREFIX = "recurring-rule:list";
const ITEM_CACHE_PREFIX = "recurring-rule:item";

interface RuleRefs {
  accountId: string;
  currencyId: string;
  categoryId?: string | null;
  frequencyId: string;
  direction: TransactionDirection;
}

function buildListCacheKey(userId: string, query: RecurringRuleListQueryDto): string {
  return [
    LIST_CACHE_PREFIX,
    userId,
    query.accountId ?? "",
    query.frequencyId ?? "",
    query.direction ?? "",
    query.page,
    query.limit,
  ].join(":");
}

function buildItemCacheKey(userId: string, id: string): string {
  return `${ITEM_CACHE_PREFIX}:${userId}:${id}`;
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  return value != null ? new Date(value) : undefined;
}

export class RecurringRuleService implements IRecurringRuleService {
  constructor(
    private readonly ruleRepo: IRecurringRuleRepository,
    private readonly frequencyRepo: IRecurringFrequencyRepository,
    private readonly accountRepo: IAccountRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly cache: ICache,
  ) {}

  async list(
    userId: string,
    query: RecurringRuleListQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<RecurringRuleResponseDto>> {
    const validated = parseOrThrow(recurringRuleListQuerySchema, query);
    const cacheKey = buildListCacheKey(userId, validated);
    const cached = await withServiceSignal(
      this.cache.getJson<PaginatedResult<RecurringRuleResponseDto>>(cacheKey),
      ctx,
    );
    if (cached) return cached;

    const result = await this.ruleRepo.findByFilter(
      {
        userId,
        accountId: validated.accountId,
        frequencyId: validated.frequencyId,
        direction: validated.direction,
      },
      { page: validated.page, limit: validated.limit },
      repoOptions(ctx),
    );

    const mapped = {
      ...result,
      data: result.data.map(toRecurringRuleResponse),
    };
    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.RECURRING_RULE_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async getById(
    userId: string,
    id: string,
    ctx?: ServiceContext,
  ): Promise<RecurringRuleResponseDto> {
    const cacheKey = buildItemCacheKey(userId, id);
    const cached = await withServiceSignal(
      this.cache.getJson<RecurringRuleResponseDto>(cacheKey),
      ctx,
    );
    if (cached) return cached;

    const rule = await this.ruleRepo.findByIdForUser(id, userId, repoOptions(ctx));
    if (!rule) throw new NotFoundError("Recurring rule");

    const mapped = toRecurringRuleResponse(rule);
    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.RECURRING_RULE_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async create(
    userId: string,
    dto: CreateRecurringRuleDto,
    ctx?: ServiceContext,
  ): Promise<RecurringRuleResponseDto> {
    const validated = parseOrThrow(CreateRecurringRuleSchema, dto);
    const options = repoOptions(ctx);

    await this.validateRuleRefs(userId, validated, options);

    const nextRunAt = validated.nextRunAt ? new Date(validated.nextRunAt) : new Date();
    const endsAt = parseOptionalDate(validated.endsAt);

    const created = await this.ruleRepo.create(
      {
        userId,
        name: validated.name,
        accountId: validated.accountId,
        currencyId: validated.currencyId,
        categoryId: validated.categoryId ?? null,
        frequencyId: validated.frequencyId,
        amount: validated.amount,
        direction: validated.direction,
        nextRunAt,
        endsAt: endsAt ?? null,
        maxOccurrences: validated.maxOccurrences ?? null,
        occurrenceCount: 0,
      },
      options,
    );

    const withFrequency = await this.ruleRepo.findByIdForUser(created.id, userId, options);
    if (!withFrequency) throw new NotFoundError("Recurring rule");

    await this.invalidateUserCache(userId, ctx);
    return toRecurringRuleResponse(withFrequency);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecurringRuleDto,
    ctx?: ServiceContext,
  ): Promise<RecurringRuleResponseDto> {
    const validated = parseOrThrow(UpdateRecurringRuleSchema, dto);
    const options = repoOptions(ctx);

    const existing = await this.ruleRepo.findByIdForUser(id, userId, options);
    if (!existing) throw new NotFoundError("Recurring rule");

    const effective: RuleRefs = {
      accountId: validated.accountId ?? existing.accountId,
      currencyId: validated.currencyId ?? existing.currencyId,
      categoryId: validated.categoryId ?? existing.categoryId,
      frequencyId: validated.frequencyId ?? existing.frequencyId,
      direction: validated.direction ?? existing.direction,
    };

    await this.validateRuleRefs(userId, effective, options);

    const nextRunAt = validated.nextRunAt ? new Date(validated.nextRunAt) : existing.nextRunAt;
    const endsAt =
      validated.endsAt !== undefined
        ? (parseOptionalDate(validated.endsAt) ?? null)
        : existing.endsAt;

    if (endsAt && nextRunAt >= endsAt) {
      throw new ValidationError("endsAt must be after nextRunAt");
    }

    await this.ruleRepo.update(
      id,
      {
        ...(validated.name && { name: validated.name }),
        ...(validated.accountId && { accountId: validated.accountId }),
        ...(validated.currencyId && { currencyId: validated.currencyId }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.frequencyId && { frequencyId: validated.frequencyId }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.direction && { direction: validated.direction }),
        ...(validated.nextRunAt && { nextRunAt }),
        ...(validated.endsAt !== undefined && { endsAt }),
        ...(validated.maxOccurrences !== undefined && {
          maxOccurrences: validated.maxOccurrences,
        }),
      },
      options,
    );

    const updated = await this.ruleRepo.findByIdForUser(id, userId, options);
    if (!updated) throw new NotFoundError("Recurring rule");

    await this.invalidateUserCache(userId, ctx);
    return toRecurringRuleResponse(updated);
  }

  async remove(userId: string, id: string, ctx?: ServiceContext): Promise<DeleteResponseDto> {
    const options = repoOptions(ctx);
    const existing = await this.ruleRepo.findByIdForUser(id, userId, options);
    if (!existing) throw new NotFoundError("Recurring rule");

    const deleted = await this.ruleRepo.softDelete(id, options);
    await this.invalidateUserCache(userId, ctx);
    return toDeleteResponse(deleted);
  }

  private async validateRuleRefs(
    userId: string,
    refs: RuleRefs,
    options: ReturnType<typeof repoOptions>,
  ): Promise<void> {
    const account = await this.accountRepo.findByIdWithCurrency(refs.accountId, userId, options);
    if (!account) throw new NotFoundError("Account");

    if (account.currencyId !== refs.currencyId) {
      throw new ValidationError("Rule currency must match the account currency");
    }

    const frequency = await this.frequencyRepo.findByIdForUser(refs.frequencyId, userId, options);
    if (!frequency) throw new NotFoundError("Recurring frequency");

    if (refs.categoryId) {
      const category = await this.categoryRepo.findById(refs.categoryId, options);
      if (!category || category.isDeleted || category.userId !== userId) {
        throw new NotFoundError("Category");
      }
      if (category.kind !== refs.direction) {
        throw new ValidationError("Category kind must match rule direction");
      }
    }
  }

  private async invalidateUserCache(userId: string, ctx?: ServiceContext): Promise<void> {
    const listKeys = await withServiceSignal(
      this.cache.keys(`${LIST_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(listKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
    const itemKeys = await withServiceSignal(
      this.cache.keys(`${ITEM_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(itemKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
  }
}

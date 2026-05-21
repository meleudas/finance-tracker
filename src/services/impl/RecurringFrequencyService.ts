import type { IRecurringFrequencyService } from "../interfaces/IRecurringFrequencyService";
import type { IRecurringFrequencyRepository } from "../../repositories/interfaces/IRecurringFrequencyRepository";
import type { CreateRecurringFrequencyDto } from "../../dtos/recurring-frequency/CreateRecurringFrequency.dto";
import type { UpdateRecurringFrequencyDto } from "../../dtos/recurring-frequency/UpdateRecurringFrequency.dto";
import type { RecurringFrequencyResponseDto } from "../../dtos/recurring-frequency/RecurringFrequencyResponse.dto";
import type { RecurringFrequencyListQueryDto } from "../../dtos/recurring-frequency/RecurringFrequencyListQuery.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import { ConflictError, NotFoundError } from "../../utils/errors/ClientErrors";
import { toRecurringFrequencyResponse } from "../../mappers/recurring-frequency.mapper";
import { toDeleteResponse } from "../../mappers/delete-response.mapper";
import { parseOrThrow } from "../../utils/helpers/zodParse";
import { CreateRecurringFrequencySchema } from "../../dtos/recurring-frequency/CreateRecurringFrequency.dto";
import { UpdateRecurringFrequencySchema } from "../../dtos/recurring-frequency/UpdateRecurringFrequency.dto";
import { recurringFrequencyListQuerySchema } from "../../dtos/recurring-frequency/RecurringFrequencyListQuery.dto";
import { isPrismaUniqueViolation } from "../../utils/helpers/prismaErrors";
import type { ICache } from "../../redis";
import { env } from "../../config/env";
import type { ServiceContext } from "../serviceContext";
import { repoOptions, withServiceSignal } from "../serviceContext";

const LIST_CACHE_PREFIX = "recurring-frequency:list";
const ITEM_CACHE_PREFIX = "recurring-frequency:item";

function buildListCacheKey(userId: string, query: RecurringFrequencyListQueryDto): string {
  return [LIST_CACHE_PREFIX, userId, query.name ?? "", query.page, query.limit].join(":");
}

function buildItemCacheKey(userId: string, id: string): string {
  return `${ITEM_CACHE_PREFIX}:${userId}:${id}`;
}

export class RecurringFrequencyService implements IRecurringFrequencyService {
  constructor(
    private readonly frequencyRepo: IRecurringFrequencyRepository,
    private readonly cache: ICache,
  ) {}

  async list(
    userId: string,
    query: RecurringFrequencyListQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<RecurringFrequencyResponseDto>> {
    const validated = parseOrThrow(recurringFrequencyListQuerySchema, query);
    const cacheKey = buildListCacheKey(userId, validated);
    const cached = await withServiceSignal(
      this.cache.getJson<PaginatedResult<RecurringFrequencyResponseDto>>(cacheKey),
      ctx,
    );
    if (cached) return cached;

    const result = await this.frequencyRepo.findByFilter(
      { userId, name: validated.name },
      { page: validated.page, limit: validated.limit },
      repoOptions(ctx),
    );

    const mapped = {
      ...result,
      data: result.data.map(toRecurringFrequencyResponse),
    };
    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.RECURRING_FREQUENCY_LIST_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async getById(
    userId: string,
    id: string,
    ctx?: ServiceContext,
  ): Promise<RecurringFrequencyResponseDto> {
    const cacheKey = buildItemCacheKey(userId, id);
    const cached = await withServiceSignal(
      this.cache.getJson<RecurringFrequencyResponseDto>(cacheKey),
      ctx,
    );
    if (cached) return cached;

    const frequency = await this.frequencyRepo.findByIdForUser(id, userId, repoOptions(ctx));
    if (!frequency) throw new NotFoundError("Recurring frequency");

    const mapped = toRecurringFrequencyResponse(frequency);
    await withServiceSignal(
      this.cache.setJson(cacheKey, mapped, env.RECURRING_FREQUENCY_ITEM_CACHE_TTL_SECONDS),
      ctx,
    );
    return mapped;
  }

  async create(
    userId: string,
    dto: CreateRecurringFrequencyDto,
    ctx?: ServiceContext,
  ): Promise<RecurringFrequencyResponseDto> {
    const validated = parseOrThrow(CreateRecurringFrequencySchema, dto);
    const options = repoOptions(ctx);

    try {
      const created = await this.frequencyRepo.create({ ...validated, userId }, options);
      await this.invalidateUserCache(userId, ctx);
      return toRecurringFrequencyResponse(created);
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Recurring frequency with this name already exists");
      }
      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecurringFrequencyDto,
    ctx?: ServiceContext,
  ): Promise<RecurringFrequencyResponseDto> {
    const validated = parseOrThrow(UpdateRecurringFrequencySchema, dto);
    const options = repoOptions(ctx);
    const existing = await this.frequencyRepo.findByIdForUser(id, userId, options);
    if (!existing) throw new NotFoundError("Recurring frequency");

    try {
      const updated = await this.frequencyRepo.update(id, validated, options);
      await this.invalidateUserCache(userId, ctx);
      return toRecurringFrequencyResponse(updated);
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Recurring frequency with this name already exists");
      }
      throw error;
    }
  }

  async remove(userId: string, id: string, ctx?: ServiceContext): Promise<DeleteResponseDto> {
    const options = repoOptions(ctx);
    const existing = await this.frequencyRepo.findByIdForUser(id, userId, options);
    if (!existing) throw new NotFoundError("Recurring frequency");

    const ruleCount = await this.frequencyRepo.countActiveRules(id, options);
    if (ruleCount > 0) {
      throw new ConflictError("Frequency is used by recurring rules");
    }

    const deleted = await this.frequencyRepo.softDelete(id, options);
    await this.invalidateUserCache(userId, ctx);
    return toDeleteResponse(deleted);
  }

  private async invalidateUserCache(userId: string, ctx?: ServiceContext): Promise<void> {
    const keys = await withServiceSignal(this.cache.keys(`${LIST_CACHE_PREFIX}:${userId}:*`), ctx);
    await Promise.all(keys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
    const itemKeys = await withServiceSignal(
      this.cache.keys(`${ITEM_CACHE_PREFIX}:${userId}:*`),
      ctx,
    );
    await Promise.all(itemKeys.map((key) => withServiceSignal(this.cache.delete(key), ctx)));
  }
}

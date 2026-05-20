import type { CreateRecurringFrequencyDto } from "../../dtos/recurring-frequency/CreateRecurringFrequency.dto";
import type { UpdateRecurringFrequencyDto } from "../../dtos/recurring-frequency/UpdateRecurringFrequency.dto";
import type { RecurringFrequencyResponseDto } from "../../dtos/recurring-frequency/RecurringFrequencyResponse.dto";
import type { RecurringFrequencyListQueryDto } from "../../dtos/recurring-frequency/RecurringFrequencyListQuery.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { ServiceContext } from "../serviceContext";

export interface IRecurringFrequencyService {
  list(
    userId: string,
    query: RecurringFrequencyListQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<RecurringFrequencyResponseDto>>;

  getById(userId: string, id: string, ctx?: ServiceContext): Promise<RecurringFrequencyResponseDto>;

  create(
    userId: string,
    dto: CreateRecurringFrequencyDto,
    ctx?: ServiceContext,
  ): Promise<RecurringFrequencyResponseDto>;

  update(
    userId: string,
    id: string,
    dto: UpdateRecurringFrequencyDto,
    ctx?: ServiceContext,
  ): Promise<RecurringFrequencyResponseDto>;

  remove(userId: string, id: string, ctx?: ServiceContext): Promise<DeleteResponseDto>;
}

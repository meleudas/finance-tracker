import type { CreateRecurringRuleDto } from "../../dtos/recurring-rule/CreateRecurringRule.dto";
import type { UpdateRecurringRuleDto } from "../../dtos/recurring-rule/UpdateRecurringRule.dto";
import type { RecurringRuleResponseDto } from "../../dtos/recurring-rule/RecurringRuleResponse.dto";
import type { RecurringRuleListQueryDto } from "../../dtos/recurring-rule/RecurringRuleListQuery.dto";
import type { DeleteResponseDto } from "../../dtos/common/DeleteResponse.dto";
import type { PaginatedResult } from "../../repositories/interfaces/IBaseRepository";
import type { ServiceContext } from "../serviceContext";

export interface IRecurringRuleService {
  list(
    userId: string,
    query: RecurringRuleListQueryDto,
    ctx?: ServiceContext,
  ): Promise<PaginatedResult<RecurringRuleResponseDto>>;

  getById(userId: string, id: string, ctx?: ServiceContext): Promise<RecurringRuleResponseDto>;

  create(
    userId: string,
    dto: CreateRecurringRuleDto,
    ctx?: ServiceContext,
  ): Promise<RecurringRuleResponseDto>;

  update(
    userId: string,
    id: string,
    dto: UpdateRecurringRuleDto,
    ctx?: ServiceContext,
  ): Promise<RecurringRuleResponseDto>;

  remove(userId: string, id: string, ctx?: ServiceContext): Promise<DeleteResponseDto>;
}

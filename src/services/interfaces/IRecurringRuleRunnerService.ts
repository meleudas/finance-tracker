export interface RecurringRuleRunResult {
  processed: number;
  created: number;
  failed: number;
}

export interface IRecurringRuleRunnerService {
  processDueRules(): Promise<RecurringRuleRunResult>;
}

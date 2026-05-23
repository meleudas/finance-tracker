-- Truncate domain tables (order handled by CASCADE)
TRUNCATE TABLE
  attachments,
  report_jobs,
  transactions,
  transfers,
  budgets,
  recurring_rules,
  recurring_frequencies,
  categories,
  accounts,
  users,
  currencies
RESTART IDENTITY CASCADE;

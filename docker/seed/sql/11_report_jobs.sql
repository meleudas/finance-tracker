INSERT INTO report_jobs (
  id, user_id, status, format, period_from, period_to,
  account_id, include_recurring, result_json, storage_key, error_message,
  completed_at, created_at
)
SELECT
  'clseed' || lpad((188 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  CASE
    WHEN i < 5 THEN 'PENDING'::"ReportJobStatus"
    WHEN i < 8 THEN 'PROCESSING'::"ReportJobStatus"
    WHEN i < 18 THEN 'COMPLETED'::"ReportJobStatus"
    ELSE 'FAILED'::"ReportJobStatus"
  END,
  CASE WHEN i % 2 = 0 THEN 'JSON'::"ReportFormat" ELSE 'PDF'::"ReportFormat" END,
  '2026-01-01T00:00:00.000Z'::timestamptz,
  '2026-04-30T23:59:59.999Z'::timestamptz,
  CASE WHEN i % 3 = 0 THEN 'clseed0000000000000000022' ELSE NULL END,
  i % 2 = 0,
  CASE
    WHEN i >= 8 AND i < 18 AND i % 2 = 0 THEN
      jsonb_build_object(
        'period', jsonb_build_object(
          'from', '2026-01-01T00:00:00.000Z',
          'to', '2026-04-30T23:59:59.999Z'
        ),
        'filters', jsonb_build_object('includeRecurring', true),
        'currencies', jsonb_build_array(
          jsonb_build_object(
            'currencyId', 'clseed0000000000000000002',
            'currencyCode', 'UAH',
            'summary', jsonb_build_object('totalIncome', 1500, 'totalExpense', 800, 'net', 700),
            'byCategory', jsonb_build_array(
              jsonb_build_object(
                'categoryId', NULL,
                'categoryName', 'Uncategorized',
                'kind', 'EXPENSE',
                'amount', 100,
                'transactionCount', 1
              )
            ),
            'byAccount', jsonb_build_array(),
            'transfers', jsonb_build_object('count', 2, 'totalAmount', 50),
            'budgets', jsonb_build_array()
          )
        ),
        'recurring', jsonb_build_object(
          'activeRulesCount', 5,
          'materializedAmount', 300,
          'projectedAmount', 500,
          'byRule', jsonb_build_array()
        )
      )
    WHEN i >= 8 AND i < 18 AND i % 2 = 1 THEN jsonb_build_object('downloadReady', true)
    ELSE NULL
  END,
  CASE
    WHEN i >= 8 AND i < 18 AND i % 2 = 1 THEN 'seed/reports/clseed' || lpad((188 + i)::text, 19, '0') || '.pdf'
    ELSE NULL
  END,
  CASE WHEN i >= 18 THEN 'Seed failed job for Swagger testing' ELSE NULL END,
  CASE WHEN i >= 8 THEN '2026-05-10T10:00:00.000Z'::timestamptz ELSE NULL END,
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  status = EXCLUDED.status,
  format = EXCLUDED.format,
  period_from = EXCLUDED.period_from,
  period_to = EXCLUDED.period_to,
  account_id = EXCLUDED.account_id,
  include_recurring = EXCLUDED.include_recurring,
  result_json = EXCLUDED.result_json,
  storage_key = EXCLUDED.storage_key,
  error_message = EXCLUDED.error_message,
  completed_at = EXCLUDED.completed_at;

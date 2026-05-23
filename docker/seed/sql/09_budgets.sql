INSERT INTO budgets (
  id, user_id, account_id, currency_id, category_id,
  name, period_start, period_end, limit_amount,
  is_deleted, deleted_at, created_at, updated_at
)
SELECT
  'clseed' || lpad((148 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  'clseed' || lpad((22 + (i % 20))::text, 19, '0'),
  (SELECT currency_id FROM accounts WHERE id = 'clseed' || lpad((22 + (i % 20))::text, 19, '0')),
  CASE
    WHEN i % 4 = 0 THEN NULL
    ELSE 'clseed' || lpad((45 + ((i % 6) * 2 + 1))::text, 19, '0')
  END,
  'Budget ' || (i + 1),
  '2026-01-01T00:00:00.000Z'::timestamptz,
  '2026-06-30T23:59:59.999Z'::timestamptz,
  (1000 + i * 100)::numeric(19, 4),
  i >= 18,
  CASE WHEN i >= 18 THEN '2026-03-01T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  account_id = EXCLUDED.account_id,
  currency_id = EXCLUDED.currency_id,
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  limit_amount = EXCLUDED.limit_amount,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

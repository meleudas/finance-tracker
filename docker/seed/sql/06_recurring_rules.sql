INSERT INTO recurring_rules (
  id, user_id, account_id, currency_id, category_id, frequency_id,
  name, amount, direction, next_run_at, ends_at, max_occurrences, occurrence_count,
  is_deleted, deleted_at, created_at, updated_at
)
SELECT
  'clseed' || lpad((88 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  'clseed' || lpad((22 + (i % 20))::text, 19, '0'),
  (SELECT currency_id FROM accounts WHERE id = 'clseed' || lpad((22 + (i % 20))::text, 19, '0')),
  CASE
    WHEN i % 2 = 0 THEN 'clseed' || lpad((45 + (i % 6) * 2)::text, 19, '0')
    ELSE 'clseed' || lpad((45 + (i % 6) * 2 + 1)::text, 19, '0')
  END,
  'clseed' || lpad((68 + i)::text, 19, '0'),
  'Recurring rule ' || (i + 1),
  100 + i * 10,
  CASE WHEN i % 2 = 0 THEN 'INCOME'::"TransactionDirection" ELSE 'EXPENSE'::"TransactionDirection" END,
  CASE
    WHEN i = 5 THEN '2026-01-01T00:00:00.000Z'::timestamptz
    WHEN i = 6 THEN '2026-12-31T00:00:00.000Z'::timestamptz
    ELSE ('2026-05-15T12:00:00.000Z'::timestamptz + ((i + 1) || ' days')::interval)
  END,
  CASE WHEN i = 5 THEN '2026-01-01T00:00:00.000Z'::timestamptz ELSE NULL END,
  CASE WHEN i = 6 THEN 3 ELSE NULL END,
  CASE WHEN i = 6 THEN 3 ELSE 0 END,
  false,
  NULL,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  account_id = EXCLUDED.account_id,
  currency_id = EXCLUDED.currency_id,
  category_id = EXCLUDED.category_id,
  frequency_id = EXCLUDED.frequency_id,
  name = EXCLUDED.name,
  amount = EXCLUDED.amount,
  direction = EXCLUDED.direction,
  next_run_at = EXCLUDED.next_run_at,
  ends_at = EXCLUDED.ends_at,
  max_occurrences = EXCLUDED.max_occurrences,
  occurrence_count = EXCLUDED.occurrence_count,
  updated_at = NOW();

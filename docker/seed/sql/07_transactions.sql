INSERT INTO transactions (
  id, user_id, account_id, currency_id, category_id, recurring_rule_id,
  amount, direction, occurred_at, note, is_deleted, deleted_at, created_at, updated_at
)
SELECT
  'clseed' || lpad((108 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  'clseed' || lpad((22 + (i % 20))::text, 19, '0'),
  (SELECT currency_id FROM accounts WHERE id = 'clseed' || lpad((22 + (i % 20))::text, 19, '0')),
  CASE
    WHEN i < 10 AND i % 3 = 0 THEN NULL
    WHEN i < 10 THEN 'clseed' || lpad((45 + ((i % 6) * 2))::text, 19, '0')
    ELSE 'clseed' || lpad((45 + ((i % 6) * 2 + 1))::text, 19, '0')
  END,
  CASE WHEN i < 3 THEN 'clseed' || lpad((88 + i)::text, 19, '0') ELSE NULL END,
  (50 + i * 25.5)::numeric(19, 4),
  CASE WHEN i < 10 THEN 'INCOME'::"TransactionDirection" ELSE 'EXPENSE'::"TransactionDirection" END,
  '2026-02-01T10:00:00.000Z'::timestamptz + (i * 4 || ' days')::interval,
  'Swagger demo transaction ' || (i + 1),
  i >= 18,
  CASE WHEN i >= 18 THEN '2026-04-01T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  account_id = EXCLUDED.account_id,
  currency_id = EXCLUDED.currency_id,
  category_id = EXCLUDED.category_id,
  recurring_rule_id = EXCLUDED.recurring_rule_id,
  amount = EXCLUDED.amount,
  direction = EXCLUDED.direction,
  occurred_at = EXCLUDED.occurred_at,
  note = EXCLUDED.note,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

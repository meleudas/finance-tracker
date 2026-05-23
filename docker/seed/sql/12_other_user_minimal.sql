-- Other user: one transaction for cross-user 404 testing in Swagger
INSERT INTO transactions (
  id, user_id, account_id, currency_id, category_id, recurring_rule_id,
  amount, direction, occurred_at, note, is_deleted, deleted_at, created_at, updated_at
)
VALUES (
  'clseed0000000000000000208',
  'clseed0000000000000000001',
  'clseed0000000000000000042',
  'clseed0000000000000000002',
  'clseed0000000000000000065',
  NULL,
  99.99,
  'EXPENSE',
  '2026-03-01T12:00:00.000Z',
  'Other user transaction for isolation tests',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  account_id = EXCLUDED.account_id,
  currency_id = EXCLUDED.currency_id,
  category_id = EXCLUDED.category_id,
  amount = EXCLUDED.amount,
  direction = EXCLUDED.direction,
  occurred_at = EXCLUDED.occurred_at,
  note = EXCLUDED.note,
  updated_at = NOW();

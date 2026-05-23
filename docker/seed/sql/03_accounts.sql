-- 20 demo accounts (18 active + 2 deleted) + 3 other-user accounts
INSERT INTO accounts (id, user_id, currency_id, name, is_deleted, deleted_at, created_at, updated_at)
SELECT
  'clseed' || lpad((22 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  CASE (i % 3)
    WHEN 0 THEN 'clseed0000000000000000002'
    WHEN 1 THEN 'clseed0000000000000000003'
    ELSE 'clseed0000000000000000004'
  END,
  'Demo account ' || (i + 1),
  i >= 18,
  CASE WHEN i >= 18 THEN '2026-02-01T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  currency_id = EXCLUDED.currency_id,
  name = EXCLUDED.name,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

INSERT INTO accounts (id, user_id, currency_id, name, is_deleted, deleted_at, created_at, updated_at)
SELECT
  'clseed' || lpad((42 + i)::text, 19, '0'),
  'clseed0000000000000000001',
  'clseed0000000000000000002',
  'Other user account ' || (i + 1),
  false,
  NULL,
  NOW(),
  NOW()
FROM generate_series(0, 2) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  currency_id = EXCLUDED.currency_id,
  name = EXCLUDED.name,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

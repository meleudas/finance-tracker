-- 12 root categories (6 INCOME, 6 EXPENSE) + 8 children; roots 10-11 deleted
INSERT INTO categories (id, user_id, parent_id, name, kind, is_deleted, deleted_at, created_at, updated_at)
SELECT
  'clseed' || lpad((45 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  NULL,
  CASE
    WHEN i % 2 = 0 THEN 'Income root ' || ((i / 2) + 1)
    ELSE 'Expense root ' || ((i / 2) + 1)
  END,
  CASE WHEN i % 2 = 0 THEN 'INCOME'::"CategoryKind" ELSE 'EXPENSE'::"CategoryKind" END,
  i >= 10,
  CASE WHEN i >= 10 THEN '2026-02-15T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 11) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  kind = EXCLUDED.kind,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

INSERT INTO categories (id, user_id, parent_id, name, kind, is_deleted, deleted_at, created_at, updated_at)
SELECT
  'clseed' || lpad((45 + 12 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  'clseed' || lpad((45 + (i % 12))::text, 19, '0'),
  'Child ' || (i + 1),
  CASE WHEN i % 2 = 0 THEN 'INCOME'::"CategoryKind" ELSE 'EXPENSE'::"CategoryKind" END,
  false,
  NULL,
  NOW(),
  NOW()
FROM generate_series(0, 7) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  kind = EXCLUDED.kind,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

INSERT INTO categories (id, user_id, parent_id, name, kind, is_deleted, deleted_at, created_at, updated_at)
VALUES (
  'clseed0000000000000000065',
  'clseed0000000000000000001',
  NULL,
  'Other expense',
  'EXPENSE',
  false,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  kind = EXCLUDED.kind,
  updated_at = NOW();

-- Transfers between UAH accounts (demo accounts 0, 3, 6, 9, 12, 15 use UAH when i%3=0)
INSERT INTO transfers (
  id, user_id, from_account_id, to_account_id, currency_id,
  amount, occurred_at, note, is_deleted, deleted_at, created_at, updated_at
)
SELECT
  'clseed' || lpad((128 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  uah_ids.from_id,
  uah_ids.to_id,
  'clseed0000000000000000002',
  (10 + i * 5)::numeric(19, 4),
  '2026-02-10T14:00:00.000Z'::timestamptz + (i * 3 || ' days')::interval,
  'Swagger transfer ' || (i + 1),
  i >= 18,
  CASE WHEN i >= 18 THEN '2026-04-05T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
CROSS JOIN LATERAL (
  SELECT
    ids.arr[1 + (i % array_length(ids.arr, 1))] AS from_id,
    ids.arr[1 + ((i + 1) % array_length(ids.arr, 1))] AS to_id
  FROM (
    SELECT array_agg('clseed' || lpad((22 + n)::text, 19, '0') ORDER BY n) AS arr
    FROM generate_series(0, 19) AS n
    WHERE n % 3 = 0
  ) AS ids
) AS uah_ids
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  from_account_id = EXCLUDED.from_account_id,
  to_account_id = EXCLUDED.to_account_id,
  currency_id = EXCLUDED.currency_id,
  amount = EXCLUDED.amount,
  occurred_at = EXCLUDED.occurred_at,
  note = EXCLUDED.note,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

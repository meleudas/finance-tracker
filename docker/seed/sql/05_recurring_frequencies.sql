INSERT INTO recurring_frequencies (id, user_id, name, "every", unit, is_deleted, deleted_at, created_at, updated_at)
SELECT
  'clseed' || lpad((68 + i)::text, 19, '0'),
  'clseed0000000000000000000',
  'Every ' || lower(
    CASE (i % 4)
      WHEN 0 THEN 'DAY'
      WHEN 1 THEN 'WEEK'
      WHEN 2 THEN 'MONTH'
      ELSE 'YEAR'
    END
  ) || ' x' || ((i % 3) + 1) || ' #' || (i + 1),
  (i % 3) + 1,
  CASE (i % 4)
    WHEN 0 THEN 'DAY'::"RecurringIntervalUnit"
    WHEN 1 THEN 'WEEK'::"RecurringIntervalUnit"
    WHEN 2 THEN 'MONTH'::"RecurringIntervalUnit"
    ELSE 'YEAR'::"RecurringIntervalUnit"
  END,
  false,
  NULL,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  "every" = EXCLUDED."every",
  unit = EXCLUDED.unit,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

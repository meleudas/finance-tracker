INSERT INTO attachments (
  id, transaction_id, storage_key, mime_type, original_name,
  is_deleted, deleted_at, created_at, updated_at
)
SELECT
  'clseed' || lpad((168 + i)::text, 19, '0'),
  'clseed' || lpad((108 + i)::text, 19, '0'),
  'seed/swagger/tx-clseed' || lpad((108 + i)::text, 19, '0') || '/receipt-' || (i + 1) || '.pdf',
  'application/pdf',
  'receipt-' || (i + 1) || '.pdf',
  i >= 18,
  CASE WHEN i >= 18 THEN '2026-04-10T00:00:00.000Z'::timestamptz ELSE NULL END,
  NOW(),
  NOW()
FROM generate_series(0, 19) AS i
ON CONFLICT (id) DO UPDATE SET
  transaction_id = EXCLUDED.transaction_id,
  storage_key = EXCLUDED.storage_key,
  mime_type = EXCLUDED.mime_type,
  original_name = EXCLUDED.original_name,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

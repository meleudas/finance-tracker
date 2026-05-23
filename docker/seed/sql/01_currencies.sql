-- 20 global currencies; indexes 18-19 soft-deleted (TRY, KRW)
INSERT INTO currencies (id, code, name, minor_units, is_deleted, deleted_at, created_at, updated_at)
VALUES
  ('clseed0000000000000000002', 'UAH', 'Ukrainian hryvnia', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000003', 'USD', 'United States dollar', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000004', 'EUR', 'Euro', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000005', 'GBP', 'British pound sterling', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000006', 'PLN', 'Polish zloty', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000007', 'CHF', 'Swiss franc', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000008', 'CZK', 'Czech koruna', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000009', 'SEK', 'Swedish krona', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000010', 'NOK', 'Norwegian krone', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000011', 'DKK', 'Danish krone', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000012', 'HUF', 'Hungarian forint', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000013', 'RON', 'Romanian leu', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000014', 'BGN', 'Bulgarian lev', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000015', 'HRK', 'Croatian kuna', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000016', 'ISK', 'Icelandic króna', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000017', 'CAD', 'Canadian dollar', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000018', 'AUD', 'Australian dollar', 2, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000019', 'JPY', 'Japanese yen', 0, false, NULL, NOW(), NOW()),
  ('clseed0000000000000000020', 'KRW', 'South Korean won', 0, true, '2026-01-01T00:00:00.000Z', NOW(), NOW()),
  ('clseed0000000000000000021', 'TRY', 'Turkish lira', 2, true, '2026-01-01T00:00:00.000Z', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  minor_units = EXCLUDED.minor_units,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

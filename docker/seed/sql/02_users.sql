-- bcrypt cost 12: SwaggerDemo123! / OtherSwagger123!
-- Regenerate: node -e "console.log(require('bcrypt').hashSync('SwaggerDemo123!',12))"
INSERT INTO users (id, email, password_hash, is_deleted, deleted_at, created_at, updated_at)
VALUES
  (
    'clseed0000000000000000000',
    'demo@swagger.local',
    '$2b$12$rodGOjrVMFVvHBiDHDC2lukDUj3NEDywTZvhDfJRM6kE5Wt5RCLBe',
    false,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'clseed0000000000000000001',
    'other@swagger.local',
    '$2b$12$A8i8t2HPNsudJ3H0T.4qq..VXJ6nvYHhHSzoqxIL1qRRmZy1r/IXi',
    false,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  password_hash = EXCLUDED.password_hash,
  is_deleted = EXCLUDED.is_deleted,
  deleted_at = EXCLUDED.deleted_at,
  updated_at = NOW();

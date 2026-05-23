#!/bin/sh
set -eu

# psql does not accept Prisma-style ?schema=public on the connection URI
PSQL_URL="${DATABASE_URL%%\?*}"

echo "Applying Prisma migrations…"
npx prisma migrate deploy

if [ "${SEED_RESET:-true}" = "true" ]; then
  echo "SEED_RESET=true — truncating domain tables…"
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f /app/docker/seed/sql/00_truncate.sql
else
  echo "SEED_RESET=false — skipping truncate (upsert via ON CONFLICT)…"
fi

for f in /app/docker/seed/sql/[0-9]*.sql; do
  base=$(basename "$f")
  if [ "$base" = "00_truncate.sql" ]; then
    continue
  fi
  echo "Running $base…"
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo ""
echo "Seed completed."
echo "  Demo login: demo@swagger.local / ${SEED_DEMO_PASSWORD:-SwaggerDemo123!}"
echo "  Other user: other@swagger.local / ${SEED_OTHER_PASSWORD:-OtherSwagger123!}"
echo "  Fixtures:   /app/docker/seed/swagger-fixtures.json"
echo "  Swagger UI: http://localhost:3000/api-docs"

# Локальне середовище

**Пов’язано:** [README.md](../README.md) · [04-tech-stack.md](04-tech-stack.md) · [12-testing.md](12-testing.md)

## Передумови

- **Node.js** LTS (рекомендовано ≥ 20)
- **npm** (або pnpm/yarn — якщо команда узгодить один менеджер)
- **Docker Desktop** (Windows/macOS) або Docker Engine + Compose (Linux)
- **Git**

## Клонування та залежності

```bash
git clone <repository-url>
cd finance-tracker
npm install
```

Після `npm install` спрацьовують скрипти `prepare` (Husky — git hooks) та `postinstall` (`prisma generate`). Детальніше про хуки: [06-team-workflow.md](06-team-workflow.md).

## Змінні середовища

Скопіюйте приклад і заповніть значення:

```bash
cp .env.example .env
```

Файл [`.env.example`](../.env.example) містить мінімальний набір. Важливо:

- **`DATABASE_URL` на хості:** для `npm run dev` зазвичай `localhost` і ті самі `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`, що й у Compose (див. нижче).
- **У контейнері `app`:** у [docker-compose.yml](../docker-compose.yml) `DATABASE_URL` підставляється на хост `postgres` (не `localhost`) — це нормально; не копіюйте цей рядок у локальний `.env`, якщо працюєте лише на хості.
- **`APP_PORT`:** порт на машині, на який мапиться API в Docker (за замовчуванням `3000` → `http://localhost:3000`).
- **Redis / MinIO / S3:** для повного стеку в Docker сервіс `app` отримує `REDIS_URL`, `S3_*` з compose. Для чисто локального `npm run dev` додайте в `.env` ті самі змінні, якщо код вже читає їх (наприклад `REDIS_URL=redis://localhost:6379`, endpoint MinIO на `http://localhost:9000`).

Приклад розширеного `.env` (узгодьте з вашим кодом):

```env
NODE_ENV=development
PORT=3000
APP_PORT=3000
DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_tracker?schema=public
JWT_ACCESS_SECRET=change-me-access-min-32-chars-long!!
JWT_REFRESH_SECRET=change-me-refresh-min-32-chars-long!!
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
S3_REGION=us-east-1
S3_BUCKET=finance-tracker
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

**Не комітити** `.env` у репозиторій.

## Два режими розробки

### A. Інфра в Docker, API на хості (типово для щоденної розробки)

1. Підняти лише залежності без контейнера `app` — наприклад:

   ```bash
   docker compose up postgres redis minio -d
   ```

2. `DATABASE_URL` у `.env` → `localhost:5432` (або інший `POSTGRES_PORT`, якщо змінили мапінг).
3. Міграції та seed локально, потім `npm run dev` на порту **`PORT`** (за замовчуванням `3000`).

### B. Повний стек у Docker (API + Postgres + Redis + MinIO + report worker)

```bash
docker compose up --build
```

- Сервіси: **postgres**, **redis**, **minio**, **app**, **worker** (образ з [docker/Dockerfile](../docker/Dockerfile); worker — `node dist/workers/index.js`, черга BullMQ для PDF/JSON звітів).
- Для фронтенду на `http://localhost:5173` у compose за замовчуванням `NODE_ENV=development` і `COOKIE_SECURE=false` (інакше CSRF-cookie з `Secure` не зберігається на HTTP).
- Порти за замовчуванням: API **`APP_PORT` → 3000**, Postgres **5432**, Redis **6379**, MinIO **9000** (API), **9001** (консоль).
- Логи всіх сервісів у поточному терміналі. У фоні: `docker compose up --build -d`, перегляд: `docker compose logs -f`.

**Конфлікт порту:** і режим A з `npm run dev`, і режим B з мапінгом `3000:3000` займають порт **3000** на хості. Одночасно не запускайте API і на хості, і в контейнері на тому ж порту.

Переконайтеся, що порти **5432**, **6379**, **9000**, **9001** вільні або змініть мапінг у compose / `.env`.

## Міграції та seed

```bash
npx prisma migrate dev
npx prisma db seed
```

Для контейнера `app` міграції застосовуються при старті (`prisma migrate deploy` у CMD образу).

## Запуск у режимі розробки (хост)

```bash
npm run dev
```

## Корисні скрипти

| Скрипт                                                     | Призначення                                                      |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                              | `tsx watch` на `src/index.ts`                                    |
| `npm run build`                                            | `prisma generate && tsc -p tsconfig.json`                        |
| `npm start`                                                | `node dist/index.js`                                             |
| `npm run lint`                                             | ESLint (flat config)                                             |
| `npm run format` / `format:check`                          | Prettier                                                         |
| `npm run typecheck`                                        | `tsc --noEmit`                                                   |
| `npm test` / `test:ci`                                     | Jest (local / CI з coverage)                                     |
| `npm run prisma:validate`                                  | Валідація `schema.prisma` (підставляє тимчасовий `DATABASE_URL`) |
| `npm run prisma:generate`                                  | `prisma generate`                                                |
| `npm run prisma:migrate` / `prisma:deploy` / `prisma:seed` | Міграції та seed                                                 |
| `prepare` (lifecycle)                                      | `husky` — встановлення git hooks                                 |
| `postinstall` (lifecycle)                                  | `prisma generate`                                                |

## Troubleshooting

| Проблема                                        | Дія                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Помилка підключення до БД                       | Перевірити `DATABASE_URL`, чи запущений контейнер `postgres`                                       |
| Помилки міграцій після pull                     | `git pull`, потім `npx prisma migrate dev`; у крайньому випадку пересоздати локальну БД (дев only) |
| Порт зайнятий                                   | Змінити `PORT` / `APP_PORT` у `.env` або не запускати два API на одному порту                      |
| Docker build падає на Prisma без `DATABASE_URL` | У build-stage Dockerfile задано placeholder; див. [13-ci-cd.md](13-ci-cd.md)                       |

## Навігація

- Архітектура запуску: [02-architecture.md](02-architecture.md)
- CI відтворює ці кроки: [13-ci-cd.md](13-ci-cd.md)

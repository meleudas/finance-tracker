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

## Змінні середовища

Скопіюйте приклад і заповніть значення:

```bash
cp .env.example .env
```

Типові змінні (ілюстрація):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/finance_tracker
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
CORS_ORIGIN=http://localhost:5173
```

**Не комітити** `.env` у репозиторій.

## PostgreSQL через Docker Compose

```bash
docker compose up -d
# Повний стек (Postgres + контейнер API): docker compose --profile full up -d
```

Переконайтеся, що порт `5432` вільний або змініть мапінг у файлі compose.

## Міграції та seed

```bash
npx prisma migrate dev
npx prisma db seed
```

## Запуск у режимі розробки

```bash
npm run dev
```

## Корисні скрипти

| Скрипт | Призначення |
|--------|-------------|
| `npm run dev` | `tsx watch` на `src/index.ts` |
| `npm run build` | `tsc -p tsconfig.json` |
| `npm start` | `node dist/index.js` |
| `npm run lint` | ESLint (flat config) |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:ci` | Jest (local / CI з coverage) |
| `npm run prisma:validate` | Валідація `schema.prisma` (підставляє тимчасовий `DATABASE_URL`) |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:migrate` / `prisma:deploy` / `prisma:seed` | Міграції та seed |

## Troubleshooting

| Проблема | Дія |
|----------|-----|
| Помилка підключення до БД | Перевірити `DATABASE_URL`, чи запущений контейнер `postgres` |
| Помилки міграцій після pull | `git pull`, потім `npx prisma migrate dev`; у крайньому випадку пересоздати локальну БД (дев only) |
| Порт зайнятий | Змінити `PORT` у `.env` |

## Навігація

- Архітектура запуску: [02-architecture.md](02-architecture.md)
- CI відтворює ці кроки: [13-ci-cd.md](13-ci-cd.md)

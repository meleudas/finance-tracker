# CI/CD

**Пов’язано:** [04-tech-stack.md](04-tech-stack.md) · [12-testing.md](12-testing.md) · [14-setup.md](14-setup.md)

## Цілі пайплайну

- Швидкий **quality gate** на кожен PR.
- **Відтворюваний** білд Docker-образу.
- Мінімізація ризику деплою зламаних міграцій або типів.

## Workflow `CI` ([.github/workflows/ci.yml](../.github/workflows/ci.yml))

Тригери: **push** і **pull_request** до гілок `main` та `develop`.

Увімкнено **concurrency** з `cancel-in-progress: true` — при новому запуску на тій самій гілці попередній скасовується.

```mermaid
flowchart LR
  A[Checkout] --> B[setup-node + npm ci]
  B --> C[prisma generate]
  C --> D[prisma validate]
  D --> E[prisma migrate deploy]
  E --> F[ESLint]
  F --> G[Typecheck]
  G --> H[Test test:ci]
  H --> I[Build]
  I --> J[docker build]
  J --> K["npm audit warn-only"]
```

| Крок         | Що робить                                                                 |
| ------------ | ------------------------------------------------------------------------- | --- | --------------------------------------------------- |
| Install      | `npm ci` (Node 22, кеш npm за `package-lock.json`)                        |
| Prisma       | `npx prisma generate`, `npx prisma validate`, `npx prisma migrate deploy` |
| ESLint       | `npm run lint`                                                            |
| Typecheck    | `npm run typecheck`                                                       |
| Test         | `npm run test:ci` (Jest з coverage)                                       |
| Build        | `npm run build` (`prisma generate` + `tsc`)                               |
| Docker build | `docker build -f docker/Dockerfile -t finance-tracker:ci .`               |
| npm audit    | `npm audit --omit=dev --audit-level=high` з суфіксом `                    |     | true` у workflow — лише попередження, без фейлу job |

### Сервіс PostgreSQL у CI

Для кроків Prisma і тестів піднімається контейнер **postgres:16-alpine** з healthcheck. `DATABASE_URL` у job вказує на `localhost:5432` (див. `env` у `ci.yml`).

**Redis і MinIO** у цьому workflow **не** піднімаються; integration-тести, яким потрібні ці сервіси, доведеться доповнити окремими service containers або моками (див. [12-testing.md](12-testing.md)).

### Docker build і `DATABASE_URL`

У build-stage [docker/Dockerfile](../docker/Dockerfile) задано placeholder:

```dockerfile
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public
ENV DATABASE_URL=$DATABASE_URL
```

Це потрібно, щоб `prisma generate` у `npm run build` не падав через `prisma.config.ts` / змінні оточення. Реальне підключення до БД в runtime — у контейнері після деплою.

## Інші workflows

### Dependency Review ([.github/workflows/dependency-review.yml](../.github/workflows/dependency-review.yml))

- Тригер: **pull_request** до `main` / `develop`.
- Дія: `actions/dependency-review-action` з `fail-on-severity: high`.
- Може додавати коментар у PR при невдачі (`comment-summary-in-pr: on-failure`).

### CodeQL ([.github/workflows/codeql.yml](../.github/workflows/codeql.yml))

- Мова: **javascript**.
- Тригери: push/PR у `main` / `develop`, плюс **щотижневий** schedule (`cron`).
- Результати — у Security вкладці репозиторію GitHub.

## Dependabot ([.github/dependabot.yml](../.github/dependabot.yml))

- Щотижневі PR для **npm**, **github-actions**, **docker** (контекст `docker/`).
- Для npm налаштовані **групи** оновлень (`@types/*`, eslint-стек, prisma).

## Branch protection (рекомендація)

- Обов’язковий успішний CI перед merge.
- Заборона force-push у `main`.
- Require review від 1 особи.

## Секрети

- Для поточного `ci.yml` секрети для `DATABASE_URL` не обов’язкові — URL заданий у `env` job.
- Для push образу в registry — окремі secrets (якщо додасте крок publish).

## Навігація

- Локальне відтворення кроків: [14-setup.md](14-setup.md)
- Релізний чеклист: [06-team-workflow.md](06-team-workflow.md)

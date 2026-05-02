# CI/CD

**Пов’язано:** [04-tech-stack.md](04-tech-stack.md) · [12-testing.md](12-testing.md) · [14-setup.md](14-setup.md)

## Цілі пайплайну

- Швидкий **quality gate** на кожен PR.
- **Відтворюваний** білд Docker-образу.
- Мінімізація ризику деплою зламаних міграцій або типів.

## Етапи (GitHub Actions)

```mermaid
flowchart LR
  A[Checkout] --> B[Install]
  B --> C[Lint]
  C --> D[Typecheck]
  D --> E[Test]
  E --> F[Build]
  F --> G[Docker build]
  G --> H[Security scan]
```

| Етап | Що робить |
|------|-----------|
| **Lint** | ESLint (+ optional Prettier check) |
| **Typecheck** | `tsc --noEmit` |
| **Test** | Jest з coverage; сервіс PostgreSQL як service container або mock-first |
| **Build** | Компіляція TS у `dist/` |
| **Docker build** | Багатоетапний Dockerfile з кешем шарів |
| **Security scan** | npm audit / OSV або Trivy scan image (обрати один стек) |

## Тригери

- **Pull request** до `main` / `develop` — повний пайплайн.
- **Push** до `main` — повний пайплайн + optional push image у registry.

## Сервісні контейнери

Для integration тестів з реальною БД:

```yaml
# ілюстрація — фактичний файл у .github/workflows/ci.yml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: finance_tracker_test
    ports:
      - 5432:5432
```

Перед тестами: `npx prisma migrate deploy` з `DATABASE_URL` на сервіс.

## Branch protection (рекомендація)

- Обов’язковий успішний CI перед merge.
- Заборона force-push у `main`.
- Require review від 1 особи.

## Секрети

- `DATABASE_URL` для CI — з GitHub Encrypted Secrets (якщо не використовується лише service container).
- Registry credentials для push образів — окремі secrets.

## Навігація

- Локальне відтворення кроків: [14-setup.md](14-setup.md)
- Релізний чеклист: [06-team-workflow.md](06-team-workflow.md)

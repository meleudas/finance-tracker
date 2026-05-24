# Пробні API-запити (узгоджено з Docker seed)

**Пов’язано:** [14-setup.md](../14-setup.md) · [08-api-design.md](../08-api-design.md) · [docker/seed/swagger-fixtures.json](../../docker/seed/swagger-fixtures.json)

Приклади нижче мають повертати **2xx** після заповнення БД seed-скриптами (`npm run db:seed:docker` або `docker compose --profile seed run --rm seed`).

## Базові налаштування

| Параметр     | Значення                                          |
| ------------ | ------------------------------------------------- |
| Base URL     | `http://localhost:3000` (або `APP_PORT` з `.env`) |
| Swagger UI   | `http://localhost:3000/api/docs`                  |
| OpenAPI JSON | `http://localhost:3000/api/openapi.json`          |
| Префікс API  | `/api/v1`                                         |

## Seed і довідник id

- SQL: [`docker/seed/sql/`](../../docker/seed/sql/)
- Id, query та паролі: [`docker/seed/swagger-fixtures.json`](../../docker/seed/swagger-fixtures.json)

### Користувачі

| Роль                   | Email                 | Пароль             | `userId`                    |
| ---------------------- | --------------------- | ------------------ | --------------------------- |
| Demo (основний)        | `demo@swagger.local`  | `SwaggerDemo123!`  | `clseed0000000000000000000` |
| Other (ізоляція / 404) | `other@swagger.local` | `OtherSwagger123!` | `clseed0000000000000000001` |

### Sample id (demo-користувач)

| Поле                                                      | Значення                    |
| --------------------------------------------------------- | --------------------------- |
| `currencyId` (UAH)                                        | `clseed0000000000000000002` |
| `accountId` (UAH, demo `i % 3 = 0`)                       | `clseed0000000000000000022` |
| `secondUahAccountId` (інший UAH: `...0025`, `...0028`, …) | `clseed0000000000000000025` |
| `incomeCategoryId`                                        | `clseed0000000000000000045` |
| `expenseCategoryId`                                       | `clseed0000000000000000046` |
| `transactionId`                                           | `clseed0000000000000000108` |
| `transferId`                                              | `clseed0000000000000000128` |
| `budgetId`                                                | `clseed0000000000000000148` |
| `recurringFrequencyId`                                    | `clseed0000000000000000068` |
| `recurringRuleId`                                         | `clseed0000000000000000088` |
| `attachmentId`                                            | `clseed0000000000000000168` |
| `otherUserAccountId`                                      | `clseed0000000000000000042` |

## Авторизація (обов’язково для захищених маршрутів)

Детально: [auth.md](auth.md).

1. `GET /api/v1/auth/csrf` — отримати `csrfToken` (також у cookie).
2. `POST /api/v1/auth/login` з заголовком `x-csrf-token: <csrfToken>` і cookie від кроку 1.
3. У наступних запитах: `Authorization: Bearer <accessToken>`.

Для `POST` / `PATCH` / `PUT` / `DELETE` на `/api/v1/*` (крім публічних) потрібен також CSRF — див. [auth.md](auth.md).

## Узгоджені діапазони дат (query `from` / `to`)

Використовуйте **одні й ті самі** значення в усіх GET з фільтром періоду, щоб дані demo-користувача потрапляли у відповідь.

| Призначення                         | `from`                                      | `to`                       |
| ----------------------------------- | ------------------------------------------- | -------------------------- |
| Звіти (`GET /reports`), report jobs | `2026-01-01T00:00:00.000Z`                  | `2026-04-30T23:59:59.999Z` |
| Транзакції, трансфери (list)        | `2026-01-01T00:00:00.000Z`                  | `2026-04-30T23:59:59.999Z` |
| Бюджети (list, фільтр періоду)      | `2026-01-01T00:00:00.000Z`                  | `2026-06-30T23:59:59.999Z` |
| Budget progress (`date`)            | `2026-03-15` або `2026-03-15T00:00:00.000Z` | —                          |

У seed транзакції мають `occurred_at` з **2026-02-01** (+ крок 4 дні); бюджети — період **2026-01-01 … 2026-06-30**.

## Query за замовчуванням

- Пагінація: `page=1`, `limit=20`
- Boolean у query: рядки `"true"` / `"false"` (`includeDeleted`, `activeNow`, `includeRecurring`)

## Soft-delete у seed

- Індекси **18–19** (0-based): accounts, categories, transactions, transfers, budgets, attachments — `is_deleted=true`.
- Валюти **KRW**, **TRY** — видалені глобально (`GET /currencies/code/TRY` → 404).

## Документація по сутностях

| Сутність              | Файл                                                 | JWT |
| --------------------- | ---------------------------------------------------- | --- |
| Auth                  | [auth.md](auth.md)                                   | —   |
| Currencies            | [currencies.md](currencies.md)                       | ні  |
| Accounts              | [accounts.md](accounts.md)                           | так |
| Categories            | [categories.md](categories.md)                       | так |
| Transactions          | [transactions.md](transactions.md)                   | так |
| Transfers             | [transfers.md](transfers.md)                         | так |
| Budgets               | [budgets.md](budgets.md)                             | так |
| Recurring frequencies | [recurring-frequencies.md](recurring-frequencies.md) | так |
| Recurring rules       | [recurring-rules.md](recurring-rules.md)             | так |
| Reports               | [reports.md](reports.md)                             | так |
| Attachments           | [attachments.md](attachments.md)                     | так |

## Швидкий чеклист після seed

- [ ] Login demo → access token
- [ ] `GET /currencies` (без токена)
- [ ] `GET /accounts`, `GET /transactions?from=...&to=...`
- [ ] `GET /reports?from=...&to=...` (обов’язкові `from` і `to`)
- [ ] `GET /budgets/progress?date=2026-03-15`

## curl у PowerShell

Замініть `YOUR_ACCESS_TOKEN` і `YOUR_CSRF_TOKEN` на значення після login.

```powershell
$BASE = "http://localhost:3000"
$TOKEN = "YOUR_ACCESS_TOKEN"
$CSRF = "YOUR_CSRF_TOKEN"
```

Для cookie-based CSRF збережіть cookies після `GET /auth/csrf` (наприклад `curl.exe -c cookies.txt -b cookies.txt`).

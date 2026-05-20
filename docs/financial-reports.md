# Фінансова звітність API

**Пов’язано:** [recurring-rules.md](recurring-rules.md) · [ADR 0004](adr/0004-recurring-frequency-and-s3-attachments.md)

## Режими отримання звіту (hybrid)

| Режим       | Endpoint                    | Формат       | Коли використовувати                  |
| ----------- | --------------------------- | ------------ | ------------------------------------- |
| Синхронний  | `GET /api/v1/reports`       | JSON         | Швидкий перегляд у UI                 |
| Асинхронний | `POST /api/v1/reports/jobs` | JSON або PDF | PDF, великі періоди, фонова генерація |

## Синхронний звіт

`GET /api/v1/reports?from=...&to=...&accountId?&includeRecurring=true`

Повертає `{ data: FinancialReport }` одразу.

### Query

| Параметр           | Обов’язковий | Опис                                                     |
| ------------------ | ------------ | -------------------------------------------------------- |
| `from` / `to`      | так          | Період (ISO 8601), `from <= to`                          |
| `accountId`        | ні           | Один рахунок                                             |
| `includeRecurring` | ні           | `true` за замовчуванням; `false` — без блоку `recurring` |

## Асинхронні jobs (BullMQ)

### Створити job

```http
POST /api/v1/reports/jobs
Content-Type: application/json

{
  "from": "2026-05-01T00:00:00.000Z",
  "to": "2026-05-31T23:59:59.999Z",
  "format": "pdf",
  "includeRecurring": true
}
```

Відповідь **202**: `{ data: { id, status: "PENDING", format: "PDF", ... } }`

### Статус і результат

`GET /api/v1/reports/jobs/:id`

- `status`: `PENDING` | `PROCESSING` | `COMPLETED` | `FAILED`
- `format: JSON` + `COMPLETED` → поле `data` з повним звітом
- `format: PDF` + `COMPLETED` → `downloadUrl` (presigned S3)

### Завантажити PDF через API

`GET /api/v1/reports/jobs/:id/download` — stream `application/pdf`

## Worker і інфраструктура

```bash
npm run worker          # окремий процес BullMQ worker
npm run dev:worker      # watch mode
```

Docker Compose: сервіс `worker` (той самий image, `node dist/workers/index.js`; піднімається разом із `docker compose up`).

### Env

| Змінна                             | Default             | Опис                 |
| ---------------------------------- | ------------------- | -------------------- |
| `REPORT_QUEUE_NAME`                | `financial-reports` | Ім’я черги BullMQ    |
| `REPORT_JOB_ATTEMPTS`              | `3`                 | Повтори при помилці  |
| `REPORT_JOB_BACKOFF_MS`            | `2000`              | Backoff              |
| `REPORT_PDF_PRESIGNED_TTL_SECONDS` | `3600`              | TTL presigned URL    |
| `REPORT_WORKER_CONCURRENCY`        | `2`                 | Паралельність worker |

Redis: `REDIS_URL` (спільний з кешем).

## Секція `recurring` у звіті

Якщо `includeRecurring` не `false`:

```json
"recurring": {
  "activeRulesCount": 2,
  "materializedAmount": 12000,
  "projectedAmount": 24000,
  "byRule": [
    {
      "ruleId": "...",
      "name": "Оренда",
      "direction": "EXPENSE",
      "amount": 12000,
      "frequencyLabel": "Every month",
      "runsInPeriod": 2,
      "materializedCount": 1,
      "materializedTotal": 12000
    }
  ]
}
```

- **materialized** — транзакції з `recurringRuleId` за період (після materialize планувальником).
- **projected** — оцінка `runsInPeriod × amount` для правил, що перетинають період.
- Транзакції від recurring мають `recurringRuleId` (FK) для точного зв’язку.

## Помилки

| Код | Ситуація                  |
| --- | ------------------------- |
| 400 | Невалідний query/body     |
| 404 | Чужий `accountId` або job |
| 202 | Job прийнято (не помилка) |

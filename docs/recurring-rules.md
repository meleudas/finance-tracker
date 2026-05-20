# Регулярні операції (RecurringFrequency і RecurringRule)

**Пов’язано:** [ADR 0004](adr/0004-recurring-frequency-and-s3-attachments.md) · [07-database.md](07-database.md)

## Огляд

- **RecurringFrequency** — іменований шаблон періодичності (`every` + `unit`: DAY, WEEK, MONTH, YEAR).
- **RecurringRule** — правило створення транзакцій: рахунок, сума, напрямок, частота, `nextRunAt`.
- **Планувальник** — фоновий cron створює `Transaction` для правил, у яких `nextRunAt <= now`.

## API

### Recurring frequencies

| Method | Path                                |
| ------ | ----------------------------------- |
| GET    | `/api/v1/recurring-frequencies`     |
| POST   | `/api/v1/recurring-frequencies`     |
| GET    | `/api/v1/recurring-frequencies/:id` |
| PATCH  | `/api/v1/recurring-frequencies/:id` |
| DELETE | `/api/v1/recurring-frequencies/:id` |

Видалення frequency повертає **409**, якщо є активні recurring rules.

### Recurring rules

| Method | Path                          |
| ------ | ----------------------------- |
| GET    | `/api/v1/recurring-rules`     |
| POST   | `/api/v1/recurring-rules`     |
| GET    | `/api/v1/recurring-rules/:id` |
| PATCH  | `/api/v1/recurring-rules/:id` |
| DELETE | `/api/v1/recurring-rules/:id` |

Query для списку: `accountId`, `frequencyId`, `direction`, `page`, `limit`.

### Приклад створення правила

```http
POST /api/v1/recurring-rules
Content-Type: application/json

{
  "name": "Оренда",
  "accountId": "clk7v9x1k0000qzq8x8x8x8xb",
  "currencyId": "clm7v9x1k0000qzq8x8x8x8xc",
  "frequencyId": "cln7v9x1k0000qzq8x8x8x8x1",
  "amount": 12000,
  "direction": "EXPENSE",
  "nextRunAt": "2026-06-01T09:00:00.000Z",
  "endsAt": "2027-06-01T09:00:00.000Z",
  "maxOccurrences": 12
}
```

Якщо `nextRunAt` не передано — використовується **поточний час** (перший запуск якнайшвидше).

## Семантика полів

| Поле              | Опис                                                      |
| ----------------- | --------------------------------------------------------- |
| `nextRunAt`       | Дата/час наступного (або поточного) виконання             |
| `endsAt`          | Опційно: після цієї дати правило не виконується           |
| `maxOccurrences`  | Опційно: максимум виконань                                |
| `occurrenceCount` | Скільки разів правило вже виконано (оновлює планувальник) |
| `currencyId`      | Має збігатися з валютою рахунку                           |

## Планувальник

Змінні оточення:

| Змінна                           | За замовчуванням          | Опис                      |
| -------------------------------- | ------------------------- | ------------------------- |
| `RECURRING_SCHEDULER_ENABLED`    | `true` (`false` у тестах) | Увімкнути cron            |
| `RECURRING_SCHEDULER_CRON`       | `* * * * *`               | Cron-вираз (щохвилини)    |
| `RECURRING_SCHEDULER_BATCH_SIZE` | `50`                      | Макс. правил за один tick |

Поведінка:

1. Знаходить due rules (`nextRunAt <= now`, не вичерпані).
2. Створює `Transaction` з `occurredAt = nextRunAt`, `note = "Recurring: {name}"`.
3. Зсуває `nextRunAt` через `advanceNextRunAt(every, unit)`.
4. Інкрементує `occurrenceCount`.
5. До **10 catch-up** ітерацій на правило за tick, якщо сервер відстав.
6. Після `maxOccurrences` або `endsAt` — `nextRunAt` встановлюється у «завершений» стан (далеке майбутнє), правило більше не обробляється.

**Multi-instance:** у MVP cron працює на кожному інстансі API; для production рекомендується один worker або Redis lock (TODO).

## Зв’язок зі звітністю

- Materialized транзакції мають `recurringRuleId` (FK на правило).
- У фінансовому звіті (`GET /reports` або job) блок `recurring` показує активні правила за період, materialized суми та projected оцінку.
- Див. [financial-reports.md](financial-reports.md).

## Помилки

| Код | Ситуація                                            |
| --- | --------------------------------------------------- |
| 400 | Невалідні дані / `endsAt` не після `nextRunAt`      |
| 404 | Чужий account, frequency, category                  |
| 409 | Дубль імені frequency / видалення frequency з rules |

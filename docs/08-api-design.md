# Дизайн API

**Пов’язано:** [02-architecture.md](02-architecture.md) · [07-database.md](07-database.md) · [10-error-handling.md](10-error-handling.md) · [recurring-rules.md](recurring-rules.md) · [financial-reports.md](financial-reports.md)

## Загальні принципи

- **REST** поверх **HTTPS**.
- **Версіонування шляхом:** усі ресурси під **`/api/v1`**.
- **JSON** для body і відповідей; кодування UTF-8.
- **Час:** ISO 8601 у UTC (`2026-05-02T12:00:00.000Z`), якщо не узгоджено інакше для «дат без часу».

## Успішна відповідь (узгоджений формат)

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

- **`data`** — корисне навантаження (об’єкт або масив).
- **`meta`** — опційно: пагінація, `requestId` для підтримки.

### Пагінація (списки)

Рекомендовані query-параметри:

- `page` (1-based) або `cursor` — оберіть **один** стиль для MVP і зафіксуйте в OpenAPI.
- `limit` (max наприклад 100).

Приклад `meta` для offset-пагінації:

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 135,
    "requestId": "uuid"
  }
}
```

## Помилки

Єдиний формат для клієнта — див. [10-error-handling.md](10-error-handling.md). HTTP-статус відображає клас проблеми (4xx клієнт, 5xx сервер).

## Автентифікація

- Реєстрація / логін — видача токенів (деталі зберігання — [09-security.md](09-security.md)).
- Захищені маршрути — заголовок `Authorization: Bearer <access>` **або** cookie (узгодити один канал для клієнта MVP і описати в OpenAPI `securitySchemes`).

## Приклад карти ендпоінтів (MVP)

| Метод     | Шлях                      | Опис                                                |
| --------- | ------------------------- | --------------------------------------------------- |
| POST      | `/api/v1/auth/register`   | Реєстрація                                          |
| POST      | `/api/v1/auth/login`      | Логін                                               |
| POST      | `/api/v1/auth/refresh`    | Оновлення access                                    |
| POST      | `/api/v1/auth/logout`     | Вихід (інвалідація refresh — за наявності стореджу) |
| GET/PATCH | `/api/v1/users/me`        | Профіль                                             |
| CRUD      | `/api/v1/accounts`        | Рахунки                                             |
| CRUD      | `/api/v1/categories`      | Категорії                                           |
| CRUD      | `/api/v1/transactions`    | Транзакції                                          |
| CRUD      | `/api/v1/budgets`         | Бюджети                                             |
| GET       | `/api/v1/reports/summary` | Зведення за період                                  |

Точні схеми body/query — у **Zod** у `src/validators/` і в OpenAPI.

## OpenAPI та Swagger UI

- **Генерація:** `@asteasolutions/zod-to-openapi` — реєстрація шляхів і схем у центральному `openApiRegistry`.
- **UI:** `GET /api/docs` (або `/docs` — зафіксувати один URL).
- **JSON spec:** `GET /api/openapi.json` — для імпорту в Postman/Insomnia.

## Ідемпотентність

Для чутливих операцій (повторна відправка форми) у майбутньому можна додати заголовок `Idempotency-Key`; у MVP — опційно, не блокер.

## Навігація

- Пробні запити (Docker seed): [trial-requests/README.md](trial-requests/README.md)
- Безпека: [09-security.md](09-security.md)
- Тестування контрактів: [12-testing.md](12-testing.md)

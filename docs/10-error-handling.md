# Обробка помилок

**Пов’язано:** [08-api-design.md](08-api-design.md) · [03-project-structure.md](03-project-structure.md)

## Цілі

- **Передбачувані** HTTP-відповіді для клієнта.
- **Єдиний** формат тіла помилки.
- **Без витоку** внутрішніх stack trace у production.
- Зручний **debug** у dev/staging.

## Базовий клас `AppError`

Умовний приклад структури (реалізація в `src/utils/errors.ts`):

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
```

## Спеціалізовані помилки (рекомендований набір)

| Клас | HTTP | Коли |
|------|------|------|
| `ValidationError` | 400 | Zod / бізнес-валідація вхідних даних |
| `UnauthorizedError` | 401 | Немає або невалідний токен |
| `ForbiddenError` | 403 | Токен є, але немає права на ресурс |
| `NotFoundError` | 404 | Ресурс не знайдено або не ваш |
| `ConflictError` | 409 | Дубль email, порушення унікальності |
| `RateLimitError` | 429 | Перевищено ліміт |
| `InternalError` | 500 | Неочікувана помилка (заглушка для клієнта) |

Наслідування від `AppError` дозволяє централізовано мапити на статуси.

## Формат JSON для помилки

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable message",
    "details": {},
    "requestId": "uuid"
  }
}
```

- **`code`** — стабільний машиночитаний ідентифікатор для клієнта.
- **`details`** — опційно (наприклад, масив помилок полів від Zod у development або завжди якщо безпечно).
- **`requestId`** — збіг з логами (див. [11-logging.md](11-logging.md)).

## Error middleware (Express)

- Останній у ланцюгу `app.use`.
- Якщо `err` є `AppError` — віддати `statusCode` і тіло за форматом вище.
- Якщо невідома помилка:
  - **development:** можна додати `stack` у відповідь **або** лише в логи.
  - **production:** загальне повідомлення, stack тільки в логах.

## Контролери та сервіси

- **Сервіси** кидають `AppError` / підкласи; не формують `res` напряму.
- **Контролери** не глушать помилки без потреби; error middleware — єдина точка перетворення в HTTP.
- **Репозиторії** зазвичай пропагують помилки Prisma нагору; **мапінг** на `AppError` / HTTP виконує сервіс або спільний helper, щоб не дублювати логіку в кожному репозиторії.

## Помилки Prisma

Мапінг типових кодів Prisma на HTTP:

- `P2002` (unique) → **409 Conflict**
- `P2025` (record not found) → **404** (якщо доречно)
- Інше → **500** + лог з повним контекстом

## Навігація

- Логування помилок: [11-logging.md](11-logging.md)
- Тести на помилки: [12-testing.md](12-testing.md)

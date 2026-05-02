# Логування

**Пов’язано:** [04-tech-stack.md](04-tech-stack.md) · [10-error-handling.md](10-error-handling.md) · [13-ci-cd.md](13-ci-cd.md)

## Цілі

- **Структуровані** логи (JSON) для продакшену та агрегації (ELK, Loki, CloudWatch).
- **Кореляція** запитів через унікальний `requestId`.
- **Маскування** чутливих полів.
- Різні **рівні** за середовищем.

## Стек

- **Pino** — основний логер (швидкий, JSON).
- **pino-http** — автоматичне логування методів, шляху, статус-коду, тривалості.

## Correlation ID

1. На вході middleware генерує або приймає з заголовка `X-Request-Id` (UUID).
2. Значення додається до `req.id` (або `req.context.requestId`).
3. Усі логи в межах запиту включають `requestId`.
4. У відповіді — заголовок `X-Request-Id` (дзеркалити клієнту для підтримки).

## Рівні логів

| Рівень | Застосування |
|--------|----------------|
| `debug` | Детальна відладка (тільки dev) |
| `info` | Успішні події, старт сервера |
| `warn` | Відхилені запити, деградація |
| `error` | Винятки, 5xx |

У production зазвичай мінімум `info`; `debug` вимкнено.

## Поля HTTP (pino-http)

Типові поля: `method`, `url`, `statusCode`, `responseTime`, `remoteAddress` (задокументувати GDPR якщо потрібно).

## Маскування чутливих даних

Не логувати або замінювати:

- `password`, `Authorization`, `cookie`, `token`, `refreshToken`
- повні номери карт (якщо колись з’являться) — лише останні 4 цифри за політикою

Приклад redaction у конфігурації Pino (концептуально):

```typescript
const redact = {
  paths: ["req.headers.authorization", "req.headers.cookie", "password"],
  censor: "[REDACTED]",
};
```

## Помилки

- У `error` логах зберігати `err.message`, `err.stack`, `requestId`, **без** тіла запиту якщо воно може містити пароль.
- Узгодити з [10-error-handling.md](10-error-handling.md), щоб клієнт бачив тільки безпечне повідомлення.

## Навігація

- Безпека та секрети: [09-security.md](09-security.md)
- CI артефакти логів: [13-ci-cd.md](13-ci-cd.md)

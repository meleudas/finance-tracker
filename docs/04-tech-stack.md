# Технологічний стек

**Пов’язано:** [02-architecture.md](02-architecture.md) · [14-setup.md](14-setup.md)

Мета стеку — **типобезпека кінця-до-кінця**, швидкий фідбек у CI, передбачувані деплої та мінімум runtime-сюрпризів у фінансових операціях.

## Зведена таблиця

| Технологія | Роль у проєкті |
|------------|----------------|
| **Node.js** (LTS, рекомендовано ≥ 20) | Середовище виконання |
| **TypeScript** (strict) | Статична типізація всього `src/` |
| **Express.js** | HTTP-сервер, middleware pipeline |
| **PostgreSQL** | Реляційне сховище, ACID для транзакцій |
| **Prisma** | ORM, міграції, типізований клієнт |
| **Zod** | Валідація runtime + вивід типів |
| **@asteasolutions/zod-to-openapi** | Генерація OpenAPI 3 з Zod + Swagger UI |
| **jsonwebtoken** (JWT) | Access/refresh токени (контракт див. [09-security.md](09-security.md)) |
| **bcrypt** | Хешування паролів |
| **cookie-parser** + **httpOnly** cookies | Передача refresh (і/або access за потреби) без XSS-доступу з JS |
| **Pino** + **pino-http** | Структуровані логи, HTTP-метадані |
| **Jest** + **Supertest** | Unit та integration тести HTTP API |
| **@prisma/client** mock (jest) | Ізоляція **репозиторіїв** або legacy-тестів без реальної БД; сервіси бажано тестувати через **мок репозиторіїв** |
| **Helmet** | Заголовки безпеки HTTP |
| **cors** | Контроль дозволених origins |
| **express-rate-limit** | Захист від bruteforce / DoS на чутливих маршрутах |
| **sanitization** (наприклад, **express-mongo-sanitize** або еквівалент для JSON) | Зменшення ризику ін’єкцій у логіках, що будують запити |
| **Docker** + **Docker Compose** | Відтворювані середовища dev/staging/prod |
| **GitHub Actions** | CI/CD: lint → test → build → scan → image |

## Обґрунтування вибору

### Express + TypeScript

Зрілий екосистемний стандарт для REST, простий для командного онбордингу. **Strict TS** зменшує кількість помилок на межах шарів.

### PostgreSQL + Prisma

Фінансові дані виграють від **транзакцій** та **обмежень БД** (FK, unique). Prisma дає **міграції** та автогенерацію типів — менше розбіжностей між кодом і схемою.

### Zod + zod-to-openapi

Одна схема описує **валідацію** та **документацію** — менше дрейфу між кодом і Swagger.

### JWT + bcrypt + httpOnly cookies

- Паролі ніколи не зберігаються у відкритому вигляді (**bcrypt**).
- Токени з обмеженим часом життя; refresh у **httpOnly** знижує ризик викрадення через XSS порівняно з чистим localStorage (деталі в [09-security.md](09-security.md)).

### Pino + pino-http

JSON-логи придатні для агрегації (Loki, ELK); **pino-http** додає тривалість та статус кожного запиту.

### Jest + Supertest

- **Unit:** сервіси з моками **репозиторіїв**; окремо — unit репозиторіїв з моками Prisma за потреби.
- **Integration:** реальний Express `app` + HTTP без браузера.

### Docker

Один спосіб підняти **PostgreSQL** і зафіксувати версії для всіх розробників і CI.

## Версії (рекомендація)

Фіксувати **major** версії в `package.json` після стабілізації спринту 1. До того — використовувати діапазони з lockfile (`package-lock.json`).

## Навігація

- Роадмеп: [05-roadmap.md](05-roadmap.md)
- Безпека: [09-security.md](09-security.md)

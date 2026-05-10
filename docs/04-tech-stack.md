# Технологічний стек

**Пов’язано:** [02-architecture.md](02-architecture.md) · [14-setup.md](14-setup.md)

Мета стеку — **типобезпека кінця-до-кінця**, швидкий фідбек у CI, передбачувані деплої та мінімум runtime-сюрпризів у фінансових операціях.

## Зведена таблиця

| Технологія                                                                       | Роль у проєкті                                                                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Node.js** (LTS, рекомендовано ≥ 20)                                            | Середовище виконання                                                                                             |
| **TypeScript** (strict)                                                          | Статична типізація всього `src/`                                                                                 |
| **Express.js**                                                                   | HTTP-сервер, middleware pipeline                                                                                 |
| **PostgreSQL**                                                                   | Реляційне сховище, ACID для транзакцій                                                                           |
| **Prisma**                                                                       | ORM, міграції, типізований клієнт                                                                                |
| **Zod**                                                                          | Валідація runtime + вивід типів                                                                                  |
| **@asteasolutions/zod-to-openapi**                                               | Генерація OpenAPI 3 з Zod + Swagger UI                                                                           |
| **jsonwebtoken** (JWT)                                                           | Access/refresh токени (контракт див. [09-security.md](09-security.md))                                           |
| **bcrypt**                                                                       | Хешування паролів                                                                                                |
| **cookie-parser** + **httpOnly** cookies                                         | Передача refresh (і/або access за потреби) без XSS-доступу з JS                                                  |
| **Pino** + **pino-http**                                                         | Структуровані логи, HTTP-метадані                                                                                |
| **Jest** + **Supertest**                                                         | Unit та integration тести HTTP API                                                                               |
| **@prisma/client** mock (jest)                                                   | Ізоляція **репозиторіїв** або legacy-тестів без реальної БД; сервіси бажано тестувати через **мок репозиторіїв** |
| **Helmet**                                                                       | Заголовки безпеки HTTP                                                                                           |
| **cors**                                                                         | Контроль дозволених origins                                                                                      |
| **express-rate-limit**                                                           | Захист від bruteforce / DoS на чутливих маршрутах                                                                |
| **sanitization** (наприклад, **express-mongo-sanitize** або еквівалент для JSON) | Зменшення ризику ін’єкцій у логіках, що будують запити                                                           |
| **Redis**                                                                        | Кеш, черги, rate limiting тощо — інфра в Compose готова; конкретне використання залежить від реалізації в `src/` |
| **S3-сумісне сховище** (локально **MinIO**)                                      | Зберігання файлів (вкладення до транзакцій); у продакшені — той самий API (AWS S3, Cloudflare R2, …)             |
| **Docker** + **Docker Compose**                                                  | Postgres, Redis, MinIO та опційно контейнер API — однакове середовище для команди                                |
| **GitHub Actions**                                                               | CI: Prisma, lint, typecheck, test, build, Docker image; окремо CodeQL, Dependency Review                         |
| **Husky** + **lint-staged** + **commitlint**                                     | Локальні git hooks: формат/лінт на staged файлах, перевірка conventional commits                                 |

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

Compose піднімає **PostgreSQL**, **Redis** і **MinIO** (S3 API) для локальної parity з продом; за потреби той самий compose збирає образ API. Деталі портів і змінних: [14-setup.md](14-setup.md).

### Redis та object storage

**Redis** у стеку дозволяє додавати кеш, черги або сесії без зміни базової інфраструктури. **MinIO** емулює S3 у dev; у продакшені ті самі змінні `S3_*` вказують на реальний бакет. Модель даних для ключів файлів: [07-database.md](07-database.md), [ADR 0004](adr/0004-recurring-frequency-and-s3-attachments.md).

### Husky та якість комітів

Після `npm install` скрипт `prepare` підключає **Husky**: pre-commit запускає **lint-staged**, commit-msg — **commitlint**. Це не частина runtime, але знижує шум у CI.

## Версії (рекомендація)

Фіксувати **major** версії в `package.json` після стабілізації спринту 1. До того — використовувати діапазони з lockfile (`package-lock.json`).

## Навігація

- Роадмеп: [05-roadmap.md](05-roadmap.md)
- Безпека: [09-security.md](09-security.md)

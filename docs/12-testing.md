# Тестування

**Пов’язано:** [03-project-structure.md](03-project-structure.md) · [08-api-design.md](08-api-design.md) · [13-ci-cd.md](13-ci-cd.md)

## Стратегія

| Рівень            | Що тестуємо                                                                                        | Інструменти                         |
| ----------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Unit**          | Чисті функції, **сервіси з моками репозиторіїв** (бажано) або мок Prisma, якщо логіка ще в сервісі | Jest                                |
| **Integration**   | HTTP API + Express app, мок `@prisma/client` або тестова БД                                        | Jest + Supertest                    |
| **E2E** (опційно) | Повний сценарій проти реальної БД у Compose                                                        | Jest + Supertest або окремий раннер |

**Ціль покриття:** **≥ 80%** по проєкту з акцентом на **services**, **repositories** (критичні запити), **auth**, **transaction** інваріанти.

## Організація `tests/`

```text
tests/
├── unit/
│   ├── services/
│   └── repositories/
├── integration/
│   └── routes/
├── helpers/
│   ├── app.ts             # createApp() для Supertest
│   ├── repositoryMocks.ts # моки методів репозиторіїв
│   └── prismaMock.ts      # фабрики моків Prisma (integration / legacy)
└── setup.ts               # глобальний setup/teardown Jest
```

## Моки репозиторіїв (рекомендовано для unit)

- Сервіс отримує репозиторій через **конструктор / фабрику / DI**; у тесті підставляється об’єкт з `jest.fn()` на методах `findById`, `createInTransaction` тощо.
- Перевага: тести сервісу **не залежать** від Prisma і SQL.

## Мок Prisma

- Для **integration** або для unit **репозиторіїв**: підміна `prisma` через **dependency injection** або `jest.mock('@prisma/client')`.
- Для кожного тесту скидати моки (`beforeEach`).

## Integration тести (Supertest)

- Піднімати **відокремлений** `app` без `listen` (експорт з `src/index.ts` або `src/app.ts`).
- Тестувати коди відповіді, форму `data` / `error` з [08-api-design.md](08-api-design.md) та [10-error-handling.md](10-error-handling.md).

## Тестова база

- Окремий `DATABASE_URL` (наприклад `postgres://.../finance_tracker_test`).
- Перед прогоном: міграції. Після: **truncate** таблиць або `prisma.$transaction` з `deleteMany` у правильному порядку FK.

У **GitHub Actions** job `CI` піднімає лише **PostgreSQL**; **Redis** і **MinIO** у CI за замовчуванням відсутні. Якщо з’являться тести, що звертаються до Redis або S3, додайте service containers у workflow або використовуйте моки/локальний `docker compose` для цих сценаріїв (див. [13-ci-cd.md](13-ci-cd.md)).

## Приклад сценаріїв (мінімум)

- Реєстрація → логін → створення рахунку → створення транзакції → коректний баланс.
- Доступ до чужого `accountId` → 403/404 (за політикою).
- Невалідне тіло → 400 з `VALIDATION_FAILED`.

## Якість у CI

- `npm run test:ci` з `--coverage` і `--runInBand` за потреби для стабільності.
- Артефакт coverage у GitHub Actions (див. [13-ci-cd.md](13-ci-cd.md)).

## Навігація

- Локальний запуск середовища: [14-setup.md](14-setup.md)
- Конвенції імен тестів: [15-conventions.md](15-conventions.md)

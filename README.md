# Finance Tracker (Backend)

Бекенд для особистого трекера фінансів: облік рахунків, категорій, транзакцій, бюджетів та звітів. Побудований на **Node.js**, **Express.js** та **TypeScript**, з **PostgreSQL** і **Prisma**.

## Статус

[![CI](https://img.shields.io/badge/CI-GitHub_Actions-informational)](#)
[![Node](https://img.shields.io/badge/node-%3E%3D20-success)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

## Швидкий старт

```bash
git clone <repository-url>
cd finance-tracker
cp .env.example .env
npm install
docker compose up --build
```

`docker compose up --build` підіймає весь стек: API, PostgreSQL, Redis, MinIO.
Логи всіх сервісів видно в цьому ж терміналі. Для роботи у фоні використовуйте `docker compose up --build -d`, перегляд логів: `docker compose logs -f`.

Сервер за замовчуванням (і для `npm run dev`, і для Docker): `http://localhost:3000`. Документація API (Swagger): `/api/docs` (після реалізації).

## Документація

| Документ                                             | Опис                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [01-overview](docs/01-overview.md)                   | Мета, скоуп, метрики успіху                                |
| [02-architecture](docs/02-architecture.md)           | Архітектура, потік запиту                                  |
| [03-project-structure](docs/03-project-structure.md) | Структура `src/`                                           |
| [04-tech-stack](docs/04-tech-stack.md)               | Технології та обґрунтування                                |
| [05-roadmap](docs/05-roadmap.md)                     | Роадмеп на місяць                                          |
| [06-team-workflow](docs/06-team-workflow.md)         | Команда, Git-flow, review                                  |
| [07-database](docs/07-database.md)                   | БД, ER, міграції                                           |
| [08-api-design](docs/08-api-design.md)               | REST, версіонування, Swagger                               |
| [09-security](docs/09-security.md)                   | Безпека, OWASP                                             |
| [10-error-handling](docs/10-error-handling.md)       | Помилки, AppError                                          |
| [11-logging](docs/11-logging.md)                     | Pino, correlation ID                                       |
| [12-testing](docs/12-testing.md)                     | Тести, coverage                                            |
| [13-ci-cd](docs/13-ci-cd.md)                         | GitHub Actions, Docker                                     |
| [14-setup](docs/14-setup.md)                         | Детальний setup                                            |
| [15-conventions](docs/15-conventions.md)             | Конвенції коду                                             |
| [16-github-setup](docs/16-github-setup.md)           | Налаштування GitHub (branch protection, security, Actions) |
| [ADR](docs/adr/README.md)                            | Архітектурні рішення                                       |

## Структура репозиторію

```
finance-tracker/
├── src/                 # config, routes, controllers, services, repositories, …
├── prisma/
├── tests/
├── docker/
├── .github/workflows/
├── docs/
├── package.json
└── tsconfig.json
```

Детальніше: [03-project-structure](docs/03-project-structure.md).

### GitHub Actions

Якщо корінь Git-репозиторію — ця тек **`finance-tracker/`**, оновіть [`.github/workflows/ci.yml`](.github/workflows/ci.yml): приберіть `working-directory: finance-tracker` з кроків і `cache-dependency-path`, щоб усі шляхи вказували на корінь репо.

### Скрипти

| Скрипт                                | Призначення                           |
| ------------------------------------- | ------------------------------------- |
| `npm run dev`                         | Розробка (`tsx watch`)                |
| `npm run build`                       | Компіляція у `dist/`                  |
| `npm start`                           | Запуск `node dist/index.js`           |
| `npm run lint` / `typecheck` / `test` | Якість коду                           |
| `npm run prisma:validate`             | Перевірка схеми Prisma (без живої БД) |
| `npm run prisma:migrate`              | Локальні міграції                     |
| `npm run prisma:deploy`               | Застосувати міграції (CI/prod)        |

## Ліцензія

MIT (за узгодженням з власником репозиторію).

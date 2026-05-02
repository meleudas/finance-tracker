# Участь у розробці

Дякуємо за інтерес до проєкту. Нижче — мінімум правил, щоб контрибуція була передбачуваною для команди та CI.

## Перед початком

- Перегляньте [docs/06-team-workflow.md](docs/06-team-workflow.md) — гілки, ревʼю, Git-flow (`main` ← `develop` ← `feature/*`).
- Конвенції коду та чекліст PR — [docs/15-conventions.md](docs/15-conventions.md).

## Локальне середовище

```bash
git clone <repository-url>
cd finance-tracker
cp .env.example .env
npm install
docker compose up -d   # або лише Postgres за документацією
npx prisma migrate dev
npm run dev
```

Детальніше: [docs/14-setup.md](docs/14-setup.md).

## Гілки та коміти

- Формат комітів — **Conventional Commits**: `feat(auth): …`, `fix(api): …`, `chore(ci): …` тощо ([docs/15-conventions.md](docs/15-conventions.md)).
- Гілки: `feature/…`, `fix/…`, `chore/…` за узгодженою схемою в документації команди.

## Якість коду перед PR

У каталозі проєкту:

```bash
npm run lint
npm run typecheck
npm run test        # або скрипт із npm для CI-cценарію
npm run build
```

Якщо у проєкті налаштовані Git-hooks (**Husky** тощо), запускайте їх локально перед пушем — вони мають віддзеркалювати перевірки CI.

## Pull Request

- Заповніть шаблон PR у GitHub (Summary, тест-план, чекліст із conventions).
- Переконайтеся, що немає секретів у коді чи логах у описі PR/issue.

## Документація

Додаткові матеріали в каталозі [docs/](docs/) — архітектура, API, безпека, тестування тощо.

## GitHub для адміністраторів репозиторію

Інструкції з налаштування branch protection, безпеки й Actions — [docs/16-github-setup.md](docs/16-github-setup.md).

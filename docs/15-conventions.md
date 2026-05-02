# Конвенції коду та процесу

**Пов’язано:** [06-team-workflow.md](06-team-workflow.md) · [08-api-design.md](08-api-design.md)

## Мова та стиль

- Код (ідентифікатори, коментарі в коді) — **англійська**.
- Документація проєкту в `docs/` — **українська** (цей репозиторій).

## TypeScript

- Режим **`strict`** увімкнено в `tsconfig.json`.
- Уникати `any`; для невідомих даних — `unknown` + звуження.
- Експортовані публічні функції мають явні типи повернення за потреби.

## Іменування

| Сутність | Стиль | Приклад |
|----------|--------|---------|
| Файли модулів | `camelCase` або `kebab-case` — обрати один і триматися | `transactionService.ts` |
| Класи / типи | `PascalCase` | `AppError` |
| Функції / змінні | `camelCase` | `createTransaction` |
| Константи | `SCREAMING_SNAKE` або `camelCase` — узгодити | `MAX_PAGE_SIZE` |

## ESLint + Prettier

- ESLint — правила якості та безпеки (наприклад `@typescript-eslint`).
- Prettier — форматування; **не сперечатися з форматтером** у PR.

## Commits (Conventional Commits)

Формат:

```text
<type>(<scope>): <short description>
```

**Типи:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.

Приклади:

```text
feat(auth): add refresh token rotation
fix(transactions): prevent negative balance in transfer
chore(ci): add postgres service for integration tests
```

## Гілки

```text
feature/<area>-short-title
fix/<ticket>-short-title
chore/<task>-short-title
```

## Pull Request — опис

Коротко: **що**, **чому**, **як тестував** (команди або сценарій).

### Чекліст автора

- [ ] Оновлені / додані тести
- [ ] `npm run lint` та `npm run typecheck` локально
- [ ] Зміни в OpenAPI (якщо змінювався контракт)
- [ ] Немає секретів і великих випадкових файлів

## Навігація

- Рев’ю чекліст: [06-team-workflow.md](06-team-workflow.md)
- ADR для спірних рішень: [adr/README.md](adr/README.md)

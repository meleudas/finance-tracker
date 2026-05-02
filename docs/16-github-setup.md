# Налаштування GitHub (runbook)

Цей документ описує кроки в **інтерфейсі GitHub**, які не задаються лише файлами в репозиторії. Використовуйте його після мерджу конфігів CI, Dependabot і шаблонів.

**Пов’язано:** [06-team-workflow.md](06-team-workflow.md) · [13-ci-cd.md](13-ci-cd.md) · [CONTRIBUTING.md](../CONTRIBUTING.md)

## Загальні налаштування

1. **Settings → General**
   - **Default branch:** `main`.
   - **Features:** за потреби вимкніть Wiki / Projects, якщо не використовуєте.
   - **Pull Requests:**
     - увімкніть **Allow squash merge** (за бажанням — тільки squash);
     - **Always suggest updating pull request branches**;
     - **Automatically delete head branches** після мерджу.

## Захист гілок (Branch protection або Rulesets)

Налаштуйте для **`main`** і **`develop`** (через **Rules** / **Rulesets** або класичні branch protection rules):

- **Require a pull request before merging**
  - **Required number of approvals:** 1 (або більше за політикою команди).
- **Require status checks to pass**
  - Додайте обов’язкові перевірки з GitHub Actions (точні назви дивіться у вкладці PR → Checks після першого успішного прогону):
    - job **build** з workflow **CI** (`.github/workflows/ci.yml`);
    - job **Analyze** з workflow **CodeQL**;
    - job **Review** з workflow **Dependency Review** (лише для PR).
  - **Require branches to be up to date before merging** — рекомендовано.
- **Require conversation resolution before merging** — рекомендовано.
- **Require linear history** — за згодою команди (часто для `main`).
- **Do not allow bypassing the above settings** для ролей, які не мають mergе без правил.
- **Block force pushes** і **блок видалення** гілки.

Опційно для `main`: **Require signed commits** — лише якщо вся команда готова до GPG/SSH signing.

## Правила для тегів

- Додайте **tag protection** або правило для шаблону `v*`: заборона force-push і обмеження, хто може пушити теги.

## Безпека коду та залежностей

**Settings → Code security and analysis** (для публічного репозиторію більшість функцій доступні безкоштовно):

- Увімкніть **Dependabot alerts**.
- Увімкніть **Dependabot security updates** (автоматичні PR для вразливих залежностей).
- Увімкніть **Secret scanning** і **Push protection** (блокування витоку секретів у комітах).
- **CodeQL analysis:** можна покладатися на workflow `.github/workflows/codeql.yml`; «Default setup» у GitHub варто не дублювати, щоб не запускати аналіз двічі.

Переконайтеся, що `.github/dependabot.yml` присутній у **корені репозиторію** (гілка за замовчуванням), інакше Dependabot не підхопить конфіг.

## GitHub Actions

**Settings → Actions → General**

- **Actions permissions:** обмежте за політикою організації, наприклад:
  - дозволити **дозволені** дії та reusable workflows;
  - додати allowlist за потреби: `actions/*`, `github/codeql-action/*`, `actions/dependency-review-action` тощо.
- **Workflow permissions:** за замовчуванням **Read repository contents and packages** для `GITHUB_TOKEN`, якщо workflows не пишуть у репозиторій.
- Опційно: **Require approval for first-time contributors** для fork-PR.

## CODEOWNERS

Файл `.github/CODEOWNERS` потребує увімкнення **required review from Code Owners** у правилах гілки, якщо потрібен обов’язковий апрув від власників шляхів. Оновіть плейсхолдер `@YOUR_GITHUB_USERNAME` на реальні логіни.

## Монорепозиторій (якщо застосовно)

Якщо репозиторій Git — **батьківський** каталог з підпапкою `finance-tracker/`:

- Робочі шляхи в CI/Dependabot мають вказувати на `finance-tracker/` (див. історію змін або внутрішні нотатки команди).
- `.github/` і `dependabot.yml` мають бути в **корені Git**, а не лише всередині підпапки.

У поточному проєкті з одним коренем `finance-tracker` шляхи в workflow відносні до кореня репозиторію без префікса `finance-tracker/`.

## Контрольний список приймання

- [ ] Прямий push у `main` неможливий (крім винятків admin).
- [ ] PR не змерджити без зелених обов’язкових перевірок CI, CodeQL і Dependency Review.
- [ ] Dependabot створює оновлення за розкладом; групи залежностей налаштовані в `dependabot.yml`.
- [ ] Secret scanning / push protection увімкнені.
- [ ] У корені видно `SECURITY.md`, `CONTRIBUTING.md`, шаблони PR/issue.

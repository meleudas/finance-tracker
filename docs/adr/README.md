# Architecture Decision Records (ADR)

**Пов’язано:** [02-architecture.md](../02-architecture.md) · [15-conventions.md](../15-conventions.md)

## Навіщо ADR

ADR фіксує **важливі** архітектурні рішення з контекстом і наслідками. Це скорочує суперечки в PR і прискорює онбординг.

## Коли писати ADR

- Вибір БД / ORM / способу автентифікації.
- Breaking зміни в публічному API або моделі даних.
- Рішення з істотними trade-offs (безпека vs зручність).

## Іменування файлів

```text
docs/adr/NNNN-short-title.md
```

`NNNN` — порядковий номер з ведучими нулями.

## Шаблон

Скопіюйте в новий файл:

```markdown
# ADR NNNN: Title

## Status

Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## Context

What problem are we solving?

## Decision

What did we choose?

## Consequences

Positive and negative outcomes.

## Alternatives considered

What else was evaluated and why rejected?
```

## Реєстр рішень у цьому проєкті

| ID | Назва |
|----|--------|
| [0001-use-prisma.md](0001-use-prisma.md) | Використання Prisma як ORM |
| [0002-jwt-in-cookies.md](0002-jwt-in-cookies.md) | Refresh JWT у httpOnly cookies |
| [0003-repository-layer.md](0003-repository-layer.md) | Рівень репозиторіїв над Prisma |

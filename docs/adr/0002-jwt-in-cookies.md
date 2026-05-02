# ADR 0002: Refresh JWT у httpOnly cookies

## Status

Accepted

## Context

API має бути безпечним для типового SPA: потрібні короткоживучий **access** токен і механізм оновлення сесії без повторного введення пароля. Зберігання довгоживучих токенів у **localStorage** підвищує ризик викрадення через XSS.

## Decision

- **Access JWT** — короткий термін дії; передача через заголовок `Authorization` (за замовчуванням для MVP).
- **Refresh JWT** — передача через **httpOnly**, **Secure** (у production), **SameSite** cookie; ендпоінт `/auth/refresh` читає cookie на сервері.

Деталі заголовків і політик — у [09-security.md](../09-security.md).

## Consequences

**Плюси:**

- JavaScript на клієнті не має прямого доступу до refresh токена (зниження XSS-ризику для refresh).

**Мінуси:**

- Потрібна коректна конфігурація **CORS** і **credentials**.
- CSRF: для cookie-based сценаріїв може знадобитися захист (SameSite, CSRF token для state-changing операцій) — оцінити при появі браузерного клієнта.

## Alternatives considered

- **Лише Bearer токени в пам’яті / header** без refresh — простіше, але гірший UX і більше логінів.
- **Серверні сесії в Redis** — сильна модель інвалідації, але додаткова інфраструктура поза скоупом MVP.

# Скасування запитів (AbortSignal)

## Ланцюг

1. [`attachAbortSignal`](../src/middleware/abortSignal.ts) — на кожен HTTP-запит створює `AbortController`, прив’язує `req.abortSignal`, abort при `req.aborted` / `req.close`, якщо відповідь ще не завершена.
2. [`getServiceContext`](../src/http/requestContext.ts) — `{ signal: req.abortSignal }`.
3. Сервіси — `withServiceSignal(promise, ctx)` для Redis/S3; `repoOptions(ctx)` для репозиторіїв.
4. Репозиторії — [`withAbortSignal`](../src/utils/helpers/withAbortSignal.ts) навколо Prisma.
5. [`errorHandler`](../src/middleware/errorHandler.ts) — `AbortError` → HTTP **499** (порожнє тіло).

## Cooperative cancellation

Abort **не скасовує** виконання Prisma, ioredis чи S3 — лише перериває очікування промісу на стороні сервера. Запити в БД/Redis можуть дограти у фоні.

Особливо довгі операції (`$transaction`, `redis.keys`, великі upload) варто тримати короткими або виносити в черги.

## Єдиний API сервісів

На рівні сервісів використовується `ServiceContext` (`ctx?: { signal?: AbortSignal }`). Репозиторії приймають `RequestOptions` через `repoOptions(ctx)`.

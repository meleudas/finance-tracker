# Reports — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md) · [financial-reports.md](../financial-reports.md)

**JWT:** обов’язковий. Для асинхронних PDF jobs потрібен **report worker** (`npm run worker`).

## Що в seed

- Report jobs з періодом **2026-01-01 … 2026-04-30** (як у `swagger-fixtures.swaggerQueries.reportGet`).
- Статуси: PENDING, PROCESSING, COMPLETED (JSON/PDF), FAILED.

## Sample id (report jobs)

| Поле                       | Значення                                             |
| -------------------------- | ---------------------------------------------------- |
| `reportJobPendingId`       | `clseed0000000000000000188`                          |
| `reportJobCompletedJsonId` | `clseed0000000000000000196`                          |
| `reportJobCompletedPdfId`  | `clseed0000000000000000197` (download OK після seed) |
| `reportJobFailedId`        | `clseed0000000000000000200`                          |

**Увага:** id `...0191`, `...0193` тощо — це **PENDING/PROCESSING** PDF jobs; `GET .../download` поверне **409** «still processing». Для download використовуйте лише **COMPLETED** PDF: `...0197`, `...0199`, `...0201`, `...0203`, `...0205`.
| `accountId` (опційний фільтр) | `clseed0000000000000000022` |

## Обов’язкові дати (GET звіт + POST job)

| `from`                     | `to`                       |
| -------------------------- | -------------------------- |
| `2026-01-01T00:00:00.000Z` | `2026-04-30T23:59:59.999Z` |

## Ендпоінти

| Метод | Шлях                                 | Статус    |
| ----- | ------------------------------------ | --------- |
| GET   | `/api/v1/reports`                    | 200       |
| POST  | `/api/v1/reports/jobs`               | 202       |
| GET   | `/api/v1/reports/jobs/{id}`          | 200       |
| GET   | `/api/v1/reports/jobs/{id}/download` | 200 (PDF) |

---

## Синхронний фінансовий звіт

```http
GET /api/v1/reports?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z&accountId=clseed0000000000000000022&includeRecurring=true
```

| Query              | Обов’язковий      | Приклад                     |
| ------------------ | ----------------- | --------------------------- |
| `from`             | **так**           | `2026-01-01T00:00:00.000Z`  |
| `to`               | **так**           | `2026-04-30T23:59:59.999Z`  |
| `accountId`        | ні                | `clseed0000000000000000022` |
| `includeRecurring` | ні (default true) | `true`                      |

```powershell
curl.exe -s "$BASE/api/v1/reports?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z&accountId=clseed0000000000000000022&includeRecurring=true" `
  -H "Authorization: Bearer $TOKEN"
```

**Відповідь:** `{ "data": { "period", "filters", "currencies": [ { "summary", "byCategory", "byAccount", ... } ] } }`.

Без `from` / `to` → **400** (`from is required`, `to is required`).

---

## Створити report job

**Body:**

```json
{
  "from": "2026-01-01T00:00:00.000Z",
  "to": "2026-04-30T23:59:59.999Z",
  "format": "pdf",
  "includeRecurring": true,
  "accountId": "clseed0000000000000000022"
}
```

`format`: `"json"` | `"pdf"`.

```powershell
curl.exe -s -X POST "$BASE/api/v1/reports/jobs" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"from\":\"2026-01-01T00:00:00.000Z\",\"to\":\"2026-04-30T23:59:59.999Z\",\"format\":\"pdf\",\"includeRecurring\":true,\"accountId\":\"clseed0000000000000000022\"}"
```

**Очікується:** `202`, `data.status` = `"PENDING"`.

---

## Статус job (seed — COMPLETED JSON)

```powershell
curl.exe -s "$BASE/api/v1/reports/jobs/clseed0000000000000000196" `
  -H "Authorization: Bearer $TOKEN"
```

**Очікується:** `200`, `data.status` = `"COMPLETED"`, `data.format` = `"JSON"`, поле `data` зі звітом.

---

## Статус job (seed — PENDING)

```powershell
curl.exe -s "$BASE/api/v1/reports/jobs/clseed0000000000000000188" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Статус job (seed — FAILED)

```powershell
curl.exe -s "$BASE/api/v1/reports/jobs/clseed0000000000000000200" `
  -H "Authorization: Bearer $TOKEN"
```

**Очікується:** `data.status` = `"FAILED"`, `errorMessage` заповнено.

---

## Завантажити PDF (completed PDF job)

```powershell
curl.exe -s "$BASE/api/v1/reports/jobs/clseed0000000000000000197/download" `
  -H "Authorization: Bearer $TOKEN" `
  -o report.pdf
```

Після `npm run db:seed:docker` у MinIO завантажується мінімальний PDF для completed PDF jobs. Для **нового** job: дочекайтесь `status: COMPLETED` (worker у Docker: сервіс `worker`).

---

## Негативний приклад (невалідний період)

```powershell
curl.exe -s "$BASE/api/v1/reports?from=2026-04-30T23:59:59.999Z&to=2026-01-01T00:00:00.000Z" `
  -H "Authorization: Bearer $TOKEN"
```

**Очікується:** `400` (`from` must be before or equal to `to`).

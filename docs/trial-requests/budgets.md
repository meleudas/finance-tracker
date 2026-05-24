# Budgets — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed

- 20 бюджетів demo; період **2026-01-01 … 2026-06-30**; `limit_amount` від 1000.
- **2 soft-deleted** (індекси 18–19).
- `GET /budgets/progress` — активні бюджети на дату всередині періоду.

## Sample id

| Поле                | Значення                    |
| ------------------- | --------------------------- |
| `budgetId`          | `clseed0000000000000000148` |
| `accountId`         | `clseed0000000000000000022` |
| `currencyId`        | `clseed0000000000000000002` |
| `expenseCategoryId` | `clseed0000000000000000046` |

## Діапазони

| Призначення           | `from`                     | `to`                       |
| --------------------- | -------------------------- | -------------------------- |
| List (фільтр періоду) | `2026-01-01T00:00:00.000Z` | `2026-06-30T23:59:59.999Z` |
| Progress `date`       | `2026-03-15`               | —                          |

## Ендпоінти

| Метод  | Шлях                         | Статус |
| ------ | ---------------------------- | ------ |
| GET    | `/api/v1/budgets`            | 200    |
| GET    | `/api/v1/budgets/progress`   | 200    |
| GET    | `/api/v1/budgets/{id}`       | 200    |
| POST   | `/api/v1/budgets`            | 201    |
| PATCH  | `/api/v1/budgets/{id}`       | 200    |
| PUT    | `/api/v1/budgets/{id}/limit` | 200    |
| DELETE | `/api/v1/budgets/{id}`       | 200    |

> Маршрут `/progress` оголошено **перед** `/:id`.

---

## Список

```http
GET /api/v1/budgets?page=1&limit=20&from=2026-01-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z
```

| Query         | Приклад                     |
| ------------- | --------------------------- |
| `page`        | `1`                         |
| `limit`       | `20`                        |
| `from` / `to` | див. таблицю вище           |
| `accountId`   | `clseed0000000000000000022` |
| `categoryId`  | `clseed0000000000000000046` |
| `activeNow`   | `true`                      |

```powershell
curl.exe -s "$BASE/api/v1/budgets?page=1&limit=20&from=2026-01-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

```powershell
curl.exe -s "$BASE/api/v1/budgets?activeNow=true" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Прогрес по бюджетах

```http
GET /api/v1/budgets/progress?date=2026-03-15
```

| Query  | Приклад                       |
| ------ | ----------------------------- |
| `date` | `2026-03-15` або ISO datetime |

```powershell
curl.exe -s "$BASE/api/v1/budgets/progress?date=2026-03-15" `
  -H "Authorization: Bearer $TOKEN"
```

**Відповідь:** `{ "data": [ { "id", "name", "limitAmount", "spentAmount", "remainingAmount", "isExceeded", ... } ] }`.

---

## Один бюджет

```powershell
curl.exe -s "$BASE/api/v1/budgets/clseed0000000000000000148" `
  -H "Authorization: Bearer $TOKEN"
```

Може містити `spentAmount` / `remainingAmount` при get-by-id.

---

## Створити

`currencyId` має збігатися з валютою `accountId`. Категорія — лише `EXPENSE`.

**Body:**

```json
{
  "name": "Trial budget March",
  "accountId": "clseed0000000000000000022",
  "currencyId": "clseed0000000000000000002",
  "categoryId": "clseed0000000000000000046",
  "limitAmount": 2500,
  "periodStart": "2026-07-01T00:00:00.000Z",
  "periodEnd": "2026-07-31T23:59:59.999Z"
}
```

Новий період поза seed — уникнення конфлікту overlap.

```powershell
curl.exe -s -X POST "$BASE/api/v1/budgets" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Trial budget March\",\"accountId\":\"clseed0000000000000000022\",\"currencyId\":\"clseed0000000000000000002\",\"categoryId\":\"clseed0000000000000000046\",\"limitAmount\":2500,\"periodStart\":\"2026-07-01T00:00:00.000Z\",\"periodEnd\":\"2026-07-31T23:59:59.999Z\"}"
```

---

## Оновити ліміт

**Body:**

```json
{
  "limitAmount": 3000
}
```

```powershell
curl.exe -s -X PUT "$BASE/api/v1/budgets/clseed0000000000000000148/limit" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"limitAmount\":3000}"
```

---

## PATCH (назва / період)

**Body:**

```json
{
  "name": "Budget 1 (trial rename)"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/budgets/clseed0000000000000000148" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Budget 1 (trial rename)\"}"
```

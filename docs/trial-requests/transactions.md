# Transactions — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed

- 20 транзакцій demo: **10 INCOME**, **10 EXPENSE**; `occurred_at` з **2026-02-01** (+ 4 дні на запис).
- **2 soft-deleted** (індекси 18–19).
- Перші 3 пов’язані з `recurringRuleId` seed.

## Sample id

| Поле                | Значення                    |
| ------------------- | --------------------------- |
| `accountId`         | `clseed0000000000000000022` |
| `currencyId`        | `clseed0000000000000000002` |
| `expenseCategoryId` | `clseed0000000000000000046` |
| `incomeCategoryId`  | `clseed0000000000000000045` |
| `transactionId`     | `clseed0000000000000000108` |

## Діапазон дат (list)

| `from`                     | `to`                       |
| -------------------------- | -------------------------- |
| `2026-01-01T00:00:00.000Z` | `2026-04-30T23:59:59.999Z` |

## Ендпоінти

| Метод  | Шлях                                           | Статус |
| ------ | ---------------------------------------------- | ------ |
| GET    | `/api/v1/transactions`                         | 200    |
| GET    | `/api/v1/transactions/accounts/{accountId}`    | 200    |
| GET    | `/api/v1/transactions/categories/{categoryId}` | 200    |
| GET    | `/api/v1/transactions/{id}`                    | 200    |
| POST   | `/api/v1/transactions`                         | 201    |
| PATCH  | `/api/v1/transactions/{id}`                    | 200    |
| DELETE | `/api/v1/transactions/{id}`                    | 200    |

---

## Список

```http
GET /api/v1/transactions?page=1&limit=20&from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z
```

| Query        | Обов’язковий | Приклад                     |
| ------------ | ------------ | --------------------------- |
| `page`       | ні           | `1`                         |
| `limit`      | ні           | `20`                        |
| `from`       | ні           | `2026-01-01T00:00:00.000Z`  |
| `to`         | ні           | `2026-04-30T23:59:59.999Z`  |
| `accountId`  | ні           | `clseed0000000000000000022` |
| `categoryId` | ні           | `clseed0000000000000000046` |
| `direction`  | ні           | `EXPENSE`                   |

```powershell
curl.exe -s "$BASE/api/v1/transactions?page=1&limit=20&from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

```powershell
curl.exe -s "$BASE/api/v1/transactions?direction=EXPENSE&from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

---

## За рахунком

```http
GET /api/v1/transactions/accounts/clseed0000000000000000022?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z
```

```powershell
curl.exe -s "$BASE/api/v1/transactions/accounts/clseed0000000000000000022?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

---

## За категорією

```powershell
curl.exe -s "$BASE/api/v1/transactions/categories/clseed0000000000000000046?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Одна транзакція

```powershell
curl.exe -s "$BASE/api/v1/transactions/clseed0000000000000000108" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити (EXPENSE)

`currencyId` має збігатися з валютою рахунку.

**Body:**

```json
{
  "accountId": "clseed0000000000000000022",
  "currencyId": "clseed0000000000000000002",
  "categoryId": "clseed0000000000000000046",
  "amount": 99.99,
  "direction": "EXPENSE",
  "occurredAt": "2026-03-01T12:00:00.000Z",
  "note": "Trial expense"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/transactions" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"accountId\":\"clseed0000000000000000022\",\"currencyId\":\"clseed0000000000000000002\",\"categoryId\":\"clseed0000000000000000046\",\"amount\":99.99,\"direction\":\"EXPENSE\",\"occurredAt\":\"2026-03-01T12:00:00.000Z\",\"note\":\"Trial expense\"}"
```

**Очікується:** `201`.

---

## Оновити

**Body:**

```json
{
  "note": "Updated trial note",
  "amount": 100
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/transactions/clseed0000000000000000108" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"note\":\"Updated trial note\"}"
```

---

## Видалити (soft)

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/transactions/clseed0000000000000000108" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

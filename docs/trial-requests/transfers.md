# Transfers — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed

- 20 трансферів між UAH-рахунками demo; `occurred_at` з **2026-02-10** (+ 3 дні).
- Валюта трансферів: UAH (`clseed0000000000000000002`).
- **2 soft-deleted** (індекси 18–19).

## Sample id

| Поле                                       | Значення                    |
| ------------------------------------------ | --------------------------- |
| `accountId` (UAH, для list by account)     | `clseed0000000000000000022` |
| `secondAccountId` (інший UAH, `i % 3 = 0`) | `clseed0000000000000000025` |
| `currencyId`                               | `clseed0000000000000000002` |
| `transferId`                               | `clseed0000000000000000128` |

## Діапазон дат (опційно)

| `from`                     | `to`                       |
| -------------------------- | -------------------------- |
| `2026-01-01T00:00:00.000Z` | `2026-04-30T23:59:59.999Z` |

## Ендпоінти

| Метод  | Шлях                                     | Статус |
| ------ | ---------------------------------------- | ------ |
| GET    | `/api/v1/transfers`                      | 200    |
| GET    | `/api/v1/transfers/accounts/{accountId}` | 200    |
| GET    | `/api/v1/transfers/{id}`                 | 200    |
| POST   | `/api/v1/transfers`                      | 201    |
| PATCH  | `/api/v1/transfers/{id}`                 | 200    |
| DELETE | `/api/v1/transfers/{id}`                 | 200    |

---

## Список

```http
GET /api/v1/transfers?page=1&limit=20
```

| Query           | Приклад                     |
| --------------- | --------------------------- |
| `page`          | `1`                         |
| `limit`         | `20`                        |
| `from`          | `2026-01-01T00:00:00.000Z`  |
| `to`            | `2026-04-30T23:59:59.999Z`  |
| `fromAccountId` | `clseed0000000000000000022` |
| `toAccountId`   | `clseed0000000000000000025` |

```powershell
curl.exe -s "$BASE/api/v1/transfers?page=1&limit=20" `
  -H "Authorization: Bearer $TOKEN"
```

```powershell
curl.exe -s "$BASE/api/v1/transfers?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

---

## За рахунком

```powershell
curl.exe -s "$BASE/api/v1/transfers/accounts/clseed0000000000000000022?from=2026-01-01T00:00:00.000Z&to=2026-04-30T23:59:59.999Z" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Один трансфер

```powershell
curl.exe -s "$BASE/api/v1/transfers/clseed0000000000000000128" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити

`fromAccountId` ≠ `toAccountId`; обидва рахунки — demo, одна валюта UAH.

**Body:**

```json
{
  "fromAccountId": "clseed0000000000000000022",
  "toAccountId": "clseed0000000000000000025",
  "currencyId": "clseed0000000000000000002",
  "amount": 50,
  "occurredAt": "2026-03-10T14:00:00.000Z",
  "note": "Trial transfer"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/transfers" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"fromAccountId\":\"clseed0000000000000000022\",\"toAccountId\":\"clseed0000000000000000025\",\"currencyId\":\"clseed0000000000000000002\",\"amount\":50,\"occurredAt\":\"2026-03-10T14:00:00.000Z\",\"note\":\"Trial transfer\"}"
```

**Очікується:** `201`.

---

## Оновити

**Body:**

```json
{
  "note": "Trial transfer updated"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/transfers/clseed0000000000000000128" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"note\":\"Trial transfer updated\"}"
```

---

## Видалити (soft)

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/transfers/clseed0000000000000000128" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

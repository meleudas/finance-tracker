# Recurring rules — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md) · [recurring-frequencies.md](recurring-frequencies.md)

**JWT:** обов’язковий.

## Що в seed

- 20 правил повторення demo, прив’язані до accounts / categories / frequencies.
- Перші транзакції seed (індекси 0–2) посилаються на `recurringRuleId`.

## Sample id

| Поле                   | Значення                    |
| ---------------------- | --------------------------- |
| `recurringRuleId`      | `clseed0000000000000000088` |
| `recurringFrequencyId` | `clseed0000000000000000068` |
| `accountId`            | `clseed0000000000000000022` |
| `currencyId`           | `clseed0000000000000000002` |
| `expenseCategoryId`    | `clseed0000000000000000046` |

## Ендпоінти

| Метод  | Шлях                           | Статус |
| ------ | ------------------------------ | ------ |
| GET    | `/api/v1/recurring-rules`      | 200    |
| GET    | `/api/v1/recurring-rules/{id}` | 200    |
| POST   | `/api/v1/recurring-rules`      | 201    |
| PATCH  | `/api/v1/recurring-rules/{id}` | 200    |
| DELETE | `/api/v1/recurring-rules/{id}` | 200    |

---

## Список

```http
GET /api/v1/recurring-rules?page=1&limit=20
```

| Query         | Приклад                     |
| ------------- | --------------------------- |
| `page`        | `1`                         |
| `limit`       | `20`                        |
| `accountId`   | `clseed0000000000000000022` |
| `frequencyId` | `clseed0000000000000000068` |
| `direction`   | `EXPENSE`                   |

```powershell
curl.exe -s "$BASE/api/v1/recurring-rules?page=1&limit=20" `
  -H "Authorization: Bearer $TOKEN"
```

```powershell
curl.exe -s "$BASE/api/v1/recurring-rules?accountId=clseed0000000000000000022" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Одне правило

```powershell
curl.exe -s "$BASE/api/v1/recurring-rules/clseed0000000000000000088" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити

**Body:**

```json
{
  "name": "Trial monthly rent",
  "accountId": "clseed0000000000000000022",
  "currencyId": "clseed0000000000000000002",
  "categoryId": "clseed0000000000000000046",
  "frequencyId": "clseed0000000000000000068",
  "amount": 500,
  "direction": "EXPENSE",
  "nextRunAt": "2026-08-01T09:00:00.000Z"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/recurring-rules" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Trial monthly rent\",\"accountId\":\"clseed0000000000000000022\",\"currencyId\":\"clseed0000000000000000002\",\"categoryId\":\"clseed0000000000000000046\",\"frequencyId\":\"clseed0000000000000000068\",\"amount\":500,\"direction\":\"EXPENSE\",\"nextRunAt\":\"2026-08-01T09:00:00.000Z\"}"
```

---

## Оновити

**Body:**

```json
{
  "amount": 550,
  "name": "Trial monthly rent (updated)"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/recurring-rules/clseed0000000000000000088" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"amount\":550}"
```

---

## Видалити

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/recurring-rules/clseed0000000000000000088" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

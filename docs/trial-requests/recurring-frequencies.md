# Recurring frequencies — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed

- 20 частот повторення demo (`every` + `unit`: DAY | WEEK | MONTH | YEAR).

## Sample id

| Поле                   | Значення                    |
| ---------------------- | --------------------------- |
| `recurringFrequencyId` | `clseed0000000000000000068` |

## Ендпоінти

| Метод  | Шлях                                 | Статус |
| ------ | ------------------------------------ | ------ |
| GET    | `/api/v1/recurring-frequencies`      | 200    |
| GET    | `/api/v1/recurring-frequencies/{id}` | 200    |
| POST   | `/api/v1/recurring-frequencies`      | 201    |
| PATCH  | `/api/v1/recurring-frequencies/{id}` | 200    |
| DELETE | `/api/v1/recurring-frequencies/{id}` | 200    |

---

## Список

```http
GET /api/v1/recurring-frequencies?page=1&limit=20
```

| Query   | Приклад                     |
| ------- | --------------------------- |
| `page`  | `1`                         |
| `limit` | `20`                        |
| `name`  | фільтр за ім’ям (substring) |

```powershell
curl.exe -s "$BASE/api/v1/recurring-frequencies?page=1&limit=20" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Одна частота

```powershell
curl.exe -s "$BASE/api/v1/recurring-frequencies/clseed0000000000000000068" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити

**Body:**

```json
{
  "name": "Every 2 weeks trial",
  "every": 2,
  "unit": "WEEK"
}
```

`unit`: `DAY` | `WEEK` | `MONTH` | `YEAR`.

```powershell
curl.exe -s -X POST "$BASE/api/v1/recurring-frequencies" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Every 2 weeks trial\",\"every\":2,\"unit\":\"WEEK\"}"
```

---

## Оновити

**Body:**

```json
{
  "name": "Monthly trial (updated)"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/recurring-frequencies/clseed0000000000000000068" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Monthly trial (updated)\"}"
```

---

## Видалити

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/recurring-frequencies/clseed0000000000000000068" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

> Видалення seed-частоти може зламати recurring rules — краще створювати нову для тестів DELETE.

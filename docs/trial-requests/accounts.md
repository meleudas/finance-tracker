# Accounts — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed (demo-користувач)

- 20 рахунків: **18 активних**, **2 soft-deleted** (індекси 18–19).
- Перший рахунок: `Demo account 1`, UAH (`currencyId` `clseed0000000000000000002`).
- +3 рахунки користувача `other` (для тесту 404).

## Sample id

| Поле                 | Значення                    |
| -------------------- | --------------------------- |
| `accountId`          | `clseed0000000000000000022` |
| `currencyId` (UAH)   | `clseed0000000000000000002` |
| `otherUserAccountId` | `clseed0000000000000000042` |

## Ендпоінти

| Метод  | Шлях                    | Статус |
| ------ | ----------------------- | ------ |
| GET    | `/api/v1/accounts`      | 200    |
| GET    | `/api/v1/accounts/{id}` | 200    |
| POST   | `/api/v1/accounts`      | 201    |
| PATCH  | `/api/v1/accounts/{id}` | 200    |
| DELETE | `/api/v1/accounts/{id}` | 200    |

---

## Список (активні)

```http
GET /api/v1/accounts?page=1&limit=20
```

| Query            | Тип                  | Обов’язковий       | Приклад                     |
| ---------------- | -------------------- | ------------------ | --------------------------- |
| `page`           | number               | ні (default 1)     | `1`                         |
| `limit`          | number               | ні (default 20)    | `20`                        |
| `currencyId`     | cuid                 | ні                 | `clseed0000000000000000002` |
| `includeDeleted` | `"true"` / `"false"` | ні (default false) | `false`                     |

```powershell
curl.exe -s "$BASE/api/v1/accounts?page=1&limit=20" `
  -H "Authorization: Bearer $TOKEN"
```

**Відповідь:** `{ "data": [...], "meta": { "page", "limit", "total", "totalPages", "requestId" } }`.

---

## Список з видаленими

```http
GET /api/v1/accounts?includeDeleted=true
```

```powershell
curl.exe -s "$BASE/api/v1/accounts?includeDeleted=true" `
  -H "Authorization: Bearer $TOKEN"
```

**Очікується:** до 20 записів (активні + soft-deleted).

---

## Один рахунок

```http
GET /api/v1/accounts/clseed0000000000000000022
```

```powershell
curl.exe -s "$BASE/api/v1/accounts/clseed0000000000000000022" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити

**Body:**

```json
{
  "name": "Swagger trial account",
  "currencyId": "clseed0000000000000000002"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/accounts" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Swagger trial account\",\"currencyId\":\"clseed0000000000000000002\"}"
```

**Очікується:** `201`, `data.id` (новий cuid).

---

## Оновити

**Body:**

```json
{
  "name": "Demo account 1 (renamed)"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/accounts/clseed0000000000000000022" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Demo account 1 (renamed)\"}"
```

---

## Видалити (soft)

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/accounts/clseed0000000000000000022" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

> Не видаляйте seed-рахунок, якщо потрібні інші пробні запити — краще створити новий і видалити його.

---

## Негативний приклад (чужий рахунок)

JWT demo + `otherUserAccountId`:

```powershell
curl.exe -s "$BASE/api/v1/accounts/clseed0000000000000000042" `
  -H "Authorization: Bearer $TOKEN"
```

**Очікується:** `404`.

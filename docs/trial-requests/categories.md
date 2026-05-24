# Categories — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md)

**JWT:** обов’язковий.

## Що в seed

- 12 кореневих категорій (6 INCOME, 6 EXPENSE) + 8 дочірніх; **2 корені soft-deleted** (індекси 10–11).
- `kind`: `INCOME` | `EXPENSE` (у query фільтр `kind` використовує ті самі значення).

## Sample id

| Поле                | Значення                    |
| ------------------- | --------------------------- |
| `incomeCategoryId`  | `clseed0000000000000000045` |
| `expenseCategoryId` | `clseed0000000000000000046` |

## Ендпоінти

| Метод  | Шлях                      | Статус |
| ------ | ------------------------- | ------ |
| GET    | `/api/v1/categories`      | 200    |
| GET    | `/api/v1/categories/{id}` | 200    |
| POST   | `/api/v1/categories`      | 201    |
| PATCH  | `/api/v1/categories/{id}` | 200    |
| DELETE | `/api/v1/categories/{id}` | 200    |

---

## Дерево категорій

```http
GET /api/v1/categories
```

| Query  | Тип                   | Приклад   |
| ------ | --------------------- | --------- |
| `kind` | `INCOME` \| `EXPENSE` | `EXPENSE` |

```powershell
curl.exe -s "$BASE/api/v1/categories" `
  -H "Authorization: Bearer $TOKEN"
```

```powershell
curl.exe -s "$BASE/api/v1/categories?kind=EXPENSE" `
  -H "Authorization: Bearer $TOKEN"
```

**Відповідь:** `{ "data": [ { "id", "name", "kind", "children": [...] }, ... ] }`.

---

## Одна категорія

```http
GET /api/v1/categories/clseed0000000000000000000046
```

```powershell
curl.exe -s "$BASE/api/v1/categories/clseed0000000000000000046" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Створити

**Body:**

```json
{
  "name": "Trial expense",
  "kind": "EXPENSE"
}
```

З батьківською категорією:

```json
{
  "name": "Trial sub-expense",
  "kind": "EXPENSE",
  "parentId": "clseed0000000000000000046"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/categories" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Trial expense\",\"kind\":\"EXPENSE\"}"
```

---

## Оновити

**Body:**

```json
{
  "name": "Expense root 1 (trial)"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/categories/clseed0000000000000000046" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"name\":\"Expense root 1 (trial)\"}"
```

---

## Видалити (soft)

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/categories/clseed0000000000000000046" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

> Краще видаляти категорію, створену пробним POST, а не seed-запис.

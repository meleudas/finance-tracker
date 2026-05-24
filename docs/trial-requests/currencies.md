# Currencies — пробні запити

**Пов’язано:** [README.md](README.md)

**JWT не потрібен** — публічний ресурс.

## Що в seed

- 20 валют глобально; **18 активних**, **2 soft-deleted** (коди **KRW**, **TRY**).
- UAH: `id` = `clseed0000000000000000002`, код `UAH`.

## Sample id

| Поле             | Значення                    |
| ---------------- | --------------------------- |
| `currencyId`     | `clseed0000000000000000002` |
| `currencyByCode` | `UAH`                       |

## Ендпоінти

| Метод | Шлях                             | Статус |
| ----- | -------------------------------- | ------ |
| GET   | `/api/v1/currencies`             | 200    |
| GET   | `/api/v1/currencies/code/{code}` | 200    |
| GET   | `/api/v1/currencies/{id}`        | 200    |

> Порядок routes: `/code/:code` оголошено **перед** `/:id`, щоб `code` не сприймався як id.

---

## Список активних валют

```http
GET /api/v1/currencies
```

```powershell
curl.exe -s "$BASE/api/v1/currencies"
```

**Відповідь:** `{ "data": [ { "id", "code", "name", "minorUnits", "createdAt", "updatedAt" }, ... ], "meta": { "requestId" } }` — без `isDeleted`.

---

## За кодом ISO

```http
GET /api/v1/currencies/code/UAH
```

```powershell
curl.exe -s "$BASE/api/v1/currencies/code/UAH"
```

**Очікується:** `200`, `data.code` = `"UAH"`.

---

## За id

```http
GET /api/v1/currencies/clseed0000000000000000002
```

```powershell
curl.exe -s "$BASE/api/v1/currencies/clseed0000000000000000002"
```

---

## Негативний приклад (soft-deleted)

```powershell
curl.exe -s "$BASE/api/v1/currencies/code/TRY"
```

**Очікується:** `404` (TRY видалена в seed).

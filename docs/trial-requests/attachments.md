# Attachments — пробні запити

**Пов’язано:** [README.md](README.md) · [auth.md](auth.md) · [transactions.md](transactions.md)

**JWT:** обов’язковий.

Базовий шлях: `/api/v1/transactions/{transactionId}/attachments`

## Що в seed

- 20 metadata-записів вкладень для demo-транзакцій; **2 soft-deleted**.
- Файли в MinIO можуть **відсутні** — presigned download інколи **404**, CRUD metadata працює.
- **Multipart upload** (`POST .../attachments`, поле `file`) потребує працюючого MinIO (`docker compose` сервіс `minio` healthy). Якщо S3 недоступний — **503** `SERVICE_UNAVAILABLE`, не 500.
- **Presigned URL** (`uploadUrl`, `downloadUrl`) підписуються для `S3_PUBLIC_ENDPOINT` (у Docker: `http://localhost:9000`). Не змінюйте host у URL вручну — інакше MinIO поверне `SignatureDoesNotMatch`.
- У **Swagger** (`/api/docs`) доступні всі 3 кроки presigned-flow: URL → **PUT .../presigned-upload** (multipart) → confirm. Прямий PUT на MinIO залишається альтернативою для curl.

## Sample id

| Поле            | Значення                    |
| --------------- | --------------------------- |
| `transactionId` | `clseed0000000000000000108` |
| `attachmentId`  | `clseed0000000000000000168` |

## Ендпоінти

| Метод  | Шлях                                   | Статус                  |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `.../attachments`                      | 200                     |
| GET    | `.../attachments/{id}`                 | 200                     |
| GET    | `.../attachments/{id}/download-url`    | 200                     |
| POST   | `.../attachments`                      | 201 (multipart)         |
| POST   | `.../attachments/presigned-upload-url` | 201                     |
| PUT    | `.../attachments/presigned-upload`     | 200 (multipart, крок 2) |
| POST   | `.../attachments/confirm`              | 201                     |
| PATCH  | `.../attachments/{id}`                 | 200                     |
| DELETE | `.../attachments/{id}`                 | 200                     |

---

## Список вкладень транзакції

```http
GET /api/v1/transactions/clseed0000000000000000108/attachments
```

| Query              | Приклад                                   |
| ------------------ | ----------------------------------------- |
| `expiresInSeconds` | `3600` (опційно, для download URL у list) |

```powershell
curl.exe -s "$BASE/api/v1/transactions/clseed0000000000000000108/attachments" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Одне вкладення

```powershell
curl.exe -s "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/clseed0000000000000000168" `
  -H "Authorization: Bearer $TOKEN"
```

---

## Presigned download URL

```powershell
curl.exe -s "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/clseed0000000000000000168/download-url?expiresInSeconds=3600" `
  -H "Authorization: Bearer $TOKEN"
```

**Примітка:** без файлу в MinIO URL може не відкритися — очікувана поведінка seed.

---

## Presigned upload (3 кроки)

### Крок 1 — отримати URL

**Body:**

```json
{
  "originalName": "receipt.pdf",
  "mimeType": "application/pdf"
}
```

Дозволені `mimeType`: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

```powershell
curl.exe -s -X POST "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/presigned-upload-url" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"originalName\":\"receipt.pdf\",\"mimeType\":\"application/pdf\"}"
```

**Відповідь:** `201`, у `data` — `storageKey`, `uploadUrl`, `expiresInSeconds`. Скопіюйте `storageKey` і `uploadUrl` для наступних кроків.

### Крок 2 — завантажити файл (Swagger або curl)

**Через API (Swagger UI, крок 2):** multipart `PUT .../presigned-upload` з полями `storageKey` (з кроку 1) і `file`.

```powershell
curl.exe -s -X PUT "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/presigned-upload" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF" `
  -F "storageKey=STORAGE_KEY_FROM_STEP_1" `
  -F "file=@receipt.pdf;type=application/pdf"
```

**Очікується:** `200`, у `data.storageKey` — той самий ключ.

**Альтернатива (прямо в MinIO):** PUT на **`uploadUrl` з кроку 1** з `Content-Type`, що відповідає `mimeType` з кроку 1.

```powershell
curl.exe -s -X PUT "UPLOAD_URL_FROM_STEP_1" `
  -H "Content-Type: application/pdf" `
  --data-binary "@receipt.pdf"
```

Очікується **200** від MinIO (порожнє тіло).

### Крок 3 — підтвердити

**Body:**

```json
{
  "storageKey": "STORAGE_KEY_FROM_STEP_1",
  "originalName": "receipt.pdf",
  "mimeType": "application/pdf"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/confirm" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"storageKey\":\"STORAGE_KEY_FROM_STEP_1\",\"originalName\":\"receipt.pdf\",\"mimeType\":\"application/pdf\"}"
```

**Очікується:** `201`, новий `data.id`.

---

## Пряме завантаження (multipart)

```powershell
curl.exe -s -X POST "$BASE/api/v1/transactions/clseed0000000000000000108/attachments" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF" `
  -F "file=@receipt.pdf" `
  -F "originalName=receipt.pdf" `
  -F "mimeType=application/pdf"
```

Поля form-data залежать від OpenAPI — перевірте `/api/docs`.

---

## Оновити metadata

**Body:**

```json
{
  "originalName": "receipt-renamed.pdf"
}
```

```powershell
curl.exe -s -X PATCH "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/clseed0000000000000000168" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -d "{\"originalName\":\"receipt-renamed.pdf\"}"
```

---

## Видалити (soft)

```powershell
curl.exe -s -X DELETE "$BASE/api/v1/transactions/clseed0000000000000000108/attachments/clseed0000000000000000168" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF"
```

---

## Негативний приклад (чужа транзакція)

Login як `other@swagger.local`, запит demo `transactionId`:

```powershell
curl.exe -s "$BASE/api/v1/transactions/clseed0000000000000000108/attachments" `
  -H "Authorization: Bearer $OTHER_USER_TOKEN"
```

**Очікується:** `404` або порожній список (залежно від реалізації).

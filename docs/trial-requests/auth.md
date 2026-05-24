# Auth — пробні запити

**Пов’язано:** [README.md](README.md)

Публічні маршрути `/api/v1/auth/*` (крім `logout`). Для `POST` потрібен **CSRF** (cookie + заголовок `x-csrf-token`).

**Swagger UI:** на кожній mutating операції (POST/PATCH/PUT/DELETE) є поле **`x-csrf-token`**; також можна один раз вказати в **Authorize → csrfHeader** після `GET /auth/csrf`.

## Облікові дані seed

| Користувач | Email                 | Пароль             |
| ---------- | --------------------- | ------------------ |
| Demo       | `demo@swagger.local`  | `SwaggerDemo123!`  |
| Other      | `other@swagger.local` | `OtherSwagger123!` |

## Ендпоінти

| Метод | Шлях                    | Статус | Опис                     |
| ----- | ----------------------- | ------ | ------------------------ |
| GET   | `/api/v1/auth/csrf`     | 200    | Отримати CSRF token      |
| POST  | `/api/v1/auth/login`    | 200    | Логін, access + refresh  |
| POST  | `/api/v1/auth/register` | 201    | Реєстрація (новий email) |
| POST  | `/api/v1/auth/refresh`  | 200    | Оновити access           |
| POST  | `/api/v1/auth/logout`   | 200    | Вихід (потрібен Bearer)  |

---

## 1. CSRF

```http
GET /api/v1/auth/csrf
```

```powershell
curl.exe -s "$BASE/api/v1/auth/csrf" -c cookies.txt
```

**Відповідь:** `{ "data": { "csrfToken": "..." } }` — зберегти token і cookies для наступних POST.

---

## 2. Login (demo)

**Body:**

```json
{
  "email": "demo@swagger.local",
  "password": "SwaggerDemo123!"
}
```

```powershell
curl.exe -s -X POST "$BASE/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -b cookies.txt -c cookies.txt `
  -d "{\"email\":\"demo@swagger.local\",\"password\":\"SwaggerDemo123!\"}"
```

**Відповідь:** `data.accessToken`, `data.refreshToken` (також можуть бути httpOnly cookies).

Використовуйте `accessToken` як `Authorization: Bearer ...` у всіх захищених запитах.

---

## 3. Register (новий користувач)

Email має бути **унікальним** (не з seed).

**Body:**

```json
{
  "email": "trial.user@example.com",
  "password": "TrialPass123!"
}
```

Пароль: мін. 8 символів, велика літера, цифра, спецсимвол.

```powershell
curl.exe -s -X POST "$BASE/api/v1/auth/register" `
  -H "Content-Type: application/json" `
  -H "x-csrf-token: $CSRF" `
  -b cookies.txt -c cookies.txt `
  -d "{\"email\":\"trial.user@example.com\",\"password\":\"TrialPass123!\"}"
```

**Очікується:** `201`.

---

## 4. Refresh

**Body (якщо API приймає refresh у body):**

```json
{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

Або лише cookie `refreshToken` — залежно від клієнта. Перевірте OpenAPI `/auth/refresh`.

---

## 5. Logout

```powershell
curl.exe -s -X POST "$BASE/api/v1/auth/logout" `
  -H "Authorization: Bearer $TOKEN" `
  -H "x-csrf-token: $CSRF" `
  -b cookies.txt
```

**Очікується:** `200`.

---

## Негативні приклади

| Запит                    | Очікування   |
| ------------------------ | ------------ |
| Login з невірним паролем | `401`        |
| POST без `x-csrf-token`  | `403` (CSRF) |

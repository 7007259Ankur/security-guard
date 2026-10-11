# Security Guard — Shared API Contract Specification

Version: 1.0.0
Base URL: `http://127.0.0.1:8000/api/v1`
Auth Mechanism: Bearer JWT (`Authorization: Bearer <access_token>`)

---

## 1. Authentication & User Management

### 1.1 Register
- **Endpoint**: `POST /auth/register`
- **Auth**: None
- **Request Body** (`application/json`):
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "full_name": "Alice Smith"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "full_name": "Alice Smith",
    "is_active": true,
    "created_at": "2026-10-11T10:00:00Z",
    "updated_at": "2026-10-11T10:00:00Z"
  }
  ```
- **Error Codes**: `400 Bad Request` (Email already registered, weak password), `422 Unprocessable Entity`

### 1.2 Login
- **Endpoint**: `POST /auth/login`
- **Auth**: None
- **Request Body** (`application/json`):
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "full_name": "Alice Smith"
    }
  }
  ```
- **Error Codes**: `401 Unauthorized` (Invalid credentials)

### 1.3 Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOi..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```

### 1.4 Current User
- **Endpoint**: `GET /auth/me`
- **Auth**: Bearer Token
- **Response** (`200 OK`):
  ```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "full_name": "Alice Smith",
    "is_active": true,
    "created_at": "2026-10-11T10:00:00Z",
    "updated_at": "2026-10-11T10:00:00Z"
  }
  ```

### 1.5 Logout
- **Endpoint**: `POST /auth/logout`
- **Auth**: Bearer Token
- **Request Body** (optional):
  ```json
  {
    "refresh_token": "eyJhbGciOi..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

---

## 2. Dashboard Stats & Activity

### 2.1 Dashboard Stats
- **Endpoint**: `GET /dashboard/stats`
- **Auth**: Bearer Token
- **Response** (`200 OK`):
  ```json
  {
    "vault_count": 14,
    "file_count": 28,
    "event_count": 5,
    "storage_used_bytes": 104857600,
    "security_score": 92,
    "recent_activities": [
      {
        "id": "e93c...",
        "action": "CREDENTIAL_CREATED",
        "description": "Added SBI Credentials to vault",
        "timestamp": "2026-10-11T10:30:00Z"
      }
    ]
  }
  ```

---

## 3. Credential Vault & Client-Side Zero-Knowledge Encryption

### Encryption Contract:
1. **Derivation**: Master password + salt using PBKDF2 (SHA-256, 100,000 iterations) or WebCrypto deriveKey -> 256-bit AES-GCM key.
2. **Encryption**: AES-256-GCM produces `ciphertext` (base64) and `iv` (base64, 12 bytes), with optional auth tag or combined payload.
3. **Payload Model**:
   - `encrypted_data`: Base64 string of the encrypted JSON `{ "password": "...", "notes": "...", "totp_secret": "..." }`.
   - `encryption_iv`: Base64 string of the initialization vector.
   - `key_derivation_salt`: Base64 salt used for key derivation (stored so client can reproduce master key per item or user).
4. **Metadata Exposed in List**:
   - The list view (`GET /credentials`) NEVER returns `encrypted_data`. It only returns `id`, `title`, `category`, `username`, `website_url`, `created_at`, `updated_at`.
   - The item detail (`GET /credentials/{id}`) returns `encrypted_data`, `encryption_iv`, `key_derivation_salt`. The client prompts for master password / vault unlock to decrypt locally in memory.

### 3.1 List Credentials
- **Endpoint**: `GET /credentials`
- **Auth**: Bearer Token
- **Query Params**: `category` (optional), `search` (optional), `skip` (default 0), `limit` (default 50)
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "4a123...",
      "title": "SBI Credentials",
      "category": "Banking",
      "username": "user_sbi",
      "website_url": "https://retail.onlinesbi.sbi",
      "created_at": "2026-10-11T09:00:00Z",
      "updated_at": "2026-10-11T09:00:00Z"
    }
  ]
  ```

### 3.2 Create Credential
- **Endpoint**: `POST /credentials`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "title": "SBI Credentials",
    "category": "Banking",
    "username": "user_sbi",
    "website_url": "https://retail.onlinesbi.sbi",
    "encrypted_data": "dGVzdC1jaXBoZXJ0ZXh0",
    "encryption_iv": "MTIzNDU2Nzg5MDEy",
    "key_derivation_salt": "c2FsdDEyMzQ1Njc4"
  }
  ```
- **Response** (`201 Created`): Returns full CredentialDetail object.

### 3.3 Get Credential by ID
- **Endpoint**: `GET /credentials/{id}`
- **Auth**: Bearer Token
- **Response** (`200 OK`):
  ```json
  {
    "id": "4a123...",
    "title": "SBI Credentials",
    "category": "Banking",
    "username": "user_sbi",
    "website_url": "https://retail.onlinesbi.sbi",
    "encrypted_data": "dGVzdC1jaXBoZXJ0ZXh0",
    "encryption_iv": "MTIzNDU2Nzg5MDEy",
    "key_derivation_salt": "c2FsdDEyMzQ1Njc4",
    "created_at": "2026-10-11T09:00:00Z",
    "updated_at": "2026-10-11T09:00:00Z"
  }
  ```

### 3.4 Update Credential
- **Endpoint**: `PUT /credentials/{id}`
- **Auth**: Bearer Token
- **Request Body**: Partial or full fields of `CredentialCreate`.
- **Response** (`200 OK`): CredentialDetail

### 3.5 Delete Credential
- **Endpoint**: `DELETE /credentials/{id}`
- **Auth**: Bearer Token
- **Response** (`204 No Content`)

---

## 4. File Manager

### 4.1 List Files
- **Endpoint**: `GET /files`
- **Auth**: Bearer Token
- **Query Params**: `skip` (default 0), `limit` (default 50), `search` (optional)
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "7b89...",
      "filename": "annual_security_report_2026.pdf",
      "file_size": 2458120,
      "content_type": "application/pdf",
      "created_at": "2026-10-10T14:20:00Z",
      "updated_at": "2026-10-10T14:20:00Z"
    }
  ]
  ```

### 4.2 Upload File
- **Endpoint**: `POST /files/upload`
- **Auth**: Bearer Token
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (Binary upload)
- **Response** (`201 Created`):
  ```json
  {
    "id": "7b89...",
    "filename": "annual_security_report_2026.pdf",
    "file_size": 2458120,
    "content_type": "application/pdf",
    "created_at": "2026-10-10T14:20:00Z",
    "updated_at": "2026-10-10T14:20:00Z"
  }
  ```

### 4.3 Download File
- **Endpoint**: `GET /files/{id}/download`
- **Auth**: Bearer Token
- **Response** (`200 OK`): File binary stream with `Content-Disposition: attachment; filename="..."`

### 4.4 Delete File
- **Endpoint**: `DELETE /files/{id}`
- **Auth**: Bearer Token
- **Response** (`204 No Content`)

---

## 5. Calendar Setter / Events

### 5.1 List Events
- **Endpoint**: `GET /calendar/events`
- **Auth**: Bearer Token
- **Query Params**: `start_date` (ISO date string, optional), `end_date` (ISO date string, optional)
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "8c34...",
      "title": "Quarterly Security Audit",
      "description": "Routine audit of vault keys and access permissions",
      "start_time": "2026-10-15T14:00:00Z",
      "end_time": "2026-10-15T16:00:00Z",
      "location": "Virtual Room A / Zoom",
      "event_type": "audit",
      "created_at": "2026-10-11T10:00:00Z",
      "updated_at": "2026-10-11T10:00:00Z"
    }
  ]
  ```

### 5.2 Create Event
- **Endpoint**: `POST /calendar/events`
- **Auth**: Bearer Token
- **Request Body**:
  ```json
  {
    "title": "Quarterly Security Audit",
    "description": "Routine audit of vault keys and access permissions",
    "start_time": "2026-10-15T14:00:00Z",
    "end_time": "2026-10-15T16:00:00Z",
    "location": "Virtual Room A / Zoom",
    "event_type": "audit"
  }
  ```
- **Response** (`201 Created`): CalendarEvent

### 5.3 Get Event by ID
- **Endpoint**: `GET /calendar/events/{id}`
- **Auth**: Bearer Token
- **Response** (`200 OK`): CalendarEvent

### 5.4 Update Event
- **Endpoint**: `PUT /calendar/events/{id}`
- **Auth**: Bearer Token
- **Request Body**: Partial or full fields of `CalendarEventCreate`
- **Response** (`200 OK`): CalendarEvent

### 5.5 Delete Event
- **Endpoint**: `DELETE /calendar/events/{id}`
- **Auth**: Bearer Token
- **Response** (`204 No Content`)

---

## 6. Audit Logs
- **Endpoint**: `GET /audit-logs`
- **Auth**: Bearer Token
- **Query Params**: `skip` (default 0), `limit` (default 50)
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "1d...",
      "action": "LOGIN_SUCCESS",
      "details": "User Alice Smith logged in successfully",
      "ip_address": "127.0.0.1",
      "created_at": "2026-10-11T10:15:00Z"
    }
  ]
  ```

---

## 7. Health Check
- **Endpoint**: `GET /health`
- **Auth**: None
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "database": "connected"
  }
  ```

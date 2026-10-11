# 🛡️ Security Guard — Enterprise Zero-Knowledge Security Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Security Guard** is an open-source, full-stack cybersecurity hub engineered with **zero-knowledge client-side encryption**, zero-trust credential vaulting, end-to-end audit logging, secure file management, and security schedule orchestration.

---

## 🌟 Unique Selling Proposition (USP)

### What Sets Security Guard Apart?

Most traditional security dashboards and credential managers store data that is either encrypted on the server side (where the server holds or can access the keys) or rely on third-party proprietary vaults. **Security Guard fundamentally eliminates server-side risk.**

1. **Zero-Knowledge Client-Side Cryptographic Vault (True Zero-Trust)**:
   - Plaintext credentials and secrets **never cross the network** and **never touch the server or database**.
   - Cryptographic keys are derived dynamically in the user's browser using **PBKDF2** (100,000 iterations, SHA-256) via the native **W3C Web Crypto API**.
   - Data encryption and decryption occur locally inside the browser using **AES-256-GCM** with isolated random 96-bit initialization vectors (`IV`) and per-record 128-bit cryptographic salts.
   - Even if the database, server, or transmission channel is compromised, an adversary only captures unreadable ciphertext without master keys.

2. **Unified Enterprise Security Operations in One Single Pane of Glass**:
   - Rather than juggling disjointed tools for password management, file storage, security auditing, and compliance calendar tracking, Security Guard brings them into a unified, responsive cockpit.

3. **Tamper-Evident Audit Trails & Real-Time Security Scoring**:
   - Every security-critical action (logins, failed attempts, vault record creations, updates, file transactions) produces structured audit logs storing client metadata, timestamps, and IP addresses.
   - Dynamic posture scoring evaluates credential health, event frequency, and storage risk in real time.

4. **Modern Hardened Engineering**:
   - Password hashing with **Argon2id** (memory-hard, resistant to GPU/ASIC brute forcing).
   - Short-lived JWT Bearer access tokens combined with secure refresh token rotation.
   - Built on cutting-edge stacks: **Next.js 16 (React 19)**, **FastAPI (Python 3.12)**, **SQLAlchemy 2.0**, and **PostgreSQL 16**.

---

## ⚖️ Why Security Guard is Better (Comparison Matrix)

| Feature / Capability | Traditional Security Portals | Cloud Password Managers | 🛡️ Security Guard |
| :--- | :--- | :--- | :--- |
| **Encryption Architecture** | Server-side encryption (Server holds master key) | Proprietary client-side encryption | **Transparent Open-Source Client-Side Web Crypto (AES-256-GCM)** |
| **Master Key Exposure** | Vulnerable to memory dumps / server leaks | Closed-source browser extensions | **Zero Exposure**: Master password never leaves browser memory |
| **Key Derivation** | SHA-256 or standard bcrypt | PBKDF2 / Argon2 | **PBKDF2 (100,000 iterations, SHA-256) + Argon2id User Hashing** |
| **Secret List Leakage** | Full secrets loaded into API responses | Paywalled team tiers | **Strict Metadata Segregation**: List endpoint never transmits ciphertext |
| **Integrated Services** | Passwords only or logs only | Passwords only | **Integrated Vault + File Manager + Security Calendar + Audit Trail** |
| **Self-Hostable & Privacy** | Heavy enterprise licensing | Cloud lock-in / subscription fees | **100% Free & Open-Source, Docker-ready, Local First** |
| **Compliance Auditing** | External SIEM required | Limited logging | **Built-in immutable Audit Logs for all user & system events** |

---

## 🏛️ System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Browser ["Client Browser (Next.js 16 / React 19 / Web Crypto)"]
        UI["Modern Glassmorphic UI\n(Tailwind CSS v4 + Lucide)"]
        CryptoEngine["Web Crypto API Engine\n(PBKDF2 100k + AES-256-GCM)"]
        MasterPass[/"User Master Password\n(In-Memory Only)"/]
        
        UI -->|Master Password + Raw Secret| CryptoEngine
        MasterPass -.-> CryptoEngine
        CryptoEngine -->|Generates IV + Salt + Ciphertext| UI
    end

    subgraph Gateway ["API Transport Layer"]
        JWTAuth["JWT Bearer Authentication\n(HS256 Access + Refresh)"]
        CORS["CORS Middleware\n(Origins Whitelist)"]
    end

    subgraph Backend ["FastAPI Application (Python 3.12)"]
        Router["FastAPI Router (/api/v1)"]
        AuthRoute["/auth (Argon2id Hashing)"]
        VaultRoute["/credentials (Ciphertext Only)"]
        FilesRoute["/files (Secure Multipart Upload)"]
        CalendarRoute["/calendar (Audit & Schedule)"]
        AuditRoute["/audit-logs (Activity Logging)"]
        DashboardRoute["/dashboard/stats (Posture Metrics)"]

        Router --> AuthRoute
        Router --> VaultRoute
        Router --> FilesRoute
        Router --> CalendarRoute
        Router --> AuditRoute
        Router --> DashboardRoute
    end

    subgraph Storage ["Persistent Storage Layer"]
        Postgres[("PostgreSQL 16\n(Port 5435)")]
        FileStorage[("Local / Mounted Volume\n(Uploads Directory)")]
    end

    UI -->|HTTPS / REST API Requests| CORS
    CORS --> JWTAuth
    JWTAuth --> Router

    AuthRoute -->|Users & Sessions| Postgres
    VaultRoute -->|Stores Ciphertext, IV, Salt| Postgres
    CalendarRoute -->|Event Entries| Postgres
    AuditRoute -->|Immutable Logs| Postgres
    DashboardRoute -->|Aggregated Metrics| Postgres
    FilesRoute -->|File Metadata| Postgres
    FilesRoute -->|Stream Content| FileStorage
```

---

## 🔄 Cryptographic Vault Connection & Lifecycle

The zero-knowledge credential flow guarantees that the backend database only acts as a dumb persistence store for opaque cryptographic blobs.

```mermaid
sequenceDiagram
    autonumber
    actor User as Security Officer / User
    participant Client as Next.js Web Client (Web Crypto API)
    participant API as FastAPI Backend (/api/v1)
    participant DB as PostgreSQL 16 Database

    Note over User,Client: 1. Vault Item Creation (Encryption)
    User->>Client: Input: Title, Username, Secret Password, Master Password
    Client->>Client: Generate random 16-byte Salt & 12-byte IV
    Client->>Client: PBKDF2(Master Password, Salt, 100,000 iter) -> AES-256 Key
    Client->>Client: AES-256-GCM Encrypt(Secret JSON, Key, IV) -> Ciphertext
    Client->>API: POST /api/v1/credentials { title, username, encrypted_data, encryption_iv, key_derivation_salt }
    API->>DB: INSERT into credentials table (Zero knowledge of secret)
    API-->>Client: 201 Created (Credential metadata)

    Note over User,Client: 2. Vault Item Retrieval (Decryption)
    User->>Client: Request credential detail
    Client->>API: GET /api/v1/credentials/{id}
    API->>DB: SELECT * FROM credentials WHERE id = :id
    DB-->>API: Return record (ciphertext, iv, salt)
    API-->>Client: 200 OK (Ciphertext payload)
    User->>Client: Provide Master Password
    Client->>Client: PBKDF2(Master Password, Salt) -> Recreate AES-256 Key
    Client->>Client: AES-256-GCM Decrypt(Ciphertext, Key, IV) -> Plaintext Secret
    Client-->>User: Display secret in browser view (never logged or sent to server)
```

---

## 📊 Core Data Models & Relationships

| Entity | Primary Key | Key Attributes | Connected Relationships |
| :--- | :--- | :--- | :--- |
| **`User`** | `UUID` (`id`) | `email`, `hashed_password` (Argon2id), `full_name`, `is_active` | 1-to-N with `Credential`, `FileItem`, `CalendarEvent`, `AuditLog` |
| **`Credential`** | `UUID` (`id`) | `title`, `category`, `username`, `website_url`, `encrypted_data`, `encryption_iv`, `key_derivation_salt` | Belong to `User` (`user_id`). Client-side zero-knowledge encrypted. |
| **`FileItem`** | `UUID` (`id`) | `filename`, `file_size`, `content_type`, `stored_path` | Belong to `User` (`user_id`). Mapped to disk volume storage. |
| **`CalendarEvent`** | `UUID` (`id`) | `title`, `description`, `start_time`, `end_time`, `location`, `event_type` | Belong to `User` (`user_id`). Schedules audits, rotations, reviews. |
| **`AuditLog`** | `UUID` (`id`) | `action`, `details`, `ip_address`, `created_at` | Tracks actions (`LOGIN_SUCCESS`, `CREDENTIAL_CREATED`, etc.). |

---

## 🗂️ Project File Structure

```text
security-guard/
├── .env                          # Root Docker environment variables (PostgreSQL password)
├── .gitignore                    # Root Git ignore rules
├── docker-compose.yml            # Multi-container orchestration (PostgreSQL 16 Alpine on 5435)
├── README.md                     # Comprehensive platform documentation & guide
│
├── backend/                      # FastAPI Python Application
│   ├── .env                      # Backend runtime configuration (JWT secrets, DB URLs)
│   ├── alembic.ini               # Alembic database migration configuration
│   ├── requirements.txt          # Python runtime dependencies
│   ├── README.md                 # Backend-specific architecture & developer guide
│   ├── alembic/                  # Database migration scripts
│   │   ├── env.py                # Alembic environment runner
│   │   ├── script.py.mako        # Migration template
│   │   └── versions/             # Auto-generated and curated migration revisions
│   ├── app/                      # Application source code
│   │   ├── main.py               # FastAPI entrypoint, lifespan events, CORS, router mounting
│   │   ├── core/                 # Core security and application configurations
│   │   │   ├── config.py         # Pydantic Settings management
│   │   │   └── security.py       # Argon2id password hashing & JWT token issuance
│   │   ├── db/                   # Database engine & session providers
│   │   │   ├── base.py           # Base declarative class with model registry
│   │   │   └── session.py        # SQLAlchemy engine and sessionmaker
│   │   ├── models/               # SQLAlchemy 2.0 ORM data models
│   │   │   ├── user.py           # User entity
│   │   │   ├── credential.py     # Zero-knowledge encrypted vault entity
│   │   │   ├── file_item.py      # Managed file repository entity
│   │   │   ├── calendar_event.py # Security scheduler & event entity
│   │   │   └── audit_log.py      # Tamper-evident activity log entity
│   │   ├── schemas/              # Pydantic v2 validation models & serialization
│   │   │   ├── user.py           # User registration, login, profile schemas
│   │   │   ├── credential.py     # Credential summary & full encrypted payloads
│   │   │   ├── file_item.py      # File metadata schemas
│   │   │   ├── calendar_event.py # Calendar event creation and filters
│   │   │   ├── dashboard.py      # Aggregated metric and security score schemas
│   │   │   └── audit_log.py      # Audit log schemas
│   │   └── api/                  # API routers and dependency injection
│   │       ├── deps.py           # Current user extraction & DB session dependencies
│   │       └── routes/           # REST endpoints
│   │           ├── auth.py       # Register, login, refresh, profile, logout
│   │           ├── credentials.py# Vault list, creation, decryption retrieval, updates
│   │           ├── files.py      # Multipart upload, streamed download, deletion
│   │           ├── calendar.py   # Event management and scheduling
│   │           ├── audit_logs.py # Audit history filtering
│   │           ├── dashboard.py  # Health score and statistics endpoint
│   │           └── health.py     # Service & database health verification
│   ├── tests/                    # Automated Pytest suite
│   │   ├── conftest.py           # Pytest test client fixtures & database setups
│   │   └── test_api.py           # Comprehensive integration and unit tests
│   └── uploads/                  # Safe local file repository storage directory
│
├── frontend/                     # Next.js 16 Web Dashboard
│   ├── package.json              # Node dependencies (React 19, Lucide, Tailwind v4, Zod)
│   ├── tsconfig.json             # TypeScript compiler options
│   ├── next.config.ts            # Next.js framework configuration
│   ├── public/                   # Static assets & SVG icons
│   └── src/
│       ├── components/           # Reusable UI widgets
│       │   ├── Header.tsx        # Top navigation with user identity & logout
│       │   └── Sidebar.tsx       # Navigation drawer with quick stats & links
│       ├── lib/                  # Frontend utilities & cryptography
│       │   ├── api.ts            # Axios / Fetch HTTP client with Bearer auth handling
│       │   ├── crypto.ts         # Web Crypto API: PBKDF2 + AES-256-GCM Encrypt/Decrypt
│       │   └── types.ts          # TypeScript interfaces and contracts
│       └── app/                  # Next.js App Router
│           ├── layout.tsx        # Root HTML layout with font imports and metadata
│           ├── globals.css       # Tailwind CSS v4 design tokens and utilities
│           ├── page.tsx          # Landing view / conditional route redirection
│           ├── login/            # User authentication view
│           ├── register/         # User onboarding view
│           ├── data_security_dashboard/ # Central dashboard, vault cards & stats
│           ├── file_manager/     # Encrypted file upload, download & preview
│           └── calendar_setter/  # Security audit scheduling & key rotation reminders
│
└── contracts/                    # Specifications and API contracts
    └── openapi-notes.md          # OpenAPI 3.0 specification reference and schemas
```

---

## 🚀 Local Startup Guide (Step-by-Step)

Follow these clear instructions to run the entire stack locally on Windows, macOS, or Linux.

### 📋 Prerequisites

Ensure you have the following installed on your workstation:
- **Docker & Docker Desktop** (for PostgreSQL 16)
- **Python 3.12+**
- **Node.js 20+** and **npm** / **pnpm**
- **Git**

---

### Step 1: Clone the Repository & Configure Environment

Clone the repository and inspect the root environment file:

```bash
git clone https://github.com/your-username/security-guard.git
cd security-guard
```

Ensure `.env` exists in the root directory:
```env
POSTGRES_PASSWORD=YourStrongLocalPassword123!
```

---

### Step 2: Launch the PostgreSQL Database via Docker

Start the isolated PostgreSQL 16 container running on host port `5435`:

```bash
docker compose up -d
```

Verify that the container is healthy:
```bash
docker compose ps
```
*(You should see `security-guard-postgres` running on `0.0.0.0:5435->5432/tcp` with status `healthy`)*.

---

### Step 3: Setup & Launch the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure `backend/.env`:
   ```env
   PROJECT_NAME="Security Guard API"
   API_V1_STR="/api/v1"
   SECRET_KEY="security_guard_super_secret_jwt_key_for_testing_and_production_security"
   ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=7
   DATABASE_URL="postgresql+psycopg2://security_user:YourStrongLocalPassword123!@127.0.0.1:5435/security_guard"
   BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
   UPLOAD_DIR="./uploads"
   ```

5. Apply database migrations with Alembic:
   ```bash
   alembic upgrade head
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

7. Verify backend services:
   - **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
   - **Interactive API Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 4: Setup & Launch the Frontend (Next.js 16)

1. Open a second terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
   ```

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

### Step 5: Execute Automated Verification Tests

To verify backend data integrity, encryption endpoints, and auth mechanics, run the automated test suite:

```bash
cd backend
pytest tests/ -v
```

---

## 📡 Core API Endpoints Reference

| Service | Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Health check & DB connectivity | No |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user with Argon2id | No |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate & issue JWT tokens | No |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Rotate access token via refresh token | No |
| **Auth** | `GET` | `/api/v1/auth/me` | Fetch active user profile | Bearer JWT |
| **Dashboard** | `GET` | `/api/v1/dashboard/stats` | Aggregate stats, security score & events | Bearer JWT |
| **Vault** | `GET` | `/api/v1/credentials` | List vault items (metadata only, no secrets) | Bearer JWT |
| **Vault** | `POST` | `/api/v1/credentials` | Store client-encrypted credential payload | Bearer JWT |
| **Vault** | `GET` | `/api/v1/credentials/{id}` | Retrieve ciphertext, IV & salt for local decrypt | Bearer JWT |
| **Vault** | `DELETE`| `/api/v1/credentials/{id}` | Securely purge credential record | Bearer JWT |
| **Files** | `POST` | `/api/v1/files/upload` | Multipart secure file upload | Bearer JWT |
| **Files** | `GET` | `/api/v1/files` | List uploaded files & sizes | Bearer JWT |
| **Files** | `GET` | `/api/v1/files/{id}/download`| Stream file download securely | Bearer JWT |
| **Calendar**| `GET` | `/api/v1/calendar/events` | List security events and scheduled audits | Bearer JWT |
| **Calendar**| `POST` | `/api/v1/calendar/events` | Schedule audit, key rotation, or checkup | Bearer JWT |
| **Audit** | `GET` | `/api/v1/audit-logs` | Filter tamper-evident audit history | Bearer JWT |

---

## 🛡️ Security Best Practices & Deployment Notes

- **Production Secret Keys**: In production, replace `SECRET_KEY` in `backend/.env` with an unpredictable 64+ character random string generated via `openssl rand -hex 32`.
- **Master Password Policy**: The user's master password is used for local PBKDF2 derivation. If a user loses their master password, encrypted vault items **cannot be recovered** by system administrators (by design).
- **HTTPS Enforcement**: Always deploy frontend and backend behind TLS/HTTPS in staging and production to prevent MITM attacks and protect Web Crypto operations.
- **Database Hardening**: Ensure host port `5435` is restricted or bound only to internal Docker networks in production environments.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to fork, contribute, and deploy!

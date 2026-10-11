# Security Guard — FastAPI Backend

Robust, asynchronous and synchronous FastAPI backend with SQLAlchemy 2, Alembic migrations, PostgreSQL 16, Argon2id password hashing, and client-side zero-knowledge encrypted credential vault.

## Architecture

- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL 16 on port 5435
- **ORM**: SQLAlchemy 2.0 (Declarative Mapping)
- **Migrations**: Alembic
- **Password Hashing**: Argon2id via `argon2-cffi` and `passlib`
- **Authentication**: JWT Bearer tokens (access + refresh tokens)
- **Zero-Knowledge Vault**: Stores client-encrypted ciphertext, IV, and key derivation salt. Metadata list endpoint never transmits secrets.

## Prerequisites

- Python 3.12+
- Docker running `security-guard-postgres` container on port `5435`

## Setup & Running

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   The `.env` file contains:
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

3. **Database Migrations**:
   Run Alembic migrations to create/upgrade tables in PostgreSQL:
   ```bash
   alembic upgrade head
   ```

4. **Start Development Server**:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. **API Documentation**:
   - Interactive Swagger UI: `http://127.0.0.1:8000/docs`
   - ReDoc: `http://127.0.0.1:8000/redoc`
   - OpenAPI Schema: `http://127.0.0.1:8000/api/v1/openapi.json`
   - Health Check: `http://127.0.0.1:8000/health`

## Running Automated Tests

Run the full pytest suite:
```bash
pytest tests/ -v
```

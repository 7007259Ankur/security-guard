# Security Guard — Next.js Frontend

Production-ready Next.js 14+ (App Router) cyber-security dashboard with Tailwind CSS, Lucide icons, and zero-knowledge client-side encryption.

## Architecture & Features

- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS (sleek dark security theme)
- **Zero-Knowledge Encryption**: Web Crypto API (`window.crypto.subtle`)
  - Key derivation: PBKDF2 with SHA-256 (100,000 iterations) from master password + salt
  - Encryption / Decryption: AES-256-GCM
  - Plaintext secrets and master passwords are never persisted to storage or sent in plain text.
- **Form Management**: React Hook Form + Zod
- **Pages**:
  - `/login`: Form validation, error alerts, redirect.
  - `/register`: Full name, email, password registration with auto-login.
  - `/data_security_dashboard`: Security score metric, vault status, zero-knowledge credential vault CRUD with in-memory decryption modal & clipboard copy, real-time audit logs.
  - `/file_manager`: Encrypted file storage manager with upload progress, size display, direct download stream, and delete confirmation.
  - `/calendar_setter`: Timezone-aware security audit and event operations calendar with event creator and categorization.

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Configured in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
   ```

3. **Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

4. **Production Build**:
   ```bash
   npm run build
   ```

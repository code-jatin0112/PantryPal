# PantryPal — Production Deployment Architecture & Operating Guide

**Document Version**: 1.0.0  
**Target Milestone**: Phase 7 Production Launch Readiness  
**Deployment Stack**: Frontend (Vercel) + Backend (Railway / Node.js 22 Alpine Docker) + PostgreSQL (Prisma ORM) + MongoDB (Mongoose NoSQL) + Google Gemini AI  

---

## 1. System Architecture Overview

PantryPal follows a decoupled cloud architecture designed for high availability, strong security boundaries, and zero data leakage:

```
┌─────────────────────────────────┐
│        Client Web Browser       │
└───────────────┬─────────────────┘
                │ HTTPS (TLS 1.3)
                ▼
┌────────────────────────────────────────────────────────┐
│  Frontend: Vercel Edge Network                         │
│  - Static SPA Assets (Vite + React 19)                 │
│  - SPA Fallback Rewrites (`frontend/vercel.json`)      │
│  - Dynamic API Base Configuration (`VITE_API_URL`)     │
└───────────────────────┬────────────────────────────────┘
                        │ HTTPS REST API (`/api/v1/*`)
                        ▼
┌────────────────────────────────────────────────────────┐
│  Backend: Railway Platform                             │
│  - Runtime: Node.js 22 (Alpine Linux Container)         │
│  - Container Builder: Verified Dockerfile              │
│  - Security: Helmet (HSTS, CSP), Strict CORS Whitelist  │
│  - Rate Limiting: Global, Auth, and Unified AI Limiters │
│  - Health Probes: Liveness (`/health`) & Readiness     │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Prisma 7 │ PostgreSQL             │ Mongoose 9 (TLS)
                ▼                        ▼
┌────────────────────────┐      ┌────────────────────────┐
│ Relational Database    │      │ NoSQL Database         │
│ (PostgreSQL 15+)       │      │ (MongoDB Atlas 6+)     │
│ - Relational Entities  │      │ - AI Interactions Log  │
│ - Cascading Deletions  │      │ - Unstructured Recipes │
│ - Advisory Xact Locks  │      │ - Deletion Obligations │
│ - Deletion Obligations │      │ - Recovery Markers     │
└────────────────────────┘      └────────────────────────┘
```

---

## 2. Backend Deployment on Railway

### 2.1 Build Strategy Selection
Railway deployment is standardized on **`Dockerfile`** builder to eliminate build non-determinism:
- Base image: `node:22-alpine`
- System library: `openssl` (required for Prisma native query engine binaries)
- Dependency installation: `npm ci --omit=dev` (strict lockfile reproducibility)
- Build-time code generation: `npx prisma generate` (bakes typed Prisma client directly into the image)
- Build exclusions: Managed via `backend/.dockerignore` to prevent uploading tests, local `.env` files, and `node_modules`.

### 2.2 Step-by-Step Railway Configuration
1. **Create New Project**: In the Railway dashboard, select **New Project** → **Deploy from GitHub repo**.
2. **Select Repository**: Choose `code-jatin0112/PantryPal`.
3. **Configure Service Settings**:
   - **Root Directory**: Set to `/backend`.
   - **Builder**: Railway automatically detects `backend/railway.json` and uses `DOCKERFILE`.
   - **Start Command**: `npm start` (which executes `prisma generate && tsx src/server.js`).
   - **Healthcheck Path**: `/api/v1/health` (lightweight liveness probe).
   - **Healthcheck Timeout**: `30` seconds.
   - **Restart Policy**: `ON_FAILURE` (max 3 retries).
4. **Environment Variables**: Add all mandatory backend variables detailed in [docs/production-env-checklist.md](production-env-checklist.md).
5. **Reverse Proxy Trust**: Ensure `TRUST_PROXY=true` is set. Railway routes ingress through an edge proxy; trusting proxy hops ensures Express inspects `X-Forwarded-For` for accurate client rate limiting.

---

## 3. Frontend Deployment on Vercel

### 3.1 Step-by-Step Vercel Configuration
1. **Import Project**: In the Vercel dashboard, click **Add New...** → **Project** and select `code-jatin0112/PantryPal`.
2. **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
3. **Routing Configuration**:
   - `frontend/vercel.json` contains:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - This ensures client-side React Router handles deep linking without 404 errors.
4. **Environment Variables**:
   - Set `VITE_API_URL` to the public Railway backend URL (e.g. `https://pantrypal-backend.up.railway.app/api/v1`).
   - `frontend/src/constants/api.js` automatically normalizes trailing slashes and ensures the `/api/v1` base path is preserved.

---

## 4. Database Release & Migration Strategy

### 4.1 Production Migration Decoupling
In Phase 7, **automatic schema migrations were explicitly decoupled from `npm start`**.
- **Rationale**: If `prisma migrate deploy` runs during server boot, every autoscaling replica, canary pod, or crash-restarting instance will attempt concurrent schema alterations, risking advisory lock contention and migration lock deadlocks.
- **Dedicated Script**: `npm run db:migrate:deploy` in `backend/package.json`.

### 4.2 Safe Production Migration Workflow
When deploying a release that contains new Prisma migrations:
1. **Freeze Traffic / Announce Window**: Optional for backward-compatible migrations, mandatory for breaking schema changes.
2. **Execute Full Database Snapshot Backup**:
   ```bash
   pg_dump -h <HOST> -U <USER> -d pantrypal -Fc -f backup_pre_release_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Run Migrations via Railway One-Off Command**:
   ```bash
   railway run --service backend npm run db:migrate:deploy
   ```
4. **Verify Applied Migrations**:
   ```bash
   railway run --service backend npm run db:migrate:status
   ```
5. **Deploy Updated Application Image**: Railway rolls out the new container version once migrations are verified.

### 4.3 Database Backup & Restore Plan
- **PostgreSQL**:
  - Automated continuous WAL archiving and daily snapshots via Railway Managed PostgreSQL or AWS RDS.
  - Manual backup command: `pg_dump -Fc -Z 9 ...`
  - Restore command: `pg_restore --clean --if-exists -d pantrypal ...`
- **MongoDB Atlas**:
  - Automated continuous Cloud Backups with Point-in-Time Restore (PITR) enabled.
  - Manual snapshot export via Atlas UI or `mongodump --archive=backup.gz --gzip`.

---

## 5. Security & Rate Limiting Architecture

### 5.1 In-Memory Rate Limiting & Deployment Constraints
The application utilizes `express-rate-limit` with three dedicated tiers:
1. **Global API Limiter**: 500 requests per 15-minute window per IP.
2. **Dedicated Authentication Limiter**: 10 attempts per 15-minute window per IP (protecting `/api/v1/auth/login` and `/api/v1/auth/register`).
3. **Unified AI Limiter**: 20 requests per 15-minute window per authenticated user ID (`user:${userId}`), shared across recipe generation, kitchen chat, and recommendations.

> [!IMPORTANT]
> **Deployment Constraint for Initial Launch**: Rate limiter state is stored in Node.js process memory.
> - **Initial Launch Target**: Deploy as a **single container instance (`numReplicas = 1`)** on Railway.
> - **Multi-Instance Constraint**: If horizontal auto-scaling or multi-replica deployments are required in future phases, an external Redis-backed key-value store (`rate-limit-redis`) must be provisioned so rate counters are synchronized across instances.

### 5.2 Secret Management & Entropy Rules
- **JWT Secret**: In production (`NODE_ENV=production`), `backend/src/utils/token.js` verifies that `JWT_SECRET` is at least 32 characters long and does not contain example placeholders. Tokens cannot be issued if this check fails.
- **Credential Sanitization**: `sanitizeDatabaseUrl` redacts raw database credentials from all error handlers, connection strings, and deletion reconciliation logs.

---

## 6. Health & Readiness Verification

Railway monitors container health using two distinct endpoints:

| Endpoint | Type | Purpose | Behavior |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/health` | Liveness | Checks process responsiveness | Always returns HTTP 200 `{ status: "healthy" }`. Used by Railway orchestrator to detect process hangs. |
| `GET /api/v1/health/readiness` | Readiness | Verifies database dependencies | Queries PostgreSQL (`SELECT 1`) and pings MongoDB (`db.command({ ping: 1 })`) with a strict 3000ms bounded timeout. Returns HTTP 200 if both connected; returns HTTP 503 if either datastore is disconnected. Never leaks credentials. |

---

## 7. AI Service Provider (Google Gemini)

- **SDK**: `@google/genai` (v2.16.0+)
- **Model**: `gemini-2.5-flash`
- **Timeout**: 30 seconds (`LLM_TIMEOUT=30000`)
- **Quota Handling**: Upstream HTTP 429 quota errors from Google Gemini are mapped to HTTP 429 `AI_QUOTA_EXCEEDED` with retry guidance, preventing unhandled 500 internal errors.

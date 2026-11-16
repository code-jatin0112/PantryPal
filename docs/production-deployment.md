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
   - **Config File Path**: Set explicitly to `/backend/railway.json` (under **Service Settings** → **General** → **Config File Path**). Do not rely on automatic discovery in monorepo structures.
   - **Dockerfile Path**: Resolved via `backend/railway.json` as `Dockerfile` (or set explicitly to `/backend/Dockerfile`).
   - **Start Command**: Managed by `CMD ["npm", "start"]` (executing `tsx src/server.js` with pre-generated artifacts).
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
3. **Execute Migrations via Verified Network Path**:
   > [!IMPORTANT]
   > Railway PostgreSQL is isolated inside the Railway private virtual network by default (`*.railway.internal`). Note that `railway run` executes commands on the **operator's local workstation** (pulling down environment variables) — it does **NOT** execute inside Railway's private network. Because `*.railway.internal` hostnames cannot resolve on local machines, running `railway run ...` locally against private hostnames will fail.
   > 
   > Choose one of the following verified execution methods:

   - **Option A (Recommended — Automated Private-Network Pre-Deploy Migration)**:
     Configure Railway's built-in **Pre-Deploy Command** in `backend/railway.json`:
     ```json
     {
       "deploy": {
         "startCommand": "npm start",
         "preDeployCommand": "npm run db:migrate:deploy"
       }
     }
     ```
     **Execution Lifecycle & Order**:
     1. **Build**: Railway builds the production container using `backend/Dockerfile`.
     2. **Pre-Deploy Migration**: Before any new containers are started or traffic shifted, Railway spins up an ephemeral container inside Railway's private network using the newly built image and executes `npm run db:migrate:deploy`. This container has native access to `DATABASE_URL` resolving to `postgres.railway.internal`.
     3. **Deploy (Traffic Cutover)**: Only when the pre-deploy command succeeds (exit code `0`) does Railway proceed to start the new backend service container (`npm start`) and route traffic.
     4. **Failure Guard**: If `db:migrate:deploy` fails or exits non-zero, Railway **aborts the deployment immediately**. The existing running application container remains untouched and continues serving traffic without downtime or broken schema.
     5. **Verification**: Inspect the deployment logs in the Railway Dashboard under the **Deployments** tab to review the pre-deploy migration step logs.

   - **Option B (Alternative — Authorized External Connection with Mandatory TLS)**:
     If manual out-of-band schema inspection (`db:migrate:status`) or emergency migration resolution is required from an operator workstation, prefer private-network execution whenever possible rather than unnecessarily exposing PostgreSQL to the public internet. If external access is necessary:
     1. In the Railway Dashboard → PostgreSQL Service → **Settings** → **Networking** → Click **Enable Public Networking**.
     2. Railway assigns a public TCP proxy domain and port, and generates the `DATABASE_PUBLIC_URL` variable on the PostgreSQL service. Note that this variable is stored in Railway and is **not automatically set in your local shell**.
     3. Copy `DATABASE_PUBLIC_URL` from the Railway Dashboard (or retrieve it via `railway variables --service PostgreSQL`) and export it in your operator terminal:
        ```bash
        export DATABASE_PUBLIC_URL="postgresql://postgres:<PASSWORD>@<PROXY_HOST>:<PORT>/railway"
        ```
     4. **TLS & Query Parameter Handling**: Enforce TLS (`sslmode=require`) and handle URL parameters safely to avoid malformed query strings if `DATABASE_PUBLIC_URL` already includes parameters:
        ```bash
        # Safely append sslmode=require handling existing query params
        if [[ "$DATABASE_PUBLIC_URL" == *"?"* ]]; then
          MIGRATE_URL="${DATABASE_PUBLIC_URL}&sslmode=require"
        else
          MIGRATE_URL="${DATABASE_PUBLIC_URL}?sslmode=require"
        fi

        # Check migration status before deploying:
        DATABASE_URL="$MIGRATE_URL" npm run db:migrate:status

        # If applying manually:
        DATABASE_URL="$MIGRATE_URL" npm run db:migrate:deploy
        ```
     5. **Disable Public Networking**: Immediately toggle off Public Networking on the PostgreSQL service in the Railway Dashboard once the maintenance task is complete to maintain zero-trust isolation.
4. **Deploy Updated Application Image**: Railway rolls out the new container version once migrations succeed.

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

# PantryPal — Production Rollback Runbook & Incident Recovery

**Target Environment**: Production (Railway + Vercel + PostgreSQL + MongoDB)  
**Classification**: Emergency Operating Procedure  
**Document Owner**: Operations & Engineering Lead  

---

## 1. Rollback Criteria & Decision Matrix

Trigger an immediate release rollback if any of the following conditions occur within 60 minutes post-launch:

| Metric / Symptom | Severity | Threshold | Action |
| :--- | :--- | :--- | :--- |
| **Readiness Probe Failure** | P0 (Critical) | `/api/v1/health/readiness` returns 503 for > 60s | Rollback backend deployment |
| **HTTP 5xx Error Spike** | P0 (Critical) | > 2% of total incoming requests return 500/502/504 | Rollback backend deployment |
| **Authentication Outage** | P0 (Critical) | User login/registration fail with unhandled errors | Rollback backend deployment |
| **Failed Database Migration** | P0 (Critical) | `prisma migrate deploy` marks migration as failed in `_prisma_migrations` | Halt rollout, restore pre-migration database snapshot |
| **Frontend White Screen / Boot Crash** | P1 (High) | Uncaught JavaScript runtime errors prevent SPA load | Rollback Vercel deployment |
| **AI Quota / Timeout Failure** | P1 (High) | All AI calls time out (> 30s) or return persistent 503 | Check Google Cloud Gemini quota / revert backend |

---

## 2. Fast Rollback Procedures

### 2.1 Frontend Rollback (Vercel)
Vercel keeps immutable preview and production deployments:
1. Open the **Vercel Dashboard** → Select `PantryPal` frontend project.
2. Navigate to the **Deployments** tab.
3. Locate the previous stable deployment (the commit prior to the failed release).
4. Click the three dots (`...`) on the right side of the deployment row → Click **Instant Rollback** (or **Assign Domain** to the prior deployment).
5. Verification: Confirm the production URL immediately serves the previous build:
   ```bash
   curl -I https://<FRONTEND_HOST>
   ```

### 2.2 Backend Rollback (Railway)
Railway maintains versioned Docker container images for each commit:
1. Open the **Railway Dashboard** → Select the `PantryPal` backend service.
2. Navigate to the **Deployments** tab.
3. Locate the previous successful deployment.
4. Click **Redeploy** on the prior deployment.
5. Railway initiates zero-downtime container transition, starting the previous image and waiting for `/api/v1/health` liveness probe before routing ingress traffic.
6. Verification:
   ```bash
   curl -i https://<BACKEND_HOST>/api/v1/health/readiness
   ```

---

## 3. Database Rollback Procedures

### 3.1 Understanding Prisma Migration Forward-Only Constraints
Prisma does not support automatic down migrations (`migrate down`). Schema changes are strictly forward-applied. If a newly deployed migration has damaged data or altered column types incompatibly:

#### Scenario A: The Migration Was Backward-Compatible
If the migration added nullable columns, new tables, or new indexes:
- Keep the database schema intact.
- Simply roll back the application container code (Section 2.2). The older backend code will ignore the extra columns/tables.

#### Scenario B: The Migration Failed Mid-Execution
If a migration fails due to lock timeout or syntax violation, Prisma locks the migration status in `_prisma_migrations`:
1. **Enable Accessible Connection**:
   Temporarily enable **Public Networking** on the PostgreSQL service in the Railway Dashboard, copy `DATABASE_PUBLIC_URL`, and export it in your terminal (see [Production Deployment Guide](./production-deployment.md#42-safe-production-migration-workflow)):
   ```bash
   export DATABASE_PUBLIC_URL="<value copied from Railway Dashboard>"

   # Safely append sslmode=require handling existing query params
   if [[ "$DATABASE_PUBLIC_URL" == *"?"* ]]; then
     MIGRATE_URL="${DATABASE_PUBLIC_URL}&sslmode=require"
   else
     MIGRATE_URL="${DATABASE_PUBLIC_URL}?sslmode=require"
   fi
   ```
2. **Check Migration State**:
   ```bash
   cd backend
   DATABASE_URL="$MIGRATE_URL" npx prisma migrate status
   ```
3. **Mark Failed Migration as Rolled Back**:
   Once manually reverted in the database schema:
   ```bash
   DATABASE_URL="$MIGRATE_URL" npx prisma migrate resolve --rolled-back "<MIGRATION_NAME>"
   ```
4. **Disable Public Networking**: Immediately turn off Public Networking on the PostgreSQL service in Railway once resolved.

#### Scenario C: Breaking Schema Change Requiring Full Database Restore
If data was corrupted or incompatible column drops were committed:
1. **Stop Backend Service & Inhibit All Database Writes (MANDATORY)**:
   > [!CAUTION]
   > A frontend Vercel maintenance page alone is **insufficient** because direct API clients, background workers, and mobile/cached sessions bypass the frontend and continue issuing writes while `pg_restore` drops and recreates schema objects.

   - **Immediately scale backend service replicas to 0** in the Railway Dashboard (or stop the service container).
   - Terminate active client connections to PostgreSQL.
   - Confirm active database connections are terminated and zero writes are in flight.
   - Optionally display a maintenance notice on the Vercel frontend for user communication.
2. **Restore PostgreSQL from Pre-Migration Backup Snapshot**:
   Enable Public Networking on PostgreSQL to allow the external restore connection.
   > [!NOTE]
   > Note that `--clean` drops objects present in the backup archive, but will not drop newly created tables added after the backup. If new tables or foreign key dependencies were introduced, drop/recreate the public schema or ensure a clean destination before restoring.
   ```bash
   # Restore snapshot with strict TLS certificate verification and fail-fast error handling:
   PGSSLMODE=verify-full pg_restore --exit-on-error --clean --if-exists -h <PROXY_HOST> -p <PORT> -U postgres -d railway backup_pre_release_<TIMESTAMP>.dump
   ```
   Ensure `pg_restore` exits with status `0` before proceeding.
3. **Verify Schema Integrity & Migrations Against Prior Stable Release**:
   > [!IMPORTANT]
   > Ensure Public Networking is enabled on the PostgreSQL service in the Railway Dashboard and `DATABASE_PUBLIC_URL` is exported in the local shell (refer to [Production Deployment Guide](./production-deployment.md#42-safe-production-migration-workflow) for setup details).
   > 
   > **Checkout Prior Stable Release**: Ensure your local working directory is checked out to the prior stable release tag or commit before running `prisma migrate status`. If checked against the failed release's checkout, the newly added migration will falsely appear as pending against the restored database.
   ```bash
   # Align local migration manifests with the restored database schema
   git checkout <PRIOR_STABLE_COMMIT_OR_TAG>
   cd backend

   if [[ "$DATABASE_PUBLIC_URL" == *"?"* ]]; then
     MIGRATE_URL="${DATABASE_PUBLIC_URL}&sslmode=require"
   else
     MIGRATE_URL="${DATABASE_PUBLIC_URL}?sslmode=require"
   fi

   DATABASE_URL="$MIGRATE_URL" npx prisma migrate status
   ```
   Once schema verification passes, disable Public Networking on the PostgreSQL service if external access is no longer required.
4. **Restore MongoDB Atlas Snapshot (If Telemetry/Recipes Affected)**:
   - In MongoDB Atlas Console → **Clusters** → **Backup** → Select snapshot prior to deployment timestamp → Click **Restore**.
5. **Restart Backend & Re-Verify Health**:
   - Redeploy or scale backend service back to 1 replica on the prior stable commit.
   - Execute the readiness check:
     ```bash
     curl -i https://<BACKEND_HOST>/api/v1/health/readiness
     ```
     Verify HTTP 200 `{ status: "ready" }` before resuming client traffic.

---

## 4. Post-Rollback Validation Checklist

After completing a rollback:
- [ ] `GET /api/v1/health` returns `200` healthy.
- [ ] `GET /api/v1/health/readiness` returns `200` with both `postgres: "connected"` and `mongodb: "connected"`.
- [ ] Login and registration succeed with valid tokens issued.
- [ ] Pantry inventory and recipe lists load correctly.
- [ ] Zero unhandled 500 errors in Railway runtime logs.
- [ ] Incident post-mortem is scheduled to analyze root cause before attempting re-deployment.

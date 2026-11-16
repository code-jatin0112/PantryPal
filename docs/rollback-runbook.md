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
1. Check migration state:
   ```bash
   railway run --service backend npx prisma migrate status
   ```
2. Mark the failed migration as rolled back in Prisma metadata once manually reverted:
   ```bash
   railway run --service backend npx prisma migrate resolve --rolled-back "<MIGRATION_NAME>"
   ```

#### Scenario C: Breaking Schema Change Requiring Full Database Restore
If data was corrupted or incompatible column drops were committed:
1. **Stop Backend Service & Inhibit All Database Writes (MANDATORY)**:
   > [!CAUTION]
   > A frontend Vercel maintenance page alone is **insufficient** because direct API clients, background workers, and mobile/cached sessions bypass the frontend and continue issuing writes while `pg_restore --clean` drops and recreates schema objects.

   - **Immediately scale backend service replicas to 0** in the Railway Dashboard (or stop the service container).
   - Confirm active database connections are terminated and zero writes are in flight.
   - Optionally display a maintenance notice on the Vercel frontend for user communication.
2. **Restore PostgreSQL from Pre-Migration Backup Snapshot**:
   ```bash
   # Restore snapshot taken prior to deployment
   pg_restore --clean --if-exists -h <HOST> -U <USER> -d pantrypal backup_pre_release_<TIMESTAMP>.dump
   ```
3. **Verify Schema Integrity & Migrations**:
   ```bash
   DATABASE_URL="${DATABASE_PUBLIC_URL}?sslmode=require" npx prisma migrate status
   ```
4. **Restore MongoDB Atlas Snapshot (If Telemetry/Recipes Affected)**:
   - In MongoDB Atlas Console → **Clusters** → **Backup** → Select snapshot prior to deployment timestamp → Click **Restore**.
5. **Restart Backend & Re-Verify Health**:
   - Redeploy or scale backend service back to 1 replica on the prior stable commit.
   - Execute the readiness check:
     ```bash
     curl -i https://<BACKEND_HOST>/api/v1/health/readiness
     ```
   - Verify HTTP 200 `{ status: "ready" }` before resuming client traffic.

---

## 4. Post-Rollback Validation Checklist

After completing a rollback:
- [ ] `GET /api/v1/health` returns `200` healthy.
- [ ] `GET /api/v1/health/readiness` returns `200` with both `postgres: "connected"` and `mongodb: "connected"`.
- [ ] Login and registration succeed with valid tokens issued.
- [ ] Pantry inventory and recipe lists load correctly.
- [ ] Zero unhandled 500 errors in Railway runtime logs.
- [ ] Incident post-mortem is scheduled to analyze root cause before attempting re-deployment.

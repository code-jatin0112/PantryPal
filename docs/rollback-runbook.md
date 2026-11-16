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
If schema alterations corrupted data, introduced breaking incompatibilities, or irreversibly dropped columns:

1. **Inhibit All Database Writes & Assess Recovery Point (MANDATORY)**:
   > [!CAUTION]
   > **DATA LOSS WARNING**: Restoring any historical database snapshot resets data to that snapshot's exact point-in-time ($T_{\text{snapshot}}$). Any user transactions, registrations, recipes, or inventory updates committed between $T_{\text{snapshot}}$ and the incident ($T_{\text{incident}}$) **will be permanently lost** from the active database.
   > Merely stopping writes prevents *further* corruption during restore, but does *not* preserve un-snapshotted intermediate data.

   - **Record Recovery Point Metadata**: Record the snapshot ID, creation timestamp ($T_{\text{snapshot}}$), and corresponding git commit SHA.
   - **Scale Backend Replicas to 0**: In the Railway Dashboard, immediately scale backend service replicas to `0` (or stop the service container) to terminate API traffic and background workers.
   - **Terminate Active PostgreSQL Connections**: Verify that all active connection pool sessions are closed and zero writes are in flight.
   - **Preserve Current State Before Restoring**:
     Before dropping tables or reverting disks, take an emergency logical dump of the *current* database state to safeguard delta transactions for post-incident recovery:
     ```bash
     export DATABASE_PUBLIC_URL="<value from Railway Dashboard>"
     export PGSSLROOTCERT="$PWD/postgres-root.crt"
     PGSSLMODE=verify-full pg_dump "$DATABASE_PUBLIC_URL" -Fc -f current_incident_state_$(date +%Y%m%d_%H%M%S).dump
     ```
   - **Test in Isolation First**: Whenever feasible, test the restoration procedure against an isolated non-production database (`pantrypal_test`) before running in production.

2. **Execute the Matching Restoration Procedure**:

   ##### Scenario C.1: In-Platform Railway Volume Snapshot Restore (For Backups created in Railway Dashboard)
   If you created an in-platform volume backup in Railway Dashboard (PostgreSQL Service → **Data** / **Backups** tab):
   1. Navigate to **Railway Dashboard** → **PostgreSQL Service** → **Backups** tab.
   2. Select the snapshot taken prior to deployment ($T_{\text{snapshot}}$).
   3. Click **Restore Backup** and confirm the operation.
   4. Railway halts the PostgreSQL container, replaces the underlying persistent disk volume with the snapshot, and starts PostgreSQL.
   5. Monitor the PostgreSQL service logs until PostgreSQL reports `database system is ready to accept connections`.
   *(Note: This is an infrastructure disk restore; it does not require `pg_restore` or public networking).*

   ##### Scenario C.2: Logical Backup Restoration via `pg_restore` (For Backups created via `pg_dump`)
   If restoring from an offsite `.dump` archive:
   1. Temporarily enable **Public Networking** on the PostgreSQL service in the Railway Dashboard and copy `DATABASE_PUBLIC_URL`.
   2. Export the Railway PostgreSQL root CA certificate and configure TLS environment variables:
      ```bash
      # Export Railway's internal PostgreSQL CA certificate
      railway ssh --service PostgreSQL -- export-ssl-ca > postgres-root.crt
      export PGSSLROOTCERT="$PWD/postgres-root.crt"
      export DATABASE_PUBLIC_URL="<value from Railway Dashboard>"
      ```
   3. **Ensure Destination Database Cleanliness**:
      > [!NOTE]
      > Note that `pg_restore --clean` drops only objects present in the backup archive. Any newly created tables, indexes, or foreign key constraints added *after* the backup was taken will not be dropped by `--clean`. To ensure a pristine restore, drop and recreate the `public` schema or drop newly created tables before restoring.
   4. **Execute pg_restore with TLS and Fail-Fast Error Handling**:
      ```bash
      # Restore snapshot stopping immediately on error with strict TLS:
      PGSSLMODE=verify-full PGSSLROOTCERT="$PWD/postgres-root.crt" pg_restore --exit-on-error --clean --if-exists -h <PROXY_HOST> -p <PORT> -U postgres -d railway backup_pre_release_<TIMESTAMP>.dump
      ```
      Confirm `pg_restore` exits with status `0` before proceeding.
   5. **Immediate Public Network Closure (MANDATORY)**:
      **Immediately disable Public Networking** on the PostgreSQL service in the Railway Dashboard as soon as `pg_restore` finishes (or aborts). Do not leave Public Networking exposed.

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

5. **Restart Backend & Re-Verify Health Across Versions**:
   - Redeploy or scale backend service back to 1 replica on the prior stable commit.
   - **Version-Aware Health Verification**:
     - **Base Liveness Check (All Releases)**:
       ```bash
       curl -i https://<BACKEND_HOST>/api/v1/health
       ```
       Verify HTTP 200 `{ status: "healthy" }`. This endpoint is universally supported across all historical and current versions.
     - **Deep Readiness Probe (Phase 7+ Releases Only)**:
       If the restored rollback target is a commit that includes the Phase 7 deep readiness probe:
       ```bash
       curl -i https://<BACKEND_HOST>/api/v1/health/readiness
       ```
       Verify HTTP 200 `{ status: "ready" }`. If rolling back to Phase 6 or earlier releases that lack `/health/readiness` (which return HTTP 404), rely on `/api/v1/health` and direct database verification instead.
     - Once health is confirmed, resume client traffic.

6. **Post-Restore Delta Write Reconciliation**:
   - Using the emergency dump created in Step 1 (`current_incident_state.dump`), extract user transactions committed between $T_{\text{snapshot}}$ and $T_{\text{incident}}$ (e.g. restoring into a temporary staging database to query `User`, `Recipe`, and `PantryItem` records created in that window).
   - Reconcile or replay valid user records to minimize data loss impact.

---

## 4. Post-Rollback Validation Checklist

After completing a rollback:
- [ ] `GET /api/v1/health` returns `200` healthy (universal check across all versions).
- [ ] `GET /api/v1/health/readiness` returns `200` (if rollback target supports Phase 7+ deep readiness probe).
- [ ] `GET /api/v1/health/readiness` returns `200` with both `postgres: "connected"` and `mongodb: "connected"`.
- [ ] Login and registration succeed with valid tokens issued.
- [ ] Pantry inventory and recipe lists load correctly.
- [ ] Zero unhandled 500 errors in Railway runtime logs.
- [ ] Incident post-mortem is scheduled to analyze root cause before attempting re-deployment.

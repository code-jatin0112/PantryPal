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
   # Universal liveness check across all versions:
   curl -i https://<BACKEND_HOST>/api/v1/health

   # Deep readiness probe (Phase 7+ releases only; expected 404 on Phase 6 or earlier):
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
4. **Disable Public Networking (MANUAL OPERATOR ACTION REQUIRED)**: The operator must manually navigate to **Railway Dashboard** → **PostgreSQL Service** → **Settings** → **Networking** and toggle off **Public Networking** once resolved.

#### Scenario C: Breaking Schema Change Requiring Full Database Restore
If schema alterations corrupted data, introduced breaking incompatibilities, or irreversibly dropped columns:

1. **Inhibit All Database Writes, Assess Recovery Point & Preserve Current State (MANDATORY)**:
   > [!CAUTION]
   > **DATA LOSS WARNING**: Restoring any historical database snapshot resets data to that snapshot's exact point-in-time ($T_{\text{snapshot}}$). Any user transactions, registrations, recipes, or inventory updates committed between $T_{\text{snapshot}}$ and the incident ($T_{\text{incident}}$) **will be permanently lost** from the active database.
   > Merely stopping writes prevents *further* corruption during restore, but does *not* preserve un-snapshotted intermediate data.

   - **Record Recovery Point Metadata**: Record the snapshot ID, creation timestamp ($T_{\text{snapshot}}$), and corresponding git commit SHA.
   - **Scale Backend Replicas to 0**: In the Railway Dashboard, immediately scale backend service replicas to `0` (or stop the service container) to terminate API traffic and background workers.
   - **Terminate Active PostgreSQL Connections**: Verify that all active connection pool sessions are closed and zero writes are in flight.
   - **Preserve Current State Before Restoring**:
     Before dropping tables or reverting disks, take an emergency logical dump of the *current* database state to safeguard delta transactions for post-incident recovery:
     1. Temporarily enable **Public Networking** on the PostgreSQL service in the Railway Dashboard and copy `DATABASE_PUBLIC_URL`.
     2. Export the root CA certificate and configure TLS verification:
        ```bash
        # Export Railway's internal PostgreSQL CA certificate
        railway ssh --service PostgreSQL -- export-ssl-ca > postgres-root.crt
        export PGSSLROOTCERT="$PWD/postgres-root.crt"
        export DATABASE_PUBLIC_URL="<value from Railway Dashboard>"
        ```
     3. Execute emergency `pg_dump` with strict TLS:
        ```bash
        EMERGENCY_DUMP="current_incident_state_$(date +%Y%m%d_%H%M%S).dump"
        PGSSLMODE=verify-full pg_dump "$DATABASE_PUBLIC_URL" -Fc -f "$EMERGENCY_DUMP"
        DUMP_STATUS=$?
        ```
     4. **Immediate Public Network Closure (MANUAL OPERATOR ACTION REQUIRED)**:
        The operator must manually navigate to **Railway Dashboard** → **PostgreSQL Service** → **Settings** → **Networking** and toggle off **Public Networking** immediately, regardless of whether `pg_dump` succeeded or failed. Disabling public networking is not automated by CLI scripts and must never be left enabled during restore.
     5. **Verify Emergency Backup Usability Before Proceeding**:
        ```bash
        # Verify dump command exit status
        if [ $DUMP_STATUS -ne 0 ]; then
          echo "CRITICAL: Emergency database backup failed with exit code $DUMP_STATUS."
          echo "DO NOT PROCEED with destructive restore. Escalate to Incident Commander."
          exit 1
        fi

        # Verify archive readability and schema listing
        if ! pg_restore --list "$EMERGENCY_DUMP" > /dev/null 2>&1; then
          echo "CRITICAL: Emergency database archive is corrupted or unreadable."
          echo "DO NOT PROCEED with destructive restore. Escalate to Incident Commander."
          exit 1
        fi
        ```
        > [!CAUTION]
        > **DO NOT PROCEED with a destructive restore if the emergency backup cannot be verified with `pg_restore --list`**. Stop immediately and escalate for an explicit operator and stakeholder decision.
   - **Test in Isolation First**: Whenever feasible, test the restoration procedure against an isolated non-production database (`pantrypal_test`) before running in production.

2. **Execute the Matching Restoration Procedure**:

   ##### Scenario C.1: In-Platform Railway Volume Snapshot Restore (For Backups created in Railway Dashboard)
   If you created an in-platform volume backup in Railway Dashboard (PostgreSQL Service → **Data** / **Backups** tab):
   1. Navigate to **Railway Dashboard** → **PostgreSQL Service** → **Backups** tab.
   2. Select the snapshot taken prior to deployment ($T_{\text{snapshot}}$).
   3. Click **Restore**.
   4. **Review Staged Volume Changes & Deploy**:
      > [!IMPORTANT]
      > Railway does **not** apply the restored volume immediately upon clicking Restore. Instead, Railway stages the volume restore as a pending configuration change.
      
      Review the staged volume changes (Railway preserves the previous volume disk as detached where available). Click **Deploy** to actually apply the staged changes and trigger deployment of the PostgreSQL container with the restored volume attached.
   5. Monitor the PostgreSQL service deploy logs until PostgreSQL reports `database system is ready to accept connections`.
   6. Verify restored database volume and schema state.
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
   5. **Immediate Public Network Closure (MANUAL OPERATOR ACTION REQUIRED)**:
      The operator must manually navigate to **Railway Dashboard** → **PostgreSQL Service** → **Settings** → **Networking** and toggle off **Public Networking** immediately as soon as `pg_restore` finishes (or aborts). Disabling public networking is not automated by CLI scripts and must never be left exposed.

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
   Once schema verification passes, the operator must manually navigate to the Railway Dashboard and toggle off Public Networking on the PostgreSQL service.

4. **Restore MongoDB Atlas Snapshot (If Telemetry/Recipes Affected)**:
   - In MongoDB Atlas Console → **Clusters** → **Backup** → Select snapshot prior to deployment timestamp → Click **Restore**.

5. **Post-Restore Delta Write Reconciliation & Operator Sign-Off in Staging (MANDATORY BEFORE BACKEND RESTART)**:
   > [!CAUTION]
   > **NEVER automatically replay unreviewed transactions into production**. Schema changes or corrupted application state from the failed deployment could cause cascading data corruption. All reconciliation must be performed in an isolated non-production environment with human operator and product sign-off **before restarting the backend or accepting traffic**.
   
   **Safe Operational Sequence**:
   1. **Confirm Backend Remains Halted**: Verify that backend service replicas remain at `0` and client traffic is completely blocked.
   2. **Assess Post-Snapshot Writes in Isolated Staging**:
      Restore `current_incident_state.dump` into an isolated non-production staging database or local test database (`pantrypal_test`), never directly into production.
      ```sql
      -- Identify transactions created during the incident window in the isolated staging DB
      SELECT id, email, "createdAt" FROM "User" WHERE "createdAt" > '<T_SNAPSHOT>';
      SELECT id, title, "userId", "createdAt" FROM "Recipe" WHERE "createdAt" > '<T_SNAPSHOT>';
      SELECT id, name, "pantryId", "createdAt" FROM "PantryItem" WHERE "createdAt" > '<T_SNAPSHOT>';
      ```
   3. **Reconcile Recoverable Changes Safely**:
      Filter out corrupt data or malformed inputs resulting from the release failure. Prepare explicit, validated SQL insert/upsert scripts for verified user accounts and entities.
   4. **Obtain Operator & Product Owner Sign-Off on Potential Data Loss**:
      Review reconciling vs un-reconcilable data with the incident commander and product owner. Obtain explicit written operator sign-off and stakeholder disposition before proceeding to backend restart.

6. **Restart Backend Service in Isolation (Zero Public Traffic)**:
   - Redeploy or scale the backend service back to 1 replica on the prior stable commit.
   - Keep public ingress traffic blocked / DNS or load balancer paused while service initialization, database connectivity, and smoke tests are verified.

7. **Verify Service Health, Database Connectivity & Smoke Tests Across Versions**:
   - **Base Liveness Check (All Releases)**:
     ```bash
     curl -i https://<BACKEND_HOST>/api/v1/health
     ```
     Verify HTTP 200 `{ status: "healthy" }`. This endpoint is universally supported across all historical and current versions.
   - **Direct Database Connectivity Verification**:
     Verify database connectivity via internal logs or direct query check (e.g. `SELECT 1;`).
   - **Deep Readiness Probe (Phase 7+ Releases Only)**:
     If the restored rollback target is a commit that includes the Phase 7 deep readiness probe:
     ```bash
     curl -i https://<BACKEND_HOST>/api/v1/health/readiness
     ```
     Verify HTTP 200 `{ status: "ready" }` with `postgres: "connected"` and `mongodb: "connected"`. If rolling back to Phase 6 or earlier releases that lack `/health/readiness` (which return HTTP 404), do not treat 404 as an error; rely on `/api/v1/health` and direct database verification instead.
   - **Execute Post-Rollback Smoke Tests in Isolation**:
     Run targeted smoke tests (user authentication, pantry retrieval) in isolation to verify application functionality prior to public exposure.

8. **Resume Public Client Traffic & Post-Incident Closeout**:
   - Re-enable ingress / route public client traffic back to the restored backend service.
   - Monitor live runtime logs in Railway and Vercel for zero unhandled 500 errors.
   - Complete the full post-rollback validation checklist below and run [`docs/launch-smoke-tests.md`](./launch-smoke-tests.md).
   - Schedule an incident post-mortem to analyze root cause before attempting re-deployment.

---

## 4. Post-Rollback Validation Checklist

After completing a rollback:
- [ ] Database restore completed and verified against prior stable schema (`prisma migrate status`).
- [ ] Post-snapshot writes assessed in isolated staging, and delta reconciliation completed or explicitly dispositioned.
- [ ] Incident commander and product owner sign-off documented prior to backend restart.
- [ ] Backend restarted on prior stable release tag or commit in isolation.
- [ ] `GET /api/v1/health` returns `200` healthy (universal liveness check across all versions).
- [ ] Direct database connectivity verified (e.g. `SELECT 1` or query check).
- [ ] `GET /api/v1/health/readiness` returns `200` with both `postgres: "connected"` and `mongodb: "connected"` (CONDITIONALLY REQUIRED ONLY for Phase 7+ rollback targets; expected 404 on Phase 6 or earlier).
- [ ] Login and registration succeed with valid tokens issued.
- [ ] Pantry inventory and recipe lists load correctly.
- [ ] Public client traffic resumed only after health checks and smoke tests pass.
- [ ] Zero unhandled 500 errors in Railway runtime logs.
- [ ] Temporary public networking on PostgreSQL verified disabled (manual operator confirmation).
- [ ] Incident post-mortem scheduled to analyze root cause before attempting re-deployment.

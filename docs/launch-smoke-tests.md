# PantryPal — Production Launch Smoke Test Suite

This runbook outlines the required post-deployment verification procedures to confirm that PantryPal is functioning cleanly, reliably, and securely in the live production environment.

---

## 1. Automated Health & Readiness Verification

### 1.1 Liveness Probe
Execute against the deployed backend URL:
```bash
curl -i https://<BACKEND_HOST>/api/v1/health
```
**Expected Response**:
- HTTP `200 OK`
- Header: `Content-Type: application/json`
- Header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Header: `X-Content-Type-Options: nosniff`
- Body:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "timestamp": "2026-..."
    }
  }
  ```

### 1.2 Deep Readiness Probe
Execute to verify live datastore connectivity:
```bash
curl -i https://<BACKEND_HOST>/api/v1/health/readiness
```
**Expected Response**:
- HTTP `200 OK`
- Body:
  ```json
  {
    "success": true,
    "data": {
      "status": "ready",
      "services": {
        "postgres": "connected",
        "mongodb": "connected"
      }
    }
  }
  ```
- **Validation**: Ensure no credentials, usernames, or database hostnames are leaked in the output.

---

## 2. Core Functional Smoke Tests

### 2.1 User Authentication Flow
1. **Registration**:
   - Navigate to `https://<FRONTEND_HOST>/register`.
   - Register a new verification user: `smoke-test-<TIMESTAMP>@example.com`.
   - Verify immediate redirect to Dashboard upon success.
2. **Profile & Token Revocation**:
   - Navigate to `/settings`.
   - Verify profile displays correct name and email.
   - Update password. Confirm active token is revoked and fresh session token is issued.
3. **Login Rate Limiter**:
   - Send 11 failed login attempts via curl:
     ```bash
     for i in {1..11}; do
       curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<BACKEND_HOST>/api/v1/auth/login \
         -H "Content-Type: application/json" \
         -d '{"email":"fake@example.com","password":"wrong"}'
     done
     ```
   - Verify the 11th request returns HTTP `429 Too Many Requests` with code `RATE_LIMIT_EXCEEDED`.

### 2.2 Pantry & Recipe Management
1. **Create Pantry**: Create a pantry named `"Main Kitchen"`.
2. **Add Inventory**: Add `"Organic Rolled Oats"`, category `Grains`, quantity `500`, unit `g`.
3. **Low Stock Alert**: Set threshold to `600g`. Verify item appears under Low Stock alerts.
4. **Create Recipe**:
   - Create recipe `"Quick Oatmeal"`, servings `2`.
   - Add ingredient `"Organic Rolled Oats"` `100g`.
   - Verify pantry availability indicator shows 100% matched ingredients.

### 2.3 Guided Cooking State Machine
1. **Start Cooking Session**:
   - Click "Start Cooking" on the recipe.
   - Verify session transitions to `IN_PROGRESS`.
2. **Advance Steps**:
   - Step through instructions; verify progress updates without screen stutter.
3. **Complete Session**:
   - Click "Complete Cooking".
   - Verify pantry inventory automatically deducts `100g` from `"Organic Rolled Oats"`, leaving `400g` in stock.

### 2.4 AI Assistant & Telemetry
1. **AI Recipe Generation**:
   - Navigate to AI Recipe Generator.
   - Request: `"Healthy dinner with pantry items"`.
   - Verify generation completes within 30 seconds with valid structured recipe cards.
2. **AI Telemetry Logging**:
   - Verify chat interactions persist to MongoDB collection `ai_interaction_logs`.
   - Verify newly generated recipes persist to `unstructured_recipes`.

### 2.5 Personal Data Export (GDPR / CCPA)
1. Navigate to `/settings` → **Account** tab.
2. Click **Export Kitchen Archive**.
3. Verify downloaded JSON contains complete relational entities plus:
   - `aiInteractionHistory` array.
   - `unstructuredRecipes` array.
   - `completeness: "complete"`.

### 2.6 Dual-Store Two-Phase Account Deletion
1. In Settings → Account, initiate account termination.
2. Confirm password in deletion modal.
3. **Verify Guarantees**:
   - Relational user record and associated pantries/recipes are deleted.
   - MongoDB telemetry and unstructured recipes are purged.
   - Attempting to log back in returns HTTP 401 `INVALID_CREDENTIALS` (or HTTP 403 `ACCOUNT_PENDING_DELETION` if recovery in-flight).

---

## 3. Security Boundary Verification

### 3.1 CORS Policy Enforcement
Send a request with an unauthorized origin:
```bash
curl -i -X GET https://<BACKEND_HOST>/api/v1/health \
  -H "Origin: https://malicious-attacker.com"
```
**Expected Response**:
- HTTP `403 Forbidden`
- Body: `{"success":false,"error":{"code":"CORS_ORIGIN_NOT_ALLOWED","message":"Origin not allowed by CORS policy"}}`

### 3.2 Error Handler Stack Trace Masking
Trigger an intentional 404 or invalid route:
```bash
curl -i https://<BACKEND_HOST>/api/v1/non-existent-route
```
**Expected Response**:
- HTTP `404 Not Found`
- Zero stack traces, file paths, or internal modules printed.

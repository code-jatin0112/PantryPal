# PantryPal — Production Environment Variable Checklist

This document provides a clean, audit-verified checklist of all environment variables required for production deployment on **Railway** (Backend) and **Vercel** (Frontend).

> [!CAUTION]
> **Zero-Secret Disclosure Policy**:
> - Never commit `.env` files or hardcode secrets in source control.
> - Never print, log, or expose live credential values in documentation, PRs, or build logs.
> - Do not set test database URIs (`TEST_DATABASE_URL`, `MONGO_TEST_URI`) in production environments.

---

## 1. Backend Service Environment Variables (Railway)

| Variable Name | Required | Type / Format | Purpose & Constraint Notes |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | String (`production`) | Activates production optimizations, strict credential checks, and error maskings. |
| `PORT` | **Yes** | Integer (`3000` or auto) | HTTP listen port. Automatically injected by Railway; falls back to 3000. |
| `DATABASE_URL` | **Yes** | Connection String (URI) | PostgreSQL connection string (`postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`). Supports Railway managed PostgreSQL or AWS RDS. |
| `MONGO_URI` | **Yes** | Connection String (URI) | MongoDB connection string (`mongodb+srv://USER:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority`). Connects to MongoDB Atlas cluster for AI interaction logs, unstructured recipes, and deletion obligations. |
| `JWT_SECRET` | **Yes** | High-Entropy String | Cryptographic signing key for JSON Web Tokens. Must be **at least 32 characters** long and generated using `openssl rand -hex 32`. Rejects default placeholders in production. |
| `JWT_EXPIRES_IN` | No | Duration String (`7d`, `1h`) | Token lifespan. Defaults to `7d` if omitted. |
| `ALLOWED_ORIGINS` | **Yes** | Comma-separated URLs | Whitelist of client web origins allowed by CORS. Example: `https://pantrypal.vercel.app,https://pantrypal.com` (No trailing slashes). |
| `CORS_ORIGIN` | No | URL String | Fallback origin if `ALLOWED_ORIGINS` is not provided. |
| `FRONTEND_URL` | No | URL String | Canonical frontend URL for notification redirects and communications. |
| `TRUST_PROXY` | **Yes** | Boolean String (`true`) | Required when running behind Railway's ingress proxy so Express can accurately read `X-Forwarded-For` for client rate limiting. |
| `RATE_LIMIT_WINDOW_MS` | No | Integer (Milliseconds) | Global API rate limiting window. Defaults to `900000` (15 minutes). |
| `RATE_LIMIT_MAX_REQUESTS`| No | Integer | Maximum API requests allowed per client IP per window. Defaults to `500`. |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | Integer (Milliseconds) | Authentication rate limiting window. Defaults to `900000` (15 minutes). |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | No | Integer | Maximum login and registration requests allowed per IP per window. Defaults to `10`. |
| `AI_RATE_LIMIT_WINDOW_MS` | No | Integer (Milliseconds) | AI generation rate limiting window. Defaults to `900000` (15 minutes). |
| `AI_RATE_LIMIT_MAX_REQUESTS` | No | Integer | Maximum AI recipe/chat requests per authenticated user per window. Defaults to `20`. |
| `LLM_API_KEY` | **Yes** | Secret Key | Google Gemini API key used by `@google/genai`. |
| `LLM_MODEL` | No | String (`gemini-2.5-flash`) | Gemini model identifier. Defaults to `gemini-2.5-flash`. |
| `LLM_TIMEOUT` | No | Integer (Milliseconds) | Timeout for AI inference before returning 504. Defaults to `30000` (30 seconds). |

---

## 2. Frontend Application Environment Variables (Vercel)

| Variable Name | Required | Type / Format | Purpose & Constraint Notes |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | URL String | Full base URL of the backend API, including the `/api/v1` base path (e.g. `https://pantrypal-backend.up.railway.app/api/v1`). |

> [!IMPORTANT]
> **Vite Security Boundary**:
> - Only variables prefixed with `VITE_` are bundled into the client build.
> - **Never** define `VITE_JWT_SECRET`, `VITE_DATABASE_URL`, `VITE_MONGO_URI`, or `VITE_LLM_API_KEY`.
> - All client calls strictly communicate with the backend proxy; browser code never contacts database or AI providers directly.

---

## 3. Pre-Flight Verification Checklist

Before triggering production launch:
- [ ] `NODE_ENV` is set to `production` in Railway.
- [ ] `DATABASE_URL` connects cleanly to production PostgreSQL with SSL mode enabled.
- [ ] `MONGO_URI` connects cleanly to MongoDB Atlas with TLS enabled.
- [ ] `JWT_SECRET` is generated via `openssl rand -hex 32` (>= 32 characters).
- [ ] `ALLOWED_ORIGINS` exactly matches the Vercel production deployment domain(s).
- [ ] `TRUST_PROXY` is set to `true`.
- [ ] `LLM_API_KEY` is provisioned from Google Cloud Console with Gemini API enabled and quota billing verified.
- [ ] `VITE_API_URL` in Vercel points to the Railway backend domain and resolves to `/api/v1`.
- [ ] Neither `TEST_DATABASE_URL` nor `MONGO_TEST_URI` is defined in production environment variables.

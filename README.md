# PantryPal

> **"Use what you have before buying more."**

PantryPal is an AI-powered kitchen assistant and smart pantry management platform designed to help users track available household ingredients, reduce avoidable food waste, dynamically scale recipes, plan multi-dish meals within budget, generate smart grocery lists, and receive grounded conversational cooking guidance.

---

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture & Layering](#architecture--layering)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Migrations](#database-migrations)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [Security Features](#security-features)
- [AI Subsystem](#ai-subsystem)
- [Production Deployment Notes](#production-deployment-notes)
- [Project Documentation](#project-documentation)

---

## Core Philosophy

Traditional recipe applications begin with *"What recipe do you want to cook?"*  
PantryPal begins with **"What food do you already own?"**

By prioritizing ingredients approaching expiration, calculating cross-unit shortages, and adapting recipes to headcount and budget, PantryPal transforms pantry management into an intelligent, waste-reducing daily routine.

---

## Key Features

- **Pantry & Stock Management:** Multi-pantry containers with atomic stock adjustments, unit conversion, and low-stock indicators.
- **Urgent Expiry Tracking:** Automated tracking of item shelf life with days-until-expiry calculations and food waste prioritization.
- **Dynamic Serving Scaling ($N$-servings):** Deterministic fractional scaling of recipe quantities with weight, volume, and discrete count unit conversions.
- **Interactive Cooking Mode:** Step-by-step guided cooking progress linked with transactional pantry inventory deduction upon completion.
- **Multi-Dish Meal Planning Engine:** Multi-headcount scheduler supporting independent dish servings, serving coverage warnings, and consolidated shortage aggregation.
- **Smart Grocery List:** Auto-aggregates missing ingredients, tracks purchase toggles, and supports batch clear operations.
- **AI Meal Recommendations (FR-17):** Grounded LLM recommendations considering pantry items, expiring stock, cold-start library generation, and dietary restrictions.
- **Conversational Kitchen Assistant (FR-18):** Multi-turn natural language kitchen assistant grounded strictly in live user application data with prompt injection defenses.
- **User Preferences & Dietary Guardrails:** Persistent user profiles for allergies, dietary restrictions, disliked ingredients, and default budgets.
- **Production-Grade Security:** Helmet headers, CORS origin whitelisting, sliding-window Rate Limiting, and 404/AppError interceptors.

---

## Technology Stack

- **Runtime:** Node.js (v20+ ESM)
- **Framework:** Express 5
- **ORM & Database:** Prisma 7 with PostgreSQL
- **AI / LLM:** Google GenAI SDK (`@google/genai`) with structured JSON schema outputs
- **Authentication & Security:** JWT (stateless Bearer tokens), `bcrypt` (password hashing), `helmet` (security headers), `express-rate-limit` (request throttling), `cors` (origin whitelisting)
- **Validation:** `express-validator`
- **Testing:** Vitest 4 with Supertest

---

## Architecture & Layering

The backend enforces strict separation of concerns across layered components:

```text
HTTP Request
     ↓
[Reverse Proxy / Trust Proxy]
     ↓
[Helmet Security Headers]
     ↓
[CORS Origin Whitelist]
     ↓
[Rate Limiter (500 req / 15 min)]
     ↓
[JSON Parser (1MB limit)]
     ↓
[Authentication Middleware (JWT)]
     ↓
[express-validator Chains]
     ↓
[Route Controllers] ─── (Orchestrates HTTP req/res)
     ↓
[Service Layer] ─────── (Pure Domain & Mathematical Logic)
     ↓
[Prisma Data Access] ── (PostgreSQL with Cascade Rules & Transactions)
```

---

## Directory Structure

```text
backend/
├── prisma/
│   ├── migrations/          # Version-controlled SQL schema migrations
│   └── schema.prisma        # Prisma schema definitions (10 models)
├── src/
│   ├── config/              # Database & Security configurations (Helmet, CORS, Rate Limit)
│   ├── controllers/         # HTTP request/response handlers
│   ├── middleware/          # Auth, 404, and Global error handling
│   ├── routes/              # Express API route declarations
│   ├── schemas/             # JSON schemas for structured AI outputs
│   ├── services/            # Core business logic & meal planning engine
│   ├── utils/               # AI context builders, token, password, and unit matchers
│   ├── validators/          # express-validator schema chains
│   ├── app.js               # Express application pipeline configuration
│   └── server.js            # Server entrypoint with graceful shutdown handlers
├── tests/
│   ├── integration/         # API integration test suites (Vitest + Supertest)
│   └── unit/                # Unit test suites for matchers & conversions
├── .env.example             # Documented template for environment configuration
└── package.json             # Scripts & dependencies
```

---

## Prerequisites

- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **PostgreSQL:** v15.0 or higher (or cloud PostgreSQL such as Supabase/Neon)
- **Google GenAI API Key:** (Gemini API key for AI features)

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/code-jatin0112/PantryPal.git
   cd PantryPal/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your PostgreSQL database URL, JWT secret, and Gemini API key.

---

## Database Migrations

Generate Prisma Client and apply migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Apply pending migrations to database
npx prisma migrate deploy

# (Optional development sync)
npx prisma migrate dev
```

---

## Running the Application

```bash
# Start development server with live reload (tsx)
npm run dev

# Start production server
npm start
```

The server will start on `http://localhost:3000` (or your configured `PORT`).

---

## Running Tests

Execute the automated test suite using Vitest:

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npx vitest

# Run syntax verification across all files
find src tests -name "*.js" -exec node --check {} +
```

---

## API Overview

All routes are versioned under `/api/v1/*`.

| Resource | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Health** | `GET` | `/api/v1/health` | Service health status check |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new account |
| | `POST` | `/api/v1/auth/login` | Authenticate & receive JWT |
| | `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| **Preferences** | `GET` | `/api/v1/preferences` | Get user dietary & allergy preferences |
| | `PUT` | `/api/v1/preferences` | Update dietary, allergy, & budget profile |
| **Pantries** | `POST` | `/api/v1/pantries` | Create pantry container |
| | `GET` | `/api/v1/pantries` | List user pantries with item counts |
| | `GET` | `/api/v1/pantries/:pantryId` | Get pantry details and items |
| | `PUT` | `/api/v1/pantries/:pantryId` | Update pantry name |
| | `DELETE` | `/api/v1/pantries/:pantryId` | Delete pantry (cascades to items) |
| **Pantry Items**| `GET` | `/api/v1/pantries/:pantryId/items` | List ingredients in pantry |
| | `POST` | `/api/v1/pantries/:pantryId/items` | Add ingredient to pantry |
| | `PATCH` | `/api/v1/pantries/:pantryId/items/:itemId/stock` | Atomic quantity increment/decrement |
| | `GET` | `/api/v1/pantries/:pantryId/expiring` | Get items sorted by expiration urgency |
| | `GET` | `/api/v1/pantries/:pantryId/low-stock` | Get items below threshold |
| **Recipes** | `POST` | `/api/v1/recipes` | Create user recipe |
| | `GET` | `/api/v1/recipes` | List recipes with filtering |
| | `GET` | `/api/v1/recipes/:recipeId/scale` | Scale ingredients for $N$ servings |
| | `GET` | `/api/v1/recipes/:recipeId/pantries/:pantryId` | Match recipe against pantry stock |
| | `GET` | `/api/v1/recipes/:recipeId/nutrition` | Get calculated macronutrients |
| **Cooking** | `POST` | `/api/v1/recipes/:recipeId/cooking-sessions` | Start interactive cooking session |
| | `PATCH` | `/api/v1/cooking-sessions/:sessionId/progress` | Update current step progress |
| | `POST` | `/api/v1/cooking-sessions/:sessionId/complete` | Complete session & deduct pantry stock |
| **Meal Plans** | `POST` | `/api/v1/meal-plans` | Create multi-dish meal plan |
| | `POST` | `/api/v1/meal-plans/:mealPlanId/evaluate` | Deterministic coverage & budget analysis |
| | `POST` | `/api/v1/meal-plans/:mealPlanId/grocery-requirements` | Aggregate consolidated grocery shortages |
| **Shopping List**| `GET` | `/api/v1/shopping-list` | List active grocery items |
| | `DELETE` | `/api/v1/shopping-list/purchased/clear` | Remove all purchased items |
| **AI Services** | `POST` | `/api/v1/ai/recipes/generate` | Generate structured recipe from stock |
| | `POST` | `/api/v1/ai/recommendations` | Pantry-aware AI meal recommendations |
| | `POST` | `/api/v1/ai/chat` | Conversational kitchen assistant |

---

## Security Features

- **Helmet Protection:** Production HTTP headers defending against XSS, MIME-sniffing, clickjacking (`X-Frame-Options: DENY`), and information leakage.
- **CORS Whitelisting:** Configurable origins (`ALLOWED_ORIGINS`) with credential support and preflight caching.
- **Sliding-Window Rate Limiting:** Throttles clients exceeding 500 requests per 15 minutes, returning standard `RateLimit-*` headers and HTTP 429 JSON responses.
- **Strict Data Isolation:** Every query enforces tenancy by scoping on `where: { id, userId }`.
- **Injection Defenses:** Parameterized Prisma queries prevent SQL injection; AI prompt builders strip control characters and enforce strict JSON schemas.

---

## AI Subsystem

PantryPal integrates Google GenAI using structured output schemas:

1. **Context Grounding:** Live pantry items, expiration statuses, recipes, meal plans, and user preferences are supplied to the prompt as ground truth.
2. **Cold-Start Resilience:** Generates new pantry-first recipes when user libraries are empty without 404 errors.
3. **Allergy Safety Invariant:** High-priority system instructions enforce strict omission and safety warnings for any allergen present in the user profile.
4. **Timeout Management:** 30-second `AbortController` timeouts return clean HTTP 504 / 503 error payloads upon provider delays.

---

## Production Deployment Notes

- **Environment Secrets:** Ensure `DATABASE_URL`, `JWT_SECRET`, and `LLM_API_KEY` are provisioned via secret managers (e.g. Google Secret Manager, AWS SSM).
- **Reverse Proxies:** Set `TRUST_PROXY=true` when running behind load balancers or Cloudflare to ensure accurate client IP rate limiting.
- **Graceful Shutdown:** The server intercepts `SIGTERM` and `SIGINT` signals, closes active HTTP sockets, cleanly disconnects Prisma, and exits with status 0.

---

## Project Documentation

- [Product Requirements Document (PRD)](./PRD.md)
- [High-Level Design (HLD)](./HLD.md)
- [Low-Level Design (LLD)](./LLD.md)
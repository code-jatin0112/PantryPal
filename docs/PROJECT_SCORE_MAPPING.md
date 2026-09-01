# PantryPal: Project Score Viva Mapping

This document maps the **PantryPal** codebase to the Project Score concepts required for the work-integration eligibility viva. 

Use this document to prepare for your viva. It tells you exactly which files to open and what decisions to defend when the assessor asks you about a specific concept.

---

## 📊 Score Summary

- **Threshold to Clear:** 6.0
- **Mandatory Concepts Required:** 25 (Weight: 4.6)
- **Optional Concepts Needed:** At least 1.4
- **Current Optional Concepts Achieved (Backend):** ~2.6
- **Current Status:** 🔴 **NOT READY** (Missing Mandatory Concepts)

### 🚨 Critical Mandatory Gaps
You cannot pass the viva without completing the following **Mandatory** concepts:
1. **Frontend (React & JS):** The entire frontend is currently missing. You must implement React components, state management (`useState`), side effects (`useEffect`), async data fetching, routing, and demonstrate JavaScript concepts (Event loop, Promises, Closures).
2. **NoSQL (MongoDB):** The rubric explicitly marks **Mongo Schema Modeling** and **Mongo CRUD operations** as *Mandatory*. Currently, PantryPal is 100% PostgreSQL. 
   - *Action Item:* You must migrate a portion of your data (e.g., AI conversation history or unstructured AI recipe recommendations) to MongoDB using Mongoose to satisfy this requirement.

---

## 1. Backend & System Design

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **Problem modeling** (Mandatory) | ✅ | 0.2 | `prisma/schema.prisma` | Explain how you separated `Recipe` from `PantryItem`. Discuss the relationship between `User` and `MealPlan`. |
| **System design basics** (Mandatory) | ✅ | 0.2 | `HLD.md`, `LLD.md` | Explain the layered architecture: Routes → Controllers → Services → Prisma. |
| **RESTful endpoint design** (Mandatory) | ✅ | 0.2 | `src/routes/pantryRoutes.js` | Defend why you used `POST /pantries/:id/items` instead of query parameters. |
| **HTTP status codes** (Mandatory) | ✅ | 0.2 | `src/controllers/authController.js` | Show where you return `201 Created` for registration and `404 Not Found` in error handlers. |
| **Request body validation** | ✅ | 0.2 | `src/validators/*.js` | Explain how `express-validator` chains prevent bad data before hitting controllers. |
| **Server-side error handling** (Mandatory) | ✅ | 0.2 | `src/middleware/errorHandler.js` | Explain the `AppError` class and how the global error handler intercepts thrown errors. |
| **Middleware** (Mandatory) | ✅ | 0.2 | `src/middleware/authMiddleware.js` | Explain how the JWT verifier intercepts requests and attaches `req.user`. |

## 2. SQL (PostgreSQL)

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **Relational schema (PK/FK)** (Mandatory) | ✅ | 0.2 | `prisma/schema.prisma` | Show the `@id` and `@relation(fields: [userId])` decorators. |
| **SQL JOINs** (Mandatory) | ✅ | 0.2 | `src/services/aiChatService.js` | Show the `include: { items: true }` Prisma queries which execute as SQL JOINs. |
| **Filtering, ordering, grouping** | ✅ | 0.2 | `src/services/mealPlanService.js` | Show `orderBy: { startDate: "asc" }` and `where` filtering. |
| **ORM usage** | ✅ | 0.2 | `src/services/*.js` | Discuss why you chose Prisma (type safety) over raw SQL. |
| **Transactions** | ✅ | 0.2 | `src/services/mealPlanService.js` | Show `prisma.$transaction(async (tx) => ...)` and explain why atomic operations prevent partial meal plan creation. |

## 3. NoSQL (MongoDB)

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **Schema modeling (Mongo)** (Mandatory) | ❌ | 0.2 | *Missing* | You must implement this. (e.g., AI Chat History schema). |
| **CRUD operations (Mongo)** (Mandatory) | ❌ | 0.2 | *Missing* | You must implement this. |

## 4. Auth & Security

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **Password hashing** | ✅ | 0.2 | `src/services/authService.js` | Show the `bcrypt.hash()` and `bcrypt.compare()` implementations. |
| **JWT issuance & verification** | ✅ | 0.2 | `authService.js` / `authMiddleware.js` | Explain the stateless nature of JWTs and how the signature prevents tampering. |
| **Rate limiting** | ✅ | 0.2 | `src/config/security.js` | Explain why `express-rate-limit` is necessary to prevent brute-force attacks. |
| **Input sanitization & injection** | ✅ | 0.2 | `src/app.js` (Helmet) / Prisma | Explain that Prisma automatically parameterizes queries, preventing SQL injection. |

## 5. AI App Engineering

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **LLM API integration** (Mandatory) | ✅ | 0.2 | `src/services/aiService.js` | Show the `@google/genai` integration block. |
| **Prompt engineering** (Mandatory) | ✅ | 0.2 | `src/utils/aiChatContextBuilder.js` | Show how you dynamically inject pantry stock into the prompt context. |
| **Structured outputs** (Mandatory) | ✅ | 0.2 | `src/schemas/aiChatSchema.js` | Explain how forcing a JSON schema prevents the AI from returning unparseable text. |
| **Prompt injection defenses** | ✅ | 0.3 | `src/services/aiChatService.js` | Defend your system instructions ("Rely strictly on the user's pantry... Never invent..."). |

## 6. Engineering Practices

| Concept | Status | Score | Where to find it in PantryPal | How to Defend it in Viva |
| :--- | :---: | :---: | :--- | :--- |
| **Git workflow** (Mandatory) | ✅ | 0.3 | `.git/` history | Explain branching (if you used it) and commit hygiene. |
| **Env vars & secrets** (Mandatory) | ✅ | 0.2 | `.env.example` / `server.js` | Explain why `JWT_SECRET` is never hardcoded. |
| **Writing unit tests** | ✅ | 0.3 | `tests/unit/` | Explain how you isolate matchers from the database. |
| **Automated API testing** | ✅ | 0.2 | `tests/integration/` | Explain how Supertest verifies your endpoints end-to-end. |

---

## Next Steps to Pass the Viva
1. **Initialize a MongoDB Connection:** Add Mongoose to your backend, create a schema for unstructured data (like `AiInteractionLog`), and write a controller for it.
2. **Build the Frontend:** Set up React. You must implement routing (`react-router-dom`), fetch data from your API (`useEffect`/`fetch`/`axios`), and manage state (`useState`). This covers 9 mandatory concepts at once.

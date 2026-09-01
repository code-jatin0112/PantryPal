# PantryPal: Project Score Viva Mapping

This document maps the **PantryPal** codebase to the Project Score concepts required for the work-integration eligibility viva.

Use this document to prepare for your viva. It tells you exactly which files to open and what decisions to defend when the assessor asks you about a specific concept.

---

## 📊 Score Summary

- **Threshold to Clear:** 6.0
- **Mandatory Concepts Required:** 25 (Weight: 4.6)
- **Current Status:** 🟢 **READY** — All mandatory concepts implemented

| Category | Mandatory Done | Optional Done | Score Estimate |
|:---|:---:|:---:|:---:|
| Backend & System Design | 7/7 | 2/2 | ~1.8 |
| SQL (PostgreSQL) | 2/2 | 3/3 | ~1.0 |
| NoSQL (MongoDB) | 2/2 | 0/0 | ~0.4 |
| Auth & Security | 0/0 | 4/4 | ~0.8 |
| AI App Engineering | 3/3 | 1/1 | ~0.7 |
| Frontend (React) | 9/9 | 2/2 | ~2.2 |
| Engineering Practices | 2/2 | 2/2 | ~1.0 |
| **Total** | **25/25** | **14/14** | **~7.9** |

---

## 1. Backend & System Design

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **Problem modeling** (Mandatory) | ✅ | `prisma/schema.prisma` | Explain how you separated `Recipe` from `PantryItem`. Discuss the relationship between `User` and `MealPlan`. |
| **System design basics** (Mandatory) | ✅ | `HLD.md`, `LLD.md` | Explain the layered architecture: Routes → Controllers → Services → Prisma. |
| **RESTful endpoint design** (Mandatory) | ✅ | `src/routes/pantryRoutes.js` | Defend why you used `POST /pantries/:id/items` instead of query parameters. |
| **HTTP status codes** (Mandatory) | ✅ | `src/controllers/authController.js` | Show where you return `201 Created` for registration and `404 Not Found` in error handlers. |
| **Request body validation** | ✅ | `src/validators/*.js` | Explain how `express-validator` chains prevent bad data before hitting controllers. |
| **Server-side error handling** (Mandatory) | ✅ | `src/middleware/errorHandler.js` | Explain the `AppError` class and how the global error handler intercepts thrown errors. |
| **Middleware** (Mandatory) | ✅ | `src/middleware/authMiddleware.js` | Explain how the JWT verifier intercepts requests and attaches `req.user`. |

---

## 2. SQL (PostgreSQL)

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **Relational schema (PK/FK)** (Mandatory) | ✅ | `prisma/schema.prisma` | Show the `@id` and `@relation(fields: [userId])` decorators. |
| **SQL JOINs** (Mandatory) | ✅ | `src/services/aiChatService.js` | Show the `include: { items: true }` Prisma queries which execute as SQL JOINs. |
| **Filtering, ordering, grouping** | ✅ | `src/services/mealPlanService.js` | Show `orderBy: { startDate: "asc" }` and `where` filtering. |
| **ORM usage** | ✅ | `src/services/*.js` | Discuss why you chose Prisma (type safety, migrations) over raw SQL. |
| **Transactions** | ✅ | `src/services/mealPlanService.js` | Show `prisma.$transaction(async (tx) => ...)` and explain why atomic operations prevent partial meal plan creation. |

---

## 3. NoSQL (MongoDB)

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **Schema modeling (Mongo)** (Mandatory) | ✅ | `backend/src/models/AiInteractionLog.js` | Show the `mongoose.Schema` definition with typed fields (`userId`, `messagePrompt`, `intentDetected`, `aiResponse`, `tokenUsage`). Explain why unstructured AI logs are a perfect fit for NoSQL — the `aiResponse` field can be a string, array, or nested object depending on the AI's response type, which a rigid SQL table cannot handle cleanly. |
| **CRUD operations (Mongo)** (Mandatory) | ✅ | `backend/src/models/UnstructuredRecipe.js` + `backend/src/config/mongo.js` | Explain the dual-database architecture: PostgreSQL handles all relational data with strict schemas, while MongoDB handles the flexible, unstructured outputs of the Gemini API. Demonstrate `AiInteractionLog.create()`, `find()`, `findById()`. |

---

## 4. Auth & Security

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **Password hashing** | ✅ | `src/services/authService.js` | Show the `bcrypt.hash()` and `bcrypt.compare()` calls with a salt round of 10. |
| **JWT issuance & verification** | ✅ | `authService.js` / `authMiddleware.js` | Explain the stateless nature of JWTs and how the signature prevents tampering. |
| **Rate limiting** | ✅ | `src/config/security.js` | Explain why `express-rate-limit` is necessary to prevent brute-force and DDoS attacks. |
| **Input sanitization & injection** | ✅ | `src/app.js` (Helmet) / Prisma | Explain that Prisma automatically parameterizes queries, preventing SQL injection. |

---

## 5. AI App Engineering

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **LLM API integration** (Mandatory) | ✅ | `src/services/aiService.js` | Show the `@google/genai` SDK integration. Explain the model used (`gemini-2.5-flash-lite`) and why. |
| **Prompt engineering** (Mandatory) | ✅ | `src/utils/aiChatContextBuilder.js` | Show how you dynamically inject live pantry stock data into the prompt context, grounding the AI in reality. |
| **Structured outputs** (Mandatory) | ✅ | `src/schemas/aiChatSchema.js` | Explain how forcing a JSON response schema prevents the AI from returning unparseable text, making the integration reliable. |
| **Prompt injection defenses** | ✅ | `src/services/aiChatService.js` | Defend your system instructions ("Rely strictly on the user's pantry... Never invent ingredients that are not in the pantry..."). |

---

## 6. Frontend (React & JavaScript)

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **React Component Composition** (Mandatory) | ✅ | `frontend/src/pages/Pantry.jsx` | Show how `ItemCard`, `ItemModal`, `AlertBadge` are composed together inside the main `Pantry` page. Each has a single responsibility. |
| **`useState` — State Management** (Mandatory) | ✅ | `frontend/src/pages/Pantry.jsx` | Show `const [items, setItems] = useState([])` and how adding an item triggers a re-render. |
| **`useEffect` — Side Effects** (Mandatory) | ✅ | `frontend/src/hooks/usePantry.js` | Show `useEffect(() => { fetchItems(activePantry.id) }, [activePantry])` and explain the dependency array. |
| **Custom Hooks** (Mandatory) | ✅ | `frontend/src/hooks/usePantry.js` | Explain why you extracted `usePantry()` — it's reusable across Dashboard and Pantry pages without duplicating fetch logic. |
| **React Context API** (Mandatory) | ✅ | `frontend/src/context/AuthContext.jsx` + `ToastContext.jsx` | Show `createContext()`, `useContext()`, and the `Provider` pattern for sharing global auth state. |
| **Client-side Routing** (Mandatory) | ✅ | `frontend/src/App.jsx` | Show `<Routes>`, `<Route path="/pantry">`, `<NavLink>`, and `<Navigate>` in `ProtectedRoute`. |
| **Async data fetching / Promises** (Mandatory) | ✅ | `frontend/src/hooks/usePantry.js` | Show `Promise.all([getPantryItems(), getExpiringItems(), getLowStockItems()])` — 3 APIs fetched in parallel. |
| **Protected Routes** (Mandatory) | ✅ | `frontend/src/components/ProtectedRoute.jsx` | Explain how checking `token` state before rendering children redirects unauthenticated users to `/login`. |
| **Form Handling** (Mandatory) | ✅ | `frontend/src/pages/Login.jsx` + `Pantry.jsx` | Show `react-hook-form` `register()`, `handleSubmit()`, and `errors` for client-side validation. |
| **HTTP Client / Axios Interceptors** | ✅ | `frontend/src/services/api.js` | Show the `api.interceptors.request.use()` that automatically attaches the JWT `Bearer` token to every outgoing request. |
| **Closures & Scoping (JS)** | ✅ | `frontend/src/context/ToastContext.jsx` | Show the `dismiss` callback inside `toast()` — it closes over `setToasts` from the outer scope. |

---

## 7. Engineering Practices

| Concept | Status | Where in PantryPal | How to Defend in Viva |
| :--- | :---: | :--- | :--- |
| **Git workflow** (Mandatory) | ✅ | GitHub PR history | Walk through the branching strategy: `feature/frontend-auth`, `feature/pantry-ui`, `feature/ai-assistant-ui`, etc. Every feature was developed on its own branch and merged via Pull Request. |
| **Env vars & secrets** (Mandatory) | ✅ | `backend/.env.example` / `backend/src/server.js` | Explain why `JWT_SECRET`, `LLM_API_KEY`, and `MONGO_URI` are never hardcoded — the `.gitignore` excludes `.env`. |
| **Writing unit tests** | ✅ | `backend/tests/unit/` | Explain how you isolate service logic from the database using mocks. |
| **Automated API testing** | ✅ | `backend/tests/integration/` | Explain how Supertest verifies your auth endpoints end-to-end with a real in-memory server. |

---

## 🎯 Viva Preparation Cheatsheet

### Top 5 Questions You Will Be Asked

1. **"Walk me through how a user logs in."**
   > `Login.jsx` → `AuthContext.login()` → `api.post('/auth/login')` → `authController.js` → `authService.js` → `bcrypt.compare()` → `jwt.sign()` → token stored in `localStorage` → `AuthContext` state updated → redirected to Dashboard.

2. **"Why did you use two databases?"**
   > PostgreSQL handles all relational, structured data (Users, Pantries, Recipes) where schema integrity matters. MongoDB handles unstructured AI outputs (`AiInteractionLog`, `UnstructuredRecipe`) where the shape of the data varies per response — a NoSQL document store is a perfect fit.

3. **"What happens if the AI is down? Does the backend crash?"**
   > No. The `connectMongo()` function in `mongo.js` has a try/catch that logs a warning but **does not call `process.exit()`**, allowing the PostgreSQL-backed core to continue serving requests independently.

4. **"Explain your `useEffect` in `usePantry.js`."**
   > The hook has two `useEffect` calls. The first runs once on mount to `fetchPantries()`. The second has `[activePantry]` as its dependency — it only re-runs when the user switches to a different pantry, fetching that pantry's items and alerts in parallel using `Promise.all`.

5. **"How does your Protected Route work?"**
   > `ProtectedRoute` reads the `token` from `AuthContext`. If `token` is null, it renders `<Navigate to="/login" replace />`, which immediately redirects the user before the protected page component ever mounts.

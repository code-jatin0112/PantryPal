# PantryPal

## Low-Level Design (LLD)

**Version:** 1.0
**Status:** Draft

---

## 1. LLD Overview

This document translates the High-Level Design of PantryPal into an implementation-level blueprint.

The LLD defines the internal structure of the application, including:

- Project directory structure
- Frontend modules and components
- Backend modules
- Database models
- API contracts
- Authentication implementation
- AI service design
- Validation and error handling
- State management
- Testing strategy
- Environment configuration
- Implementation order

The LLD is intended to guide implementation while keeping the codebase modular, maintainable, testable, and easy to understand.

---

## 2. Design Principles

The implementation will follow these principles.

---

### 2.1 Separation of Concerns

Each part of the application should have a focused responsibility.

For example:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Data Access
  ↓
Database
```

Routes should define endpoints, controllers should coordinate HTTP requests, services should contain business logic, and data-access components should handle persistence.

---

### 2.2 Single Responsibility

A module or function should have one primary responsibility.

For example:

- Authentication service handles authentication logic.
- Pantry service handles pantry business rules.
- AI service handles LLM communication.
- Validation schemas handle input validation.

---

### 2.3 Backend as the Security Boundary

The backend is responsible for:

- Authentication
- Authorization
- Validation
- Database access
- Secret management
- Business rules
- AI provider access

The frontend should never be treated as a trusted security boundary.

---

### 2.4 Deterministic Logic for Critical Operations

Critical calculations and state changes should be handled by deterministic application logic.

Examples include:

- Serving-size calculations
- Pantry quantity updates
- Grocery quantity calculations
- Budget arithmetic
- Authorization
- Inventory ownership

AI should not directly perform these operations.

---

### 2.5 AI as a Controlled Application Service

AI functionality will be isolated behind a backend service.

The AI service will:

- Receive controlled application context
- Construct prompts
- Call the LLM provider
- Request structured output
- Validate responses
- Return normalized results

The AI provider will not directly access the database.

---

### 2.6 Validate at System Boundaries

Input should be validated before it enters business logic.

The primary validation boundaries are:

```text
Frontend
   ↓
Backend API Validation
   ↓
Business Logic
   ↓
Database
```

Frontend validation improves user experience, but backend validation remains authoritative.

---

### 2.7 Keep the MVP Simple

The implementation should avoid unnecessary infrastructure.

Features such as Redis, background workers, additional databases, or complex deployment systems should only be introduced when there is a real product or performance requirement.

---

## 3. Implementation Strategy

PantryPal will be implemented incrementally.

The implementation order will generally follow:

```text
Project Setup
      ↓
Frontend Foundation
      ↓
Backend Foundation
      ↓
Database Schema
      ↓
Authentication
      ↓
Pantry Management
      ↓
Recipe System
      ↓
AI Recommendations
      ↓
Grocery Management
      ↓
Cooking Mode
      ↓
Testing
      ↓
Deployment
```

Each major feature should be implemented, tested, documented, and committed independently.

---

## 4. Definition of Done

A feature should not be considered complete merely because its UI works.

A feature is considered complete when:

- Required UI is implemented
- Backend API is implemented where required
- Input validation exists
- Authentication and authorization are applied where required
- Database operations work correctly
- Error states are handled
- Relevant tests are added
- Documentation is updated
- Code is committed using the project's Git workflow

This definition helps prevent partially implemented features from being treated as production-ready.

---

## 5. Project Directory Structure

PantryPal will use a separate frontend and backend structure.

The repository will be organized as follows:

```text
PantryPal/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── PROJECT_SCORE_MAPPING.md
│
├── .gitignore
├── HLD.md
├── LLD.md
├── PRD.md
└── README.md
```

---

### 5.1 Frontend Directory Responsibilities

#### `frontend/public/`

Contains static files that do not need to be imported through the application source code.

Potential contents include:

- Application icons
- Static assets
- Public metadata files

#### `frontend/src/assets/`

Contains frontend assets that are imported by React components.

Examples include:

- Images
- Icons
- Fonts
- Other static resources

#### `frontend/src/components/`

Contains reusable UI components.

Examples:

- Button
- Modal
- Input
- PantryItemCard
- RecipeCard
- GroceryItem
- LoadingSpinner
- ErrorMessage

Components should remain focused on presentation and user interaction.

#### `frontend/src/pages/`

Contains page-level components associated with application routes.

Potential pages include:

- LandingPage
- LoginPage
- RegisterPage
- DashboardPage
- PantryPage
- RecipesPage
- GroceryPage
- MealPlanPage
- CookingPage

#### `frontend/src/layouts/`

Contains reusable page layouts.

Potential layouts include:

- PublicLayout
- AuthenticatedLayout

Layouts can contain shared navigation, headers, sidebars, and page containers.

#### `frontend/src/hooks/`

Contains reusable React hooks.

Potential hooks include:

- useAuth
- usePantry
- useRecipes
- useGroceryList

Hooks should encapsulate reusable frontend behavior rather than business logic that belongs on the backend.

#### `frontend/src/services/`

Contains frontend API communication.

Examples:

- authService
- pantryService
- recipeService
- groceryService
- mealService

The frontend service layer communicates with the backend API and should not contain backend business logic.

#### `frontend/src/context/`

Contains React Context providers for application-wide client state where required.

Potential contexts include:

- AuthContext
- ThemeContext

Context should not be used for every piece of state. Local component state should remain local when appropriate.

#### `frontend/src/utils/`

Contains small reusable frontend utilities.

Examples:

- date formatting
- display helpers
- client-side calculations
- common transformation functions

Critical business calculations should remain on the backend.

#### `frontend/src/constants/`

Contains frontend constants such as:

- Route names
- UI configuration
- Static labels
- Application-level constants

#### `frontend/src/App.jsx`

Defines the main React application structure and connects the application's routing and top-level providers.

#### `frontend/src/main.jsx`

Acts as the frontend entry point and mounts the React application to the DOM.

#### `frontend/src/index.css`

Contains global styles and base CSS configuration.

---

### 5.2 Backend Directory Responsibilities

#### `backend/src/config/`

Contains application configuration and external service setup.

Potential files include:

- database configuration
- environment configuration
- AI provider configuration

Secrets must be loaded from environment variables.

#### `backend/src/controllers/`

Contains HTTP request controllers.

Potential controllers include:

- authController
- pantryController
- recipeController
- groceryController
- cookingController
- mealController

Controllers should coordinate requests and responses without containing complex business logic.

#### `backend/src/middleware/`

Contains reusable Express middleware.

Potential middleware includes:

- authentication middleware
- authorization middleware
- validation middleware
- error handling middleware
- request logging middleware
- rate limiting middleware

#### `backend/src/models/`

Contains database models or persistence definitions.

The exact implementation will depend on the selected database libraries and final database architecture.

#### `backend/src/routes/`

Defines the REST API routes.

Potential route modules include:

- authRoutes
- pantryRoutes
- recipeRoutes
- groceryRoutes
- cookingRoutes
- mealRoutes

Routes should remain lightweight and delegate work to controllers.

#### `backend/src/services/`

Contains application business logic.

Potential services include:

- authService
- pantryService
- recipeService
- groceryService
- cookingService
- mealService
- aiService

This layer is responsible for coordinating business operations.

#### `backend/src/validators/`

Contains request validation schemas.

Potential validation areas include:

- registration
- login
- pantry items
- recipes
- grocery items
- meal plans
- cooking sessions
- AI recommendation requests

#### `backend/src/utils/`

Contains reusable backend utilities.

Examples include:

- token utilities
- password utilities
- error utilities
- date utilities
- response helpers

#### `backend/src/constants/`

Contains backend constants such as:

- error codes
- role names
- application configuration constants
- supported units

#### `backend/src/app.js`

Creates and configures the Express application.

Responsibilities include:

- Express initialization
- Middleware registration
- Route registration
- Error handler registration

#### `backend/src/server.js`

Acts as the backend process entry point.

Responsibilities include:

- Loading application configuration
- Starting the HTTP server
- Initializing required connections
- Handling startup failures

---

### 5.3 Backend Layer Dependency Direction

The backend should follow a controlled dependency direction:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Data Access / Models
  ↓
Database
```

Cross-cutting concerns such as authentication, validation, and error handling are applied through middleware.

The service layer should not depend on Express request or response objects wherever practical.

This keeps business logic easier to test independently from HTTP.

---

### 5.4 Frontend Dependency Direction

The frontend should follow a similar separation:

```text
Pages
  ↓
Components / Hooks
  ↓
Services
  ↓
Backend API
```

Presentation components should not directly perform low-level API requests when a dedicated service abstraction is appropriate.

---

### 5.5 Feature Organization Principle

The initial project structure uses technical layers because the application is still small enough for this structure to remain easy to understand.

As PantryPal grows, related files may be grouped more closely by feature.

For example:

```text
pantry/
├── pantryController.js
├── pantryService.js
├── pantryRoutes.js
├── pantryValidator.js
└── pantryModel.js
```

The final organization will be adjusted if the codebase becomes large enough that feature-based organization provides clearer boundaries.

---

### 5.6 Dependency Management

Frontend and backend will maintain separate `package.json` files.

This allows:

- Independent dependency management
- Independent builds
- Independent deployments
- Clear separation between browser and server dependencies

Dependencies should only be added when they provide meaningful value.

The project should avoid unnecessary libraries that duplicate functionality already provided by the chosen framework or runtime.

---

## 6. Initial Module Boundaries

The main PantryPal backend modules will be:

```text
Authentication
      │
      ├── Registration
      ├── Login
      └── Authorization

Pantry
      │
      ├── Items
      ├── Quantities
      └── Expiry

Recipes
      │
      ├── Recipe Retrieval
      ├── Serving Adjustment
      └── Recommendations

Grocery
      │
      ├── Grocery Lists
      ├── Grocery Items
      └── Purchase Tracking

Cooking
      │
      ├── Cooking Sessions
      ├── Progress
      └── Pantry Usage

Meal Planning
      │
      ├── Meal Plans
      └── Scheduled Meals

AI
      │
      ├── Prompt Construction
      ├── LLM Integration
      ├── Structured Output
      └── Response Validation
```

Each module should expose only the functionality required by other modules.

Internal implementation details should remain encapsulated within the module.

---

## 7. Database Schema Design

PantryPal will use PostgreSQL as the primary database for core application data.

The schema is designed around the relationships between users, pantry inventory, recipes, grocery lists, and meal plans.

MongoDB will only be introduced if a flexible document-oriented model provides a clear advantage for AI-related data.

---

### 7.1 Database Design Goals

The database design should provide:

- Clear relationships between entities
- Referential integrity
- User-level data isolation
- Consistent inventory updates
- Efficient querying
- Support for transactions
- Appropriate indexing
- Minimal data duplication
- A structure that can evolve with the product

---

### 7.2 Entity Relationship Overview

The core PostgreSQL relationships are:

User
 |
 +----------------+
 |                |
 v                v
Pantry        Preferences
 |
 v
Pantry Items


User
 |
 +----------------+----------------+
 |                |                |
 v                v                v
Grocery Lists  Meal Plans       Saved Recipes
 |
 v
Grocery Items


Recipe
 |
 v
Recipe Ingredients

---

### 7.3 Users Table

The `users` table stores account-level information.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Unique user identifier |
| name | VARCHAR | NOT NULL | User's display name |
| email | VARCHAR | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR | NOT NULL | Secure password hash |
| role | VARCHAR | NOT NULL | Authorization role |
| created_at | TIMESTAMP | NOT NULL | Account creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

The application should never store a user's plaintext password.

The email field should have a unique constraint to prevent duplicate accounts.

---

### 7.4 Pantries Table

A pantry represents the inventory belonging to a user.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Pantry identifier |
| user_id | UUID | FK → users.id, UNIQUE | Owner of pantry |
| name | VARCHAR | NOT NULL | Pantry name |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

The MVP can use one primary pantry per user.

The unique constraint on `user_id` prevents accidental creation of multiple primary pantries for the same user.

The architecture can later support multiple pantries if the product requires it.

---

### 7.5 Pantry Items Table

The `pantry_items` table stores the ingredients currently available to a user.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Pantry item identifier |
| pantry_id | UUID | FK → pantries.id | Parent pantry |
| name | VARCHAR | NOT NULL | Ingredient name |
| quantity | DECIMAL | NOT NULL | Available quantity |
| unit | VARCHAR | NOT NULL | Quantity unit |
| expiry_date | DATE | NULL | Optional expiry date |
| purchase_date | DATE | NULL | Optional purchase date |
| storage_location | VARCHAR | NULL | Storage location |
| notes | TEXT | NULL | Additional information |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

Quantity must not be negative.

The backend should validate the unit and quantity before persisting the item.

---

### 7.6 Recipes Table

The `recipes` table stores recipe-level information.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Recipe identifier |
| name | VARCHAR | NOT NULL | Recipe name |
| description | TEXT | NULL | Recipe description |
| base_servings | INTEGER | NOT NULL | Original serving size |
| preparation_minutes | INTEGER | NOT NULL | Preparation time |
| cooking_minutes | INTEGER | NOT NULL | Cooking time |
| difficulty | VARCHAR | NULL | Difficulty level |
| estimated_cost | DECIMAL | NULL | Estimated cost |
| instructions | JSONB | NOT NULL | Ordered cooking instructions |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

Recipe instructions may be stored as structured JSON when the application needs ordered steps.

The exact representation will be finalized during implementation.

---

### 7.7 Recipe Ingredients Table

Recipe ingredients represent the ingredients required by a recipe.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Recipe ingredient identifier |
| recipe_id | UUID | FK → recipes.id | Parent recipe |
| name | VARCHAR | NOT NULL | Ingredient name |
| quantity | DECIMAL | NOT NULL | Required quantity |
| unit | VARCHAR | NOT NULL | Quantity unit |
| optional | BOOLEAN | NOT NULL | Whether ingredient is optional |
| created_at | TIMESTAMP | NOT NULL | Creation time |

This creates a one-to-many relationship:

Recipe
 |
 +-- Recipe Ingredient
 +-- Recipe Ingredient
 +-- Recipe Ingredient

---

### 7.8 Grocery Lists Table

A grocery list belongs to a user.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Grocery list identifier |
| user_id | UUID | FK → users.id | List owner |
| name | VARCHAR | NOT NULL | List name |
| status | VARCHAR | NOT NULL | Active/completed state |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

A user can have multiple grocery lists.

---

### 7.9 Grocery Items Table

Grocery items belong to a grocery list.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Grocery item identifier |
| grocery_list_id | UUID | FK → grocery_lists.id | Parent list |
| name | VARCHAR | NOT NULL | Ingredient/product name |
| quantity | DECIMAL | NOT NULL | Required quantity |
| unit | VARCHAR | NOT NULL | Quantity unit |
| purchased | BOOLEAN | NOT NULL | Purchase status |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

---

### 7.10 Meal Plans Table

A meal plan belongs to a user.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Meal plan identifier |
| user_id | UUID | FK → users.id | Plan owner |
| name | VARCHAR | NOT NULL | Meal plan name |
| start_date | DATE | NOT NULL | Plan start date |
| end_date | DATE | NOT NULL | Plan end date |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

---

### 7.11 Meal Plan Items Table

Meal plan items connect recipes to specific dates or meal slots.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Meal plan item identifier |
| meal_plan_id | UUID | FK → meal_plans.id | Parent meal plan |
| recipe_id | UUID | FK → recipes.id | Selected recipe |
| planned_date | DATE | NOT NULL | Planned cooking date |
| meal_type | VARCHAR | NOT NULL | Breakfast/lunch/dinner/etc. |
| servings | INTEGER | NOT NULL | Planned servings |
| created_at | TIMESTAMP | NOT NULL | Creation time |

This allows one meal plan to contain multiple planned meals.

---

### 7.12 User Preferences Table

User preferences store structured settings that influence recommendations.

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | PK | Preference identifier |
| user_id | UUID | FK → users.id, UNIQUE | Preference owner |
| dietary_preferences | JSONB | NULL | Dietary preferences |
| disliked_ingredients | JSONB | NULL | Ingredients to avoid |
| default_servings | INTEGER | NULL | Default serving count |
| default_budget | DECIMAL | NULL | Default meal budget |
| max_cooking_minutes | INTEGER | NULL | Preferred maximum cooking time |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

JSONB is used here because preference structures may evolve without requiring a separate relational table for every preference type.

---

### 7.13 Entity Relationships

The major relationships are:

users
  |
  +-- 1 : 1 -- pantries
  |              |
  |              +-- 1 : N -- pantry_items
  |
  +-- 1 : 1 -- user_preferences
  |
  +-- 1 : N -- grocery_lists
  |              |
  |              +-- 1 : N -- grocery_items
  |
  +-- 1 : N -- meal_plans
                 |
                 +-- 1 : N -- meal_plan_items
                                  |
                                  +-- N : 1 -- recipes
                                                  |
                                                  +-- 1 : N -- recipe_ingredients

---

### 7.14 Primary Keys

Every major entity will use a unique primary key.

UUIDs are preferred for application-level identifiers because they avoid exposing sequential database IDs and work well when resources may be generated across distributed systems in the future.

The exact UUID generation strategy will be finalized during implementation.

---

### 7.15 Foreign Keys

Foreign keys will enforce relationships between entities.

Examples:

- `pantries.user_id` → `users.id`
- `pantry_items.pantry_id` → `pantries.id`
- `grocery_lists.user_id` → `users.id`
- `grocery_items.grocery_list_id` → `grocery_lists.id`
- `meal_plans.user_id` → `users.id`
- `meal_plan_items.meal_plan_id` → `meal_plans.id`
- `meal_plan_items.recipe_id` → `recipes.id`
- `recipe_ingredients.recipe_id` → `recipes.id`

Foreign keys help prevent orphaned records and maintain referential integrity.

---

### 7.16 Cascading Rules

Delete behavior should be chosen carefully.

For dependent resources such as pantry items belonging to a pantry, cascading deletion may be appropriate.

For important historical data, automatic cascading deletion should be avoided where it could cause unintended data loss.

The final `ON DELETE` behavior will be defined for each relationship during database implementation.

---

### 7.17 Constraints

The database should enforce important invariants wherever practical.

Examples include:

- User email must be unique.
- Required fields cannot be NULL.
- Quantities cannot be negative.
- Serving counts must be greater than zero.
- Cooking time cannot be negative.
- Meal plan end date cannot precede start date.
- User-owned resources must reference valid users.

Validation should exist at both the application and database levels where appropriate.

---

### 7.18 Indexing Strategy

Indexes will be created based on actual query patterns.

Initial candidates include:

- `users.email`
- `pantries.user_id`
- `pantry_items.pantry_id`
- `pantry_items.expiry_date`
- `grocery_lists.user_id`
- `grocery_items.grocery_list_id`
- `meal_plans.user_id`
- `meal_plan_items.meal_plan_id`
- `meal_plan_items.planned_date`
- `recipe_ingredients.recipe_id`

The unique constraint on `users.email` will also provide an index suitable for login lookup.

Indexes should not be added indiscriminately because every additional index increases storage requirements and write overhead.

---

### 7.19 Pantry Expiry Query

A common query will identify ingredients that are approaching expiry.

Conceptually:

```sql
SELECT *
FROM pantry_items
WHERE pantry_id = ?
  AND expiry_date <= ?
ORDER BY expiry_date ASC;
```

The actual query implementation will be adapted to the selected database access library.

The database should be able to execute this efficiently using appropriate indexes.

---

### 7.20 Pantry Quantity Updates

Pantry quantity updates are important state-changing operations.

For example:

```text
Current Quantity = 5
Consumed Quantity = 2
New Quantity = 3
```

The backend should validate the current quantity before applying the update.

If multiple related pantry items must be updated as part of one cooking operation, a database transaction should be used.

---

### 7.21 Transactions

Transactions will be used when multiple database operations must succeed or fail together.

Example:

```text
Complete Cooking Session
        ↓
Validate Pantry Quantities
        ↓
Update Pantry Item 1
        ↓
Update Pantry Item 2
        ↓
Update Pantry Item 3
        ↓
Commit Transaction
```

If one required update fails:

```text
Update Failure
      ↓
Rollback
      ↓
No Partial Pantry Update
```

This protects inventory consistency.

---

### 7.22 SQL JOIN Usage

The application will use SQL JOINs when related information is required.

For example, retrieving a user's pantry items may conceptually involve:

```sql
SELECT *
FROM users
JOIN pantries ON pantries.user_id = users.id
JOIN pantry_items ON pantry_items.pantry_id = pantries.id;
```

Recipe retrieval may involve:

```sql
SELECT *
FROM recipes
JOIN recipe_ingredients
  ON recipe_ingredients.recipe_id = recipes.id;
```

JOINs allow related normalized data to be retrieved without duplicating the same information across multiple tables.

---

### 7.23 Normalization

The relational schema will generally follow normalization principles to reduce unnecessary duplication.

For example, recipe-level information should not be duplicated for every recipe ingredient.

Instead:

```text
Recipe
  │
  └── Recipe Ingredients
```

Similarly, grocery list information should be stored separately from individual grocery items.

Normalization may be relaxed only when a deliberate performance or usability requirement justifies controlled denormalization.

---

### 7.24 MongoDB Boundary

MongoDB is not the primary source of truth for PantryPal's core transactional data.

If MongoDB is used, its initial responsibility may include:

```text
MongoDB
   │
   ├── AI Conversation Documents
   ├── AI Interaction Metadata
   └── Flexible Recommendation Documents
```

Core records such as pantry quantities, users, grocery items, and meal plans remain in PostgreSQL.

This prevents application state from being unnecessarily distributed across multiple databases.

---

### 7.25 AI Data and PostgreSQL Data

The AI service may need information from PostgreSQL.

The flow is:

```text
User Request
     ↓
Backend
     ↓
PostgreSQL
     ↓
Relevant Pantry / Preference Data
     ↓
AI Service
     ↓
LLM
```

The AI provider does not receive direct database access.

The backend controls exactly which data is included in the AI request.

---

### 7.26 Database Access Boundary

Only backend services should communicate with the databases.

```text
React Frontend
      ↓
REST API
      ↓
Backend Services
      ↓
Database Access
      ↓
PostgreSQL / MongoDB
```

The frontend must never connect directly to PostgreSQL or MongoDB.

---

### 7.27 Database Design Principle

The database architecture follows:

> **Keep core transactional state in PostgreSQL, preserve clear relationships through relational constraints, and introduce document storage only when it provides a meaningful advantage.**

---

## 8. API Contracts

The PantryPal frontend communicates with the backend through a versioned REST API.

The API base path will be:

`/api/v1`

The backend is responsible for authentication, authorization, validation, business logic, database operations, and communication with external services.

The frontend communicates only with the PantryPal backend and never directly with PostgreSQL, MongoDB, or the external LLM provider.

---

### 8.1 API Contract Principles

The API will follow these principles:

- Use resource-oriented URLs.
- Use standard HTTP methods.
- Use appropriate HTTP status codes.
- Validate all incoming requests on the backend.
- Protect user-owned resources with authentication and authorization.
- Return consistent response structures.
- Avoid exposing internal implementation details.
- Keep business logic outside route definitions.
- Keep external service credentials on the backend.

---

### 8.2 Standard Success Response

Successful API responses should follow a consistent structure.

Example:

```json
{
  "success": true,
  "data": {}
}
```

For collection endpoints:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

The `meta` object will only be included for endpoints that support pagination or additional metadata.

---

### 8.3 Standard Error Response

API errors should follow a consistent structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

The API should not expose:

- Stack traces
- Database credentials
- API keys
- Internal file paths
- Sensitive implementation details

---

### 8.4 Authentication APIs

---

### 8.4.1 Register User

**Endpoint**

`POST /api/v1/auth/register`

**Authentication**

Not required.

**Purpose**

Creates a new PantryPal user account.

**Request Body**

```json
{
  "name": "Jatin",
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Validation**

The backend should validate:

- Name is present.
- Email has a valid format.
- Email is not already registered.
- Password satisfies the minimum security requirements.

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "Jatin",
      "email": "user@example.com"
    }
  }
}
```

The password or password hash must never be returned.

---

### 8.4.2 Login User

**Endpoint**

`POST /api/v1/auth/login`

**Authentication**

Not required.

**Purpose**

Authenticates an existing user.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Success Response**

**Status:** `200 OK`

The response will contain the authenticated session/token information according to the final authentication implementation.

Conceptually:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "Jatin",
      "email": "user@example.com"
    },
    "token": "authentication-token"
  }
}
```

The exact token delivery mechanism will be finalized during implementation based on the selected authentication approach.

---

### 8.4.3 Get Current User

**Endpoint**

`GET /api/v1/auth/me`

**Authentication**

Required.

**Purpose**

Returns information about the currently authenticated user.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "Jatin",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

---

### 8.4.4 Logout

**Endpoint**

`POST /api/v1/auth/logout`

**Authentication**

Required.

**Purpose**

Ends the current authenticated session.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

The exact implementation depends on the selected token/session strategy.

---

### 8.5 Pantry APIs

Pantry APIs manage the authenticated user's pantry and pantry items.

All pantry endpoints require authentication.

---

### 8.5.1 Get Pantry Items

**Endpoint**

`GET /api/v1/pantry/items`

**Authentication**

Required.

**Purpose**

Returns the pantry items belonging to the authenticated user.

**Query Parameters**

Optional:

- `page`
- `limit`
- `sort`
- `order`
- `expiryStatus`

Example:

`GET /api/v1/pantry/items?sort=expiryDate&order=asc`

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "item-id",
      "name": "Tomatoes",
      "quantity": 4,
      "unit": "pieces",
      "expiryDate": "2026-08-12",
      "storageLocation": "refrigerator"
    }
  ]
}
```

The backend must only return items belonging to the authenticated user's pantry.

---

### 8.5.2 Add Pantry Item

**Endpoint**

`POST /api/v1/pantry/items`

**Authentication**

Required.

**Purpose**

Adds an ingredient to the authenticated user's pantry.

**Request Body**

```json
{
  "name": "Tomatoes",
  "quantity": 4,
  "unit": "pieces",
  "expiryDate": "2026-08-12",
  "purchaseDate": "2026-08-08",
  "storageLocation": "refrigerator",
  "notes": "Use soon"
}
```

**Validation**

The backend should validate:

- Ingredient name is present.
- Quantity is greater than or equal to zero.
- Unit is supported.
- Dates are valid.
- Expiry date is not invalid relative to the purchase date where applicable.

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Tomatoes",
    "quantity": 4,
    "unit": "pieces",
    "expiryDate": "2026-08-12"
  }
}
```

---

### 8.5.3 Get Pantry Item

**Endpoint**

`GET /api/v1/pantry/items/:id`

**Authentication**

Required.

**Purpose**

Returns a specific pantry item.

**Authorization**

The item must belong to the authenticated user's pantry.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Tomatoes",
    "quantity": 4,
    "unit": "pieces",
    "expiryDate": "2026-08-12",
    "purchaseDate": "2026-08-08",
    "storageLocation": "refrigerator",
    "notes": "Use soon"
  }
}
```

---

### 8.5.4 Update Pantry Item

**Endpoint**

`PATCH /api/v1/pantry/items/:id`

**Authentication**

Required.

**Purpose**

Partially updates an existing pantry item.

**Request Body**

Any supported pantry fields may be updated.

Example:

```json
{
  "quantity": 2,
  "expiryDate": "2026-08-13"
}
```

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Tomatoes",
    "quantity": 2,
    "unit": "pieces",
    "expiryDate": "2026-08-13"
  }
}
```

The backend must verify resource ownership before updating the item.

---

### 8.5.5 Delete Pantry Item

**Endpoint**

`DELETE /api/v1/pantry/items/:id`

**Authentication**

Required.

**Purpose**

Removes a pantry item.

**Authorization**

The item must belong to the authenticated user's pantry.

**Success Response**

**Status:** `204 No Content`

The response body will be empty.

---

### 8.5.6 Pantry Expiry Items

The existing pantry listing endpoint may support expiry filtering.

Example:

`GET /api/v1/pantry/items?expiryStatus=expiring`

The backend determines expiry status using the stored expiry date.

Possible states include:

- `fresh`
- `expiring`
- `expired`

Expiry status should be calculated by application logic rather than by the LLM.

---

### 8.5.7 Pantry Quantity Update

Pantry quantity changes must be validated by the backend.

For example:

```text
Current Quantity = 5
Requested Consumption = 2
Remaining Quantity = 3
```

The backend must reject operations that would result in an invalid negative quantity.

If a quantity update is part of a larger operation, such as completing a cooking session, the update should participate in the relevant database transaction.

---

### 8.5.8 Pantry Authorization Rule

Every pantry operation follows:

```text
Request
   ↓
Authenticate User
   ↓
Identify Resource
   ↓
Check Resource Ownership
   ↓
Allow or Reject
```

If the resource does not belong to the authenticated user, the backend must not allow the operation.

The API should return an appropriate authorization or not-found response without revealing unnecessary information about another user's resources.

---

### 8.6 Recipe APIs

Recipe APIs provide recipe retrieval, recipe details, serving adjustments, and recipe-based pantry analysis.

Recipe recommendations that require AI processing will be handled through the AI service rather than directly from the route layer.

---

### 8.6.1 Get Recipes

**Endpoint**

`GET /api/v1/recipes`

**Authentication**

Required.

**Purpose**

Returns recipes available to the authenticated user.

**Query Parameters**

Optional:

- `page`
- `limit`
- `search`
- `difficulty`
- `maxCookingMinutes`
- `maxBudget`

Example:

`GET /api/v1/recipes?search=pasta&maxCookingMinutes=30`

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "recipe-id",
      "name": "Tomato Pasta",
      "baseServings": 2,
      "preparationMinutes": 10,
      "cookingMinutes": 20,
      "difficulty": "easy"
    }
  ]
}
```

---

### 8.6.2 Get Recipe Details

**Endpoint**

`GET /api/v1/recipes/:id`

**Authentication**

Required.

**Purpose**

Returns complete information about a recipe.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "recipe-id",
    "name": "Tomato Pasta",
    "description": "A simple pasta recipe",
    "baseServings": 2,
    "preparationMinutes": 10,
    "cookingMinutes": 20,
    "difficulty": "easy",
    "estimatedCost": 120,
    "ingredients": [
      {
        "name": "Pasta",
        "quantity": 200,
        "unit": "grams",
        "optional": false
      },
      {
        "name": "Tomato",
        "quantity": 2,
        "unit": "pieces",
        "optional": false
      }
    ],
    "instructions": [
      "Boil the pasta.",
      "Prepare the tomato sauce.",
      "Combine and serve."
    ]
  }
}
```

---

### 8.6.3 Adjust Recipe Servings

**Endpoint**

`POST /api/v1/recipes/:id/servings`

**Authentication**

Required.

**Purpose**

Adjusts ingredient quantities according to the requested number of servings.

**Request Body**

```json
{
  "servings": 4
}
```

**Example**

If the original recipe serves 2 people:

```text
Original Servings = 2
Requested Servings = 4
Multiplier = 4 / 2
```

The backend calculates the adjusted ingredient quantities.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "recipeId": "recipe-id",
    "servings": 4,
    "ingredients": [
      {
        "name": "Pasta",
        "quantity": 400,
        "unit": "grams"
      },
      {
        "name": "Tomato",
        "quantity": 4,
        "unit": "pieces"
      }
    ]
  }
}
```

Serving calculations must be deterministic and must not depend on the LLM.

---

### 8.7 AI Recommendation APIs

AI recommendation endpoints allow users to describe what they want to cook using natural language.

The backend remains responsible for gathering application data and controlling the AI request.

---

### 8.7.1 Generate Recipe Recommendation

**Endpoint**

`POST /api/v1/ai/recommendations`

**Authentication**

Required.

**Purpose**

Generates recipe recommendations using the user's pantry inventory and optional constraints.

**Request Body**

```json
{
  "prompt": "I want something quick and healthy for dinner",
  "servings": 2,
  "maxCookingMinutes": 30,
  "budget": 150
}
```

Additional constraints may include:

- Dietary preferences
- Ingredients to avoid
- Preferred cuisine
- Meal type
- Available cooking equipment

**Backend Processing Flow**

```text
User Request
     ↓
Authenticate User
     ↓
Validate Request
     ↓
Fetch Pantry Data
     ↓
Fetch User Preferences
     ↓
Build AI Context
     ↓
Generate Structured Prompt
     ↓
Call LLM
     ↓
Validate AI Response
     ↓
Normalize Recommendation
     ↓
Return Response
```

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "name": "Vegetable Tomato Pasta",
        "reason": "Uses ingredients already available in your pantry.",
        "servings": 2,
        "estimatedCookingMinutes": 25,
        "estimatedCost": 80,
        "ingredients": [
          {
            "name": "Pasta",
            "quantity": 200,
            "unit": "grams",
            "available": true
          },
          {
            "name": "Tomato",
            "quantity": 2,
            "unit": "pieces",
            "available": true
          }
        ]
      }
    ]
  }
}
```

The response must be validated before being returned to the frontend.

---

### 8.7.2 Ingredient Substitution

**Endpoint**

`POST /api/v1/ai/substitutions`

**Authentication**

Required.

**Purpose**

Suggests alternatives for an unavailable or disliked ingredient.

**Request Body**

```json
{
  "ingredient": "Butter",
  "recipeId": "recipe-id",
  "reason": "not available"
}
```

The backend may provide relevant pantry information and user preferences as context.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "ingredient": "Butter",
    "substitutions": [
      {
        "name": "Olive Oil",
        "quantity": 1,
        "unit": "tablespoon",
        "reason": "Suitable for the selected cooking method."
      }
    ]
  }
}
```

---

### 8.7.3 AI Response Validation

AI-generated data must be treated as untrusted external input.

The backend should validate:

- Required fields
- Data types
- Serving count
- Ingredient quantities
- Cooking time
- Estimated cost
- Response structure

Invalid AI responses should not be returned as valid application data.

Conceptually:

```text
LLM Response
     ↓
Schema Validation
     ↓
Valid?
  ┌──┴──┐
 YES    NO
  ↓      ↓
Return  Reject
Data    Response
```

---

### 8.7.4 AI Safety Boundary

The LLM must not directly perform application state mutations.

For example, the LLM cannot directly:

- Modify pantry quantities
- Delete pantry items
- Create grocery purchases
- Change user preferences
- Change authentication data

Instead:

```text
AI Recommendation
       ↓
Backend Validation
       ↓
User Confirmation
       ↓
Deterministic Backend Operation
       ↓
Database
```

This ensures AI remains an assistant rather than an uncontrolled system actor.

---

### 8.7.5 AI Failure Response

If the external AI provider fails, the backend should return a controlled error.

Example:

**Status:** `503 Service Unavailable`

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "Recipe recommendations are temporarily unavailable."
  }
}
```

The frontend should display a user-friendly message and provide a retry option where appropriate.

---

### 8.8 Grocery APIs

Grocery APIs manage shopping lists generated manually or from recipe and pantry requirements.

All grocery endpoints require authentication.

---

### 8.8.1 Get Grocery Lists

**Endpoint**

`GET /api/v1/grocery/lists`

**Authentication**

Required.

**Purpose**

Returns grocery lists belonging to the authenticated user.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "list-id",
      "name": "Weekly Grocery",
      "status": "active",
      "createdAt": "2026-08-09T10:00:00Z"
    }
  ]
}
```

---

### 8.8.2 Create Grocery List

**Endpoint**

`POST /api/v1/grocery/lists`

**Authentication**

Required.

**Request Body**

```json
{
  "name": "Weekly Grocery"
}
```

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "list-id",
    "name": "Weekly Grocery",
    "status": "active"
  }
}
```

---

### 8.8.3 Get Grocery Items

**Endpoint**

`GET /api/v1/grocery/lists/:listId/items`

**Authentication**

Required.

**Purpose**

Returns items belonging to a specific grocery list.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "item-id",
      "name": "Milk",
      "quantity": 2,
      "unit": "litres",
      "purchased": false
    }
  ]
}
```

---

### 8.8.4 Add Grocery Item

**Endpoint**

`POST /api/v1/grocery/lists/:listId/items`

**Authentication**

Required.

**Request Body**

```json
{
  "name": "Milk",
  "quantity": 2,
  "unit": "litres"
}
```

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Milk",
    "quantity": 2,
    "unit": "litres",
    "purchased": false
  }
}
```

---

### 8.8.5 Update Grocery Item

**Endpoint**

`PATCH /api/v1/grocery/items/:id`

**Authentication**

Required.

**Request Body**

```json
{
  "quantity": 3,
  "purchased": true
}
```

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Milk",
    "quantity": 3,
    "unit": "litres",
    "purchased": true
  }
}
```

The backend must verify that the grocery item belongs to a list owned by the authenticated user.

---

### 8.8.6 Delete Grocery Item

**Endpoint**

`DELETE /api/v1/grocery/items/:id`

**Authentication**

Required.

**Success Response**

**Status:** `204 No Content`

---

### 8.9 Meal Planning APIs

Meal planning allows users to organize recipes into planned meals.

---

### 8.9.1 Get Meal Plans

**Endpoint**

`GET /api/v1/meal-plans`

**Authentication**

Required.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "plan-id",
      "name": "Weekly Meal Plan",
      "startDate": "2026-08-10",
      "endDate": "2026-08-16"
    }
  ]
}
```

---

### 8.9.2 Create Meal Plan

**Endpoint**

`POST /api/v1/meal-plans`

**Authentication**

Required.

**Request Body**

```json
{
  "name": "Weekly Meal Plan",
  "startDate": "2026-08-10",
  "endDate": "2026-08-16"
}
```

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "plan-id",
    "name": "Weekly Meal Plan",
    "startDate": "2026-08-10",
    "endDate": "2026-08-16"
  }
}
```

---

### 8.9.3 Add Meal to Plan

**Endpoint**

`POST /api/v1/meal-plans/:planId/items`

**Authentication**

Required.

**Request Body**

```json
{
  "recipeId": "recipe-id",
  "plannedDate": "2026-08-12",
  "mealType": "dinner",
  "servings": 2
}
```

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "meal-item-id",
    "recipeId": "recipe-id",
    "plannedDate": "2026-08-12",
    "mealType": "dinner",
    "servings": 2
  }
}
```

---

### 8.9.4 Remove Meal From Plan

**Endpoint**

`DELETE /api/v1/meal-plans/:planId/items/:itemId`

**Authentication**

Required.

**Success Response**

**Status:** `204 No Content`

---

### 8.10 Cooking APIs

Cooking APIs support the active cooking experience and pantry consumption.

---

### 8.10.1 Start Cooking Session

**Endpoint**

`POST /api/v1/cooking/sessions`

**Authentication**

Required.

**Purpose**

Starts a cooking session for a selected recipe.

**Request Body**

```json
{
  "recipeId": "recipe-id",
  "servings": 2
}
```

**Success Response**

**Status:** `201 Created`

```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "recipeId": "recipe-id",
    "servings": 2,
    "status": "active"
  }
}
```

---

### 8.10.2 Get Cooking Session

**Endpoint**

`GET /api/v1/cooking/sessions/:id`

**Authentication**

Required.

**Purpose**

Returns the current state of a cooking session.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "recipeId": "recipe-id",
    "status": "active",
    "currentStep": 2,
    "totalSteps": 5
  }
}
```

---

### 8.10.3 Update Cooking Progress

**Endpoint**

`PATCH /api/v1/cooking/sessions/:id`

**Authentication**

Required.

**Request Body**

```json
{
  "currentStep": 3
}
```

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "currentStep": 3,
    "totalSteps": 5,
    "status": "active"
  }
}
```

---

### 8.10.4 Complete Cooking Session

**Endpoint**

`POST /api/v1/cooking/sessions/:id/complete`

**Authentication**

Required.

**Purpose**

Completes the cooking session and applies the corresponding pantry consumption.

The backend should:

1. Verify the cooking session.
2. Verify the authenticated user owns the session.
3. Determine ingredient consumption.
4. Validate pantry quantities.
5. Update pantry inventory.
6. Commit the transaction.
7. Mark the cooking session as completed.

Conceptually:

```text
Complete Cooking Session
          ↓
Validate Session
          ↓
Validate Pantry Quantities
          ↓
Begin Transaction
          ↓
Update Pantry Items
          ↓
Mark Session Completed
          ↓
Commit Transaction
```

If any required database operation fails, the transaction should be rolled back.

**Success Response**

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "status": "completed",
    "pantryUpdated": true
  }
}
```

---

### 8.11 Resource Ownership

All authenticated resources must follow the same ownership rule.

```text
Authenticated User
        ↓
Requested Resource
        ↓
Check Ownership
        ↓
Allowed / Rejected
```

A user must never be able to access or modify another user's:

- Pantry items
- Grocery lists
- Grocery items
- Meal plans
- Cooking sessions
- Private preferences
- Private AI interaction records

Authorization checks must be performed on the backend even if the frontend hides unauthorized resources.

---

### 8.12 API Versioning

The API uses a versioned base path:

`/api/v1`

Future breaking changes may be introduced through a new API version such as:

`/api/v2`

The existing version should remain stable for clients until a migration strategy is established.

---

### 8.13 API Documentation

The API contracts documented in this LLD will serve as the initial implementation reference.

During backend development, the API may additionally be documented using OpenAPI/Swagger.

The API documentation should remain synchronized with the implemented routes, request schemas, response schemas, and authentication requirements.

---

## 9. Authentication Implementation

PantryPal will use token-based authentication to identify authenticated users and protect private API resources.

Authentication will be handled entirely by the backend.

The frontend will provide credentials to the authentication endpoints and use the resulting authentication mechanism when communicating with protected APIs.

---

### 9.1 Authentication Goals

The authentication system should provide:

- Secure password storage
- User identity verification
- Protected API access
- Resource ownership enforcement
- Token expiration
- Secure logout
- Consistent authentication errors
- Protection against unauthorized access

---

### 9.2 Registration Flow

The registration flow will be:

```text
User
  ↓
Registration Form
  ↓
POST /api/v1/auth/register
  ↓
Validate Input
  ↓
Check Existing User
  ↓
Hash Password
  ↓
Create User
  ↓
Create Default Pantry
  ↓
Return User Information
```

Passwords must never be stored in plaintext.

The backend will hash the password before storing it in PostgreSQL.

---

### 9.3 Password Hashing

Passwords will be hashed using a dedicated password-hashing algorithm such as bcrypt or Argon2.

The plaintext password must never be stored in:

- PostgreSQL
- MongoDB
- Logs
- API responses
- Frontend local storage
- Error messages

During login, the submitted password will be compared against the stored password hash.

---

### 9.4 Login Flow

The login flow will be:

```text
User
  ↓
Login Form
  ↓
POST /api/v1/auth/login
  ↓
Validate Credentials
  ↓
Find User
  ↓
Compare Password Hash
  ↓
Generate Authentication Token
  ↓
Return Authentication Result
```

Invalid credentials should produce a generic authentication error rather than revealing whether the email or password was incorrect.

---

### 9.5 Token-Based Authentication

PantryPal will use token-based authentication for protected API requests.

The initial implementation will use a short-lived access token.

The token will represent the authenticated user's identity and will be verified by backend middleware before protected resources are accessed.

Example request:

```text
Authorization: Bearer <access-token>
```

The exact token library and signing configuration will be finalized during implementation.

---

### 9.6 Access Token Contents

The access token should contain only the minimum information required for authentication.

Conceptually:

```json
{
  "sub": "user-id",
  "role": "user"
}
```

Sensitive information such as passwords, API keys, or private user data must never be included in the token.

---

### 9.7 Token Expiration

Access tokens should have a limited lifetime.

A short expiration period reduces the impact of a compromised token.

The exact expiration duration will be configured through environment variables.

Example:

```text
JWT_EXPIRES_IN=15m
```

The actual production value may be adjusted after security and usability testing.

---

### 9.8 Authentication Middleware

Protected routes will use authentication middleware.

The middleware will:

1. Read the authentication token.
2. Verify the token signature.
3. Check token expiration.
4. Extract the user identity.
5. Attach the authenticated user context to the request.
6. Reject invalid authentication.

Conceptually:

```text
Incoming Request
       ↓
Authentication Middleware
       ↓
Token Present?
   ┌───┴───┐
  NO      YES
   ↓        ↓
401      Verify Token
            ↓
       Valid / Invalid
          ↓       ↓
        Continue  401
```

The middleware should not contain business-specific authorization logic.

---

### 9.9 Protected Routes

Protected resources will require authentication.

Examples include:

- Pantry APIs
- Grocery APIs
- Meal planning APIs
- Cooking APIs
- AI recommendation APIs
- Private recipe data
- User preferences

Public endpoints may include:

- Registration
- Login
- Health check

---

### 9.10 Authorization

Authentication confirms who the user is.

Authorization determines what the authenticated user is allowed to access or modify.

PantryPal will use resource-level authorization for user-owned data.

For example:

```text
Request
   ↓
Authenticate User
   ↓
Identify Resource
   ↓
Check Resource Ownership
   ↓
Allow / Reject
```

A user must only be able to access resources that belong to that user.

---

### 9.11 Resource Ownership

The following resources are user-owned:

- Pantry
- Pantry items
- Grocery lists
- Grocery items
- Meal plans
- Cooking sessions
- User preferences
- Private AI interaction records

Before performing an operation, the backend must verify that the requested resource belongs to the authenticated user.

For example:

```text
GET /api/v1/pantry/items/:id
        ↓
Authenticate User
        ↓
Find Pantry Item
        ↓
Verify pantry belongs to req.user.id
        ↓
Return Item
```

If ownership cannot be established, the operation must be rejected.

---

### 9.12 Role-Based Authorization

The initial application will use a simple role model.

Possible roles include:

- `user`
- `admin`

Regular users can manage their own application data.

Administrative functionality, if introduced, will require explicit authorization checks.

The role should not be trusted solely because it is provided by the frontend.

The backend should obtain the authenticated role from a trusted source such as the verified token or database.

---

### 9.13 Logout

Logout behavior depends on the selected token storage strategy.

For a stateless access-token implementation, the frontend will remove the active authentication credential when the user logs out.

If refresh tokens are introduced later, logout will additionally invalidate the relevant refresh token or session.

The backend must never rely solely on a frontend logout action for security-sensitive revocation requirements.

---

### 9.14 Authentication Errors

Authentication-related errors should use consistent HTTP responses.

Common cases include:

| Situation | Status |
|---|---:|
| Missing authentication | 401 |
| Invalid token | 401 |
| Expired token | 401 |
| Invalid credentials | 401 |
| Insufficient permissions | 403 |
| Resource ownership failure | 403 or 404 |

The exact response should avoid revealing sensitive information.

---

### 9.15 Brute-Force Protection

Authentication endpoints should be protected against repeated automated attempts.

Possible protections include:

- Rate limiting
- Request throttling
- Login attempt monitoring
- Temporary blocking after excessive failures

Rate limits should be configured conservatively and adjusted based on real usage.

---

### 9.16 Password Security Requirements

Passwords should satisfy minimum security requirements defined during implementation.

The backend should:

- Reject clearly invalid passwords.
- Hash passwords before storage.
- Never return passwords.
- Never log passwords.
- Never include passwords in tokens.
- Never send password hashes to the frontend.

Password hashing parameters should use secure defaults provided by the selected hashing library.

---

### 9.17 Secret Management

Authentication secrets must be stored using environment variables.

Examples include:

```text
JWT_SECRET
JWT_EXPIRES_IN
```

These values must not be committed to Git.

The repository should contain an `.env.example` file documenting required variables without containing real secrets.

---

### 9.18 Authentication Request Flow

A protected API request follows:

```text
Client
  ↓
HTTPS Request
  ↓
Authorization Header
  ↓
Authentication Middleware
  ↓
Token Verification
  ↓
Authenticated User Context
  ↓
Authorization Check
  ↓
Controller
  ↓
Service
  ↓
Database
```

Authentication and authorization must happen before sensitive business operations are executed.

---

### 9.19 Authentication Security Principle

The authentication architecture follows:

> **Authenticate every protected request, authorize every user-owned resource, and never trust security decisions made solely by the client.**

---

### 9.20 Future Authentication Enhancements

The initial implementation will remain intentionally simple.

Future improvements may include:

- Refresh tokens
- Session management
- Password reset
- Email verification
- OAuth providers
- Multi-factor authentication

These features should only be introduced if they become necessary for the product.

---

## 10. AI Service Design

The AI subsystem will be implemented as a dedicated backend service.

The frontend will never communicate directly with the external LLM provider.

The AI architecture follows:

```text
React Frontend
      ↓
REST API
      ↓
AI Controller
      ↓
AI Service
      ↓
Prompt Builder
      ↓
LLM Provider
      ↓
Structured Response
      ↓
Schema Validation
      ↓
Normalized Application Data
      ↓
Frontend
```

---

### 10.1 AI Responsibilities

The AI service may be responsible for:

- Natural-language meal requests
- Recipe recommendations
- Ingredient substitutions
- Recipe explanations
- Pantry-aware suggestions
- Meal planning suggestions

The AI service must not directly modify core application state.

---

### 10.2 AI Non-Responsibilities

The LLM should not be responsible for:

- Authentication
- Authorization
- Database access
- Pantry ownership
- Final quantity calculations
- Financial transactions
- Direct pantry mutations
- Direct grocery-list mutations

These responsibilities remain within deterministic backend logic.

---

### 10.3 AI Context Construction

The backend will construct a controlled context before calling the LLM.

Potential context includes:

- Relevant pantry items
- Available quantities
- Expiry information
- User preferences
- Dietary restrictions
- Requested servings
- Maximum cooking time
- Budget
- User's natural-language request

Only information necessary for the requested operation should be included.

---

### 10.4 AI Request Flow

```text
User Request
     ↓
Validate Input
     ↓
Authenticate User
     ↓
Fetch Relevant Data
     ↓
Construct AI Context
     ↓
Build Prompt
     ↓
Call LLM
     ↓
Validate Response
     ↓
Normalize Output
     ↓
Return to Client
```

---

### 10.5 Prompt Builder

Prompt construction should be isolated from route and controller logic.

A dedicated prompt-building component will transform application data into a controlled AI request.

Conceptually:

```text
User Request
     +
Pantry Context
     +
Preference Context
     +
Recipe Constraints
     ↓
Prompt Builder
     ↓
LLM Request
```

This makes prompts easier to test, modify, and version.

---

### 10.6 Structured AI Output

The AI provider should be instructed to return structured data whenever possible.

For example:

```json
{
  "recommendations": [
    {
      "name": "Vegetable Pasta",
      "servings": 2,
      "cookingTimeMinutes": 25,
      "estimatedCost": 80,
      "ingredients": [],
      "instructions": []
    }
  ]
}
```

The backend must validate this structure before using it.

---

### 10.7 AI Response Validation

AI output should be treated as untrusted external data.

Validation should check:

- Required fields
- Data types
- Numeric ranges
- Ingredient structure
- Serving count
- Cooking time
- Estimated cost
- Instruction structure

Invalid responses must be rejected or safely transformed.

---

### 10.8 AI Hallucination Handling

The system should minimize hallucination risk by providing relevant structured context and validating generated output.

For pantry-aware recommendations, the backend should distinguish between:

- Ingredients confirmed to exist in the pantry
- Ingredients suggested as additional purchases
- Ingredients that require substitution

The AI should not be treated as authoritative evidence that an ingredient exists in the user's pantry.

---

### 10.9 AI Cost Control

AI requests should be designed to minimize unnecessary usage.

The backend should:

- Send only relevant pantry data.
- Avoid duplicate requests.
- Validate requests before calling the provider.
- Limit unnecessary context.
- Apply request limits where appropriate.

Caching may be introduced later for suitable non-user-specific results.

---

### 10.10 AI Failure Handling

If the LLM provider fails:

```text
LLM Request
     ↓
Provider Failure
     ↓
AI Service Error
     ↓
Central Error Handler
     ↓
Safe API Response
```

The failure must not modify pantry or other transactional data.

---

### 10.11 AI Security Boundary

The AI provider must never receive:

- Passwords
- Authentication tokens
- Database credentials
- API keys
- Unnecessary personal information

The backend controls the exact payload sent to the external provider.

---

### 10.12 AI Service Principle

The AI architecture follows:

> **Use AI for flexible reasoning and generation, while keeping security, validation, state management, and critical calculations under deterministic backend control.**

---

## 11. Validation and Error Handling

PantryPal will use layered validation and centralized error handling.

The goal is to prevent invalid data from entering business logic, provide useful feedback to users, and avoid exposing sensitive implementation details.

---

### 11.1 Validation Layers

Validation will occur at multiple boundaries:

```text
User Input
    ↓
Frontend Validation
    ↓
HTTP Request
    ↓
Backend Request Validation
    ↓
Business Logic Validation
    ↓
Database Constraints
```

Each layer has a different responsibility.

Frontend validation improves user experience.

Backend validation is authoritative.

Database constraints protect data integrity.

---

### 11.2 Frontend Validation

The frontend should validate obvious input errors before sending requests.

Examples include:

- Required fields
- Email format
- Password format
- Positive quantities
- Valid dates
- Valid serving counts
- Required recipe information

Frontend validation should provide immediate feedback.

However, frontend validation must never replace backend validation.

---

### 11.3 Backend Validation

Every external request entering the backend should be validated before reaching business logic.

Potential validation libraries include:

- Zod
- Joi
- express-validator

The final library will be selected during implementation based on compatibility and simplicity.

Validation schemas should be organized inside:

`backend/src/validators/`

Example:

```text
validators/
├── authValidator.js
├── pantryValidator.js
├── recipeValidator.js
├── groceryValidator.js
├── mealValidator.js
└── aiValidator.js
```

---

### 11.4 Validation Responsibility

Validation should verify the structure and basic correctness of incoming data.

Examples:

```text
quantity >= 0
servings > 0
email has valid format
required name exists
date has valid format
```

Business rules should remain in the service layer.

For example:

```text
Validator
   ↓
"quantity must be >= 0"
```

while:

```text
Service
   ↓
"User cannot consume more pantry quantity than available"
```

This separation keeps validation reusable and business logic testable.

---

### 11.5 Validation Error Response

Invalid requests should return a consistent response.

**Status:** `400 Bad Request`

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "fields": {
      "quantity": "Quantity must be greater than or equal to zero"
    }
  }
}
```

The exact response shape will remain consistent across API modules.

---

### 11.6 Business Rule Validation

Business rules should be validated inside services.

Examples include:

- Pantry quantity cannot become negative.
- User cannot modify another user's pantry item.
- Meal cannot be added outside a meal plan's valid date range.
- Cooking session cannot be completed twice.
- A recipe cannot be assigned an invalid serving count.
- Grocery item must belong to the user's grocery list.

Business validation should happen before state-changing database operations.

---

### 11.7 Database Validation

The database should enforce critical invariants wherever practical.

Examples include:

- NOT NULL constraints
- UNIQUE constraints
- Foreign keys
- CHECK constraints
- Valid data types

Application-level validation provides better user feedback, while database constraints provide a final integrity boundary.

---

### 11.8 Validation Flow

A typical request follows:

```text
HTTP Request
     ↓
Authentication
     ↓
Request Validation
     ↓
Controller
     ↓
Service Validation
     ↓
Database Operation
```

A failure at any stage should stop the operation before an invalid state is persisted.

---

### 11.9 Error Classification

Application errors should be categorized.

Common categories include:

| Error Category | Example | HTTP Status |
|---|---|---:|
| Validation | Invalid quantity | 400 |
| Authentication | Missing/invalid token | 401 |
| Authorization | Resource not owned | 403 |
| Not Found | Recipe does not exist | 404 |
| Conflict | Duplicate email | 409 |
| Rate Limit | Too many requests | 429 |
| External Service | AI provider unavailable | 503 |
| Internal Error | Unexpected server failure | 500 |

The exact error codes will be defined during implementation.

---

### 11.10 Custom Application Errors

The backend should use a custom application error abstraction for expected failures.

Conceptually:

```text
AppError
├── statusCode
├── code
├── message
└── optional details
```

Expected application errors can then be handled consistently by centralized middleware.

---

### 11.11 Central Error Middleware

Express will use centralized error-handling middleware.

The flow will be:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Error
  ↓
Central Error Middleware
  ↓
Log Error
  ↓
Safe API Response
```

Controllers and services should not repeatedly implement the same response formatting logic.

---

### 11.12 Unexpected Errors

Unexpected errors should return a generic response to the client.

Example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong"
  }
}
```

Detailed stack traces should only be available through controlled development logging.

Production clients must not receive internal stack traces.

---

### 11.13 Error Logging

Errors should be logged with enough context to support debugging.

Potential information includes:

- Timestamp
- Request ID
- HTTP method
- Route
- Status code
- Error code
- Execution duration

Sensitive information must not be logged.

Passwords, tokens, API keys, and database credentials must never appear in logs.

---

### 11.14 Request Identification

The backend may assign a unique request identifier to incoming requests.

Example:

```text
Request ID
    ↓
Controller
    ↓
Service
    ↓
Error
    ↓
Log
```

This makes it easier to trace a failed request across application logs.

---

### 11.15 Error Handling Principle

The validation and error-handling architecture follows:

> **Reject invalid data early, enforce business rules centrally, protect database integrity, and return safe and predictable API errors.**

---

### 11.16 Database Failure Handling

Database operations may fail because of connection issues, timeouts, constraint violations, or unexpected database errors.

The backend should handle these failures centrally.

```text
Service
   ↓
Database Operation
   ↓
Failure
   ↓
Error Classification
   ↓
Central Error Handler
   ↓
Safe API Response
```

Database errors should not expose SQL queries, connection strings, database credentials, or internal infrastructure details to the client.

---

### 11.17 Transaction Failure Handling

Operations that modify multiple related records should use transactions where consistency is required.

For example, completing a cooking session may involve:

1. Validating pantry quantities.
2. Updating multiple pantry items.
3. Marking the cooking session as completed.

If any required operation fails:

```text
Transaction Started
      ↓
Operation 1
      ↓
Operation 2
      ↓
Operation 3 Fails
      ↓
Rollback
      ↓
Return Error
```

No partial state should be committed.

---

### 11.18 External Service Failure

PantryPal depends on external services such as the LLM provider.

External service failures may include:

- Timeout
- Rate limit
- Provider outage
- Invalid provider response
- Network failure

The backend should convert these failures into controlled application errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_SERVICE_ERROR",
    "message": "The requested service is temporarily unavailable."
  }
}
```

---

### 11.19 Timeout Handling

External requests should use configured timeouts.

A request that exceeds the timeout should be terminated rather than remaining open indefinitely.

Conceptually:

```text
Backend
   ↓
External Service
   ↓
Response within timeout?
   ├── Yes → Continue
   └── No  → Cancel → Handle Error
```

Timeout values should be configurable through environment variables.

---

### 11.20 Retry Strategy

Retries may be used for transient failures.

Retries should be:

- Limited
- Delayed appropriately
- Applied only to retryable failures

Examples of potentially retryable failures:

- Temporary network failure
- Temporary provider outage
- Some rate-limit responses

Examples that should generally not be retried:

- Invalid user input
- Authentication failure
- Authorization failure
- Invalid AI response caused by malformed application data

The initial implementation should keep retry behavior simple and bounded.

---

### 11.21 AI Failure Handling

If an AI request fails, the failure should remain isolated from core application state.

```text
AI Request
    ↓
Failure
    ↓
AI Service
    ↓
Controlled Error
    ↓
Frontend Retry Option
```

A failed AI request must not modify:

- Pantry quantities
- Grocery items
- Meal plans
- User preferences
- Cooking sessions

---

### 11.22 AI Invalid Response Handling

An LLM may return an incomplete or invalid response.

The backend should validate the response before using it.

```text
LLM Response
     ↓
Schema Validation
     ↓
Valid?
  ┌──┴──┐
 YES    NO
  ↓      ↓
Return  Reject
Data    Response
```

Invalid responses should not be silently converted into trusted application data.

---

### 11.23 Frontend Error States

The frontend should provide appropriate states for API failures.

Common states include:

- Loading
- Success
- Empty
- Error
- Retry
- Offline/unavailable

For example:

```text
Loading
   ↓
Request
   ├── Success → Display Data
   └── Failure → Display Error + Retry
```

---

### 11.24 User-Friendly Error Messages

Frontend messages should describe what the user can do next.

Instead of exposing:

`ECONNREFUSED 127.0.0.1:5000`

the application should display something such as:

> "We couldn't connect to PantryPal right now. Please try again."

Technical details should remain in controlled logs.

---

### 11.25 Graceful Degradation

Optional services should not unnecessarily break core functionality.

For example, if the AI service is unavailable:

```text
AI unavailable
     ↓
Pantry Management      → Continue
Grocery Management     → Continue
Existing Recipes       → Continue
Meal Plans             → Continue
AI Recommendations     → Temporarily unavailable
```

This prevents the AI provider from becoming a single point of failure for the entire application.

---

### 11.26 Offline and Network Failures

The frontend should detect failed network requests where practical and provide a clear retry path.

The application should not assume that every request reaches the backend successfully.

For state-changing operations, the frontend should avoid blindly repeating a request when doing so could create duplicate records.

---

### 11.27 Duplicate Request Protection

State-changing operations should be designed carefully to reduce accidental duplicate operations.

Potentially sensitive operations include:

- Creating grocery items
- Creating meal plans
- Starting cooking sessions
- Completing cooking sessions

Where required, the backend may use idempotency keys or resource-state checks.

For example, a completed cooking session should not be completed a second time.

---

### 11.28 Error Boundary

The React application should use an error boundary around appropriate parts of the application.

An unexpected rendering error should display a recovery UI rather than causing the entire application to become unusable.

Example:

```text
React Application
      ↓
Component Error
      ↓
Error Boundary
      ↓
Fallback UI
      ↓
Retry / Navigate Back
```

---

### 11.29 Health Check

The backend should expose a health endpoint:

`GET /api/v1/health`

A basic response may be:

```json
{
  "success": true,
  "data": {
    "status": "healthy"
  }
}
```

The endpoint should remain lightweight.

Future implementations may extend health checks to verify required dependencies.

---

### 11.30 Reliability Principle

The application follows:

> **Core functionality should remain usable even when optional external services fail, while failed operations must never leave the system in an inconsistent state.**

---

## 12. State Management

PantryPal will separate local UI state, shared client state, and server state.

The frontend should avoid placing all application data into one global state store.

---

### 12.1 State Categories

The main state categories are:

- Local UI state
- Authentication state
- Server state
- Temporary form state
- Application preferences

---

### 12.2 Local UI State

Local component state should be used for temporary UI concerns.

Examples include:

- Modal visibility
- Dropdown state
- Active tab
- Form input
- Loading indicator
- Current recipe step

These states do not need to be globally accessible.

---

### 12.3 Authentication State

Authentication state may be shared across the application.

Potential information includes:

- Authenticated user
- Authentication status
- Login state
- Logout action

The implementation may use React Context or a dedicated state-management solution depending on complexity.

---

### 12.4 Server State

Server-owned data includes:

- Pantry items
- Recipes
- Grocery lists
- Meal plans
- Cooking sessions
- User preferences

Server state should not be treated as permanent frontend-owned data.

A data-fetching solution such as TanStack Query may be introduced to manage:

- Fetching
- Caching
- Refetching
- Loading states
- Error states
- Request invalidation

The exact library will be finalized during implementation.

---

### 12.5 Form State

Forms should generally keep their temporary values locally.

Examples include:

- Login form
- Pantry item form
- Grocery item form
- AI recommendation form
- Meal plan form

Form validation should occur on the client for immediate feedback and again on the backend for security and correctness.

---

### 12.6 State Update Flow

For server-owned data:

```text
User Action
    ↓
Frontend Service
    ↓
Backend API
    ↓
Database
    ↓
API Response
    ↓
Update / Invalidate Server State
    ↓
UI Re-render
```

The frontend should avoid manually maintaining duplicated copies of server data when a reliable server-state mechanism can be used.

---

### 12.7 Pantry State Example

When a pantry item is consumed:

```text
User
 ↓
Complete Cooking Session
 ↓
Backend Transaction
 ↓
Pantry Updated
 ↓
API Response
 ↓
Invalidate Pantry Query
 ↓
Fetch Latest Pantry State
 ↓
Update UI
```

This keeps the displayed pantry state aligned with the database.

---

### 12.8 State Management Principle

The frontend follows:

> **Keep temporary UI state local, keep authentication state shared, and treat server data as server-owned state.**

---

## 13. Testing Strategy

PantryPal will use automated testing to verify application behavior and reduce regressions during development.

Testing will be introduced alongside feature implementation rather than being postponed until the end of the project.

The testing strategy will cover both frontend and backend behavior.

---

### 13.1 Testing Goals

The testing strategy should verify:

- Business logic correctness
- API behavior
- Input validation
- Authentication and authorization
- Database interactions
- AI service behavior
- Frontend component behavior
- Error handling
- Important user flows

---

### 13.2 Testing Pyramid

The project will generally follow a testing pyramid:

```text
          End-to-End Tests
              /\
             /  \
            /    \
      Integration Tests
          /        \
         /          \
        /____________\
        Unit Tests
```

The majority of tests should remain fast unit tests.

Integration tests will verify important interactions between application components.

End-to-end tests will be limited to critical user journeys.

---

### 13.3 Backend Unit Tests

Backend unit tests will verify isolated functions and services.

Potential unit-test targets include:

- Utility functions
- Validators
- Authentication helpers
- Pantry calculations
- Serving calculations
- Grocery calculations
- Business-rule functions
- Prompt builders
- AI response normalizers

Unit tests should avoid unnecessary external dependencies.

---

### 13.4 Backend Integration Tests

Integration tests will verify interactions between multiple application layers.

Examples include:

- API route → controller → service
- Service → database
- Authentication middleware → protected route
- Pantry service → database
- Cooking service → pantry transaction

Integration tests should use a controlled test database or isolated test environment.

---

### 13.5 API Testing

Important API endpoints should have automated tests.

Examples include:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/pantry/items
POST   /api/v1/pantry/items
PATCH  /api/v1/pantry/items/:id
DELETE /api/v1/pantry/items/:id

GET    /api/v1/recipes
GET    /api/v1/recipes/:id
POST   /api/v1/recipes/:id/servings

POST   /api/v1/ai/recommendations

GET    /api/v1/grocery/lists
POST   /api/v1/grocery/lists

GET    /api/v1/meal-plans
POST   /api/v1/meal-plans

POST   /api/v1/cooking/sessions
POST   /api/v1/cooking/sessions/:id/complete
```

Tests should verify both successful and unsuccessful requests.

---

### 13.6 Authentication Tests

Authentication tests should cover:

- Successful registration
- Duplicate email
- Invalid email
- Weak password
- Successful login
- Invalid credentials
- Missing token
- Invalid token
- Expired token
- Access to protected routes
- Logout behavior

Passwords must never appear in test output or logs.

---

### 13.7 Authorization Tests

Authorization tests should verify that users cannot access another user's resources.

For example:

```text
User A
  ↓
Requests User B's Pantry Item
  ↓
Authorization Check
  ↓
Request Rejected
```

Tests should cover:

- Pantry ownership
- Grocery-list ownership
- Meal-plan ownership
- Cooking-session ownership
- User preference ownership

This is one of the most important security test categories in the application.

---

### 13.8 AI Service Tests

AI functionality should be tested without depending on live LLM responses for every automated test.

The AI service should be separated into testable responsibilities such as:

- Prompt construction
- Context construction
- Response parsing
- Response validation
- Error handling
- Retry behavior

For unit tests, the external LLM provider should be mocked.

Example:

```text
Application
    ↓
AI Service
    ↓
Mock LLM Provider
    ↓
Controlled Response
    ↓
Validation
```

Tests should include:

- Valid structured response
- Missing required fields
- Invalid data types
- Invalid serving count
- Invalid cooking time
- Malformed provider response
- Provider timeout
- Provider failure
- Empty recommendation result

Live LLM calls should be limited to manual or dedicated integration tests because they may introduce cost, latency, and nondeterministic output.

---

### 13.9 Database Tests

Database-related tests should verify:

- Record creation
- Record retrieval
- Record updates
- Record deletion
- Foreign-key relationships
- Unique constraints
- Quantity constraints
- Transaction behavior
- Rollback behavior

Important transactional behavior should be explicitly tested.

For example:

```text
Cooking Session
      ↓
Pantry Update 1
      ↓
Pantry Update 2
      ↓
Failure
      ↓
Rollback
      ↓
Original Pantry State
```

The test should verify that partial updates are not persisted.

---

### 13.10 Validation Tests

Validation schemas should have dedicated tests.

Examples include:

- Missing required fields
- Invalid data types
- Negative quantities
- Zero servings
- Invalid dates
- Invalid email
- Invalid request parameters

Both valid and invalid inputs should be tested.

---

### 13.11 Frontend Unit Tests

Frontend tests should verify reusable components and important UI behavior.

Potential targets include:

- PantryItemCard
- RecipeCard
- GroceryItem
- Forms
- Loading states
- Error states
- Empty states
- Authentication components

Tests should focus on observable user behavior rather than implementation details.

---

### 13.12 Frontend Integration Tests

Frontend integration tests may verify flows such as:

```text
Login Form
    ↓
Authentication Request
    ↓
Successful Response
    ↓
Authenticated UI
```

and:

```text
Pantry Form
    ↓
Submit
    ↓
API Request
    ↓
Successful Response
    ↓
Updated Pantry UI
```

API calls should be mocked when the purpose of the test is frontend behavior.

---

### 13.13 End-to-End Tests

A limited number of end-to-end tests may cover critical user journeys.

Potential flows include:

1. Register account
2. Login
3. Add pantry item
4. Request recipe recommendation
5. Select recipe
6. Start cooking
7. Complete cooking session
8. Verify pantry quantity update

Another important flow is:

```text
Login
  ↓
Create Grocery List
  ↓
Add Grocery Item
  ↓
Mark Item Purchased
  ↓
Verify Updated List
```

End-to-end testing should remain focused on critical flows because these tests are slower and more expensive to maintain.

---

### 13.14 Test Database

Automated backend tests should use a dedicated test database or isolated test environment.

Production data must never be used for automated testing.

The test environment should provide:

- Isolated database
- Test credentials
- Test-specific environment variables
- Controlled external-service mocks

Test data should be created and cleaned up as part of the test lifecycle.

---

### 13.15 Test Data Strategy

Tests should use predictable and isolated test data.

Sensitive or real user information must not be used.

Factories or fixtures may be introduced for commonly required records.

Examples include:

```text
User Factory
Pantry Factory
Pantry Item Factory
Recipe Factory
Grocery List Factory
Meal Plan Factory
```

Factories reduce duplication across tests and make test setup easier to maintain.

---

### 13.16 Test Naming

Tests should describe the behavior they verify.

Good example:

```text
should reject pantry quantity when it would become negative
```

Another example:

```text
should prevent a user from accessing another user's pantry item
```

Test names should make failures understandable without reading the implementation.

---

### 13.17 Code Coverage

Code coverage will be used as a quality indicator rather than the only measure of test quality.

The project should prioritize coverage of:

- Authentication
- Authorization
- Pantry calculations
- Inventory mutations
- AI response validation
- API validation
- Critical business logic

A high coverage percentage should not be pursued by writing meaningless tests.

---

### 13.18 Continuous Integration Testing

Before a feature is merged into `main`, automated checks should run.

The conceptual workflow is:

```text
Pull Request
     ↓
Install Dependencies
     ↓
Lint
     ↓
Run Unit Tests
     ↓
Run Integration Tests
     ↓
Build Application
     ↓
Pass / Fail
```

A pull request should not be considered ready for merge if required automated checks fail.

---

### 13.19 Test Environment Separation

The project should maintain separate configurations for:

- Development
- Testing
- Production

Example:

```text
.env
.env.test
.env.example
```

Actual secret files must remain ignored by Git.

The exact environment-variable strategy will be finalized during implementation.

---

### 13.20 Testing Principle

The testing strategy follows:

> **Test critical behavior, isolate external dependencies, verify security boundaries, and prefer meaningful tests over raw coverage numbers.**

---

## 14. Environment Configuration

PantryPal will use environment variables for configuration values, secrets, and environment-specific settings.

Sensitive configuration must never be hardcoded into application source code.

---

### 14.1 Environment Types

The application will support three primary environments:

```text
Development
Testing
Production
```

Each environment may use different:

- Database connections
- API keys
- Authentication secrets
- API URLs
- Logging configuration
- External service configuration

---

### 14.2 Development Environment

The development environment is used for local application development.

Typical configuration may include:

- Local frontend development server
- Local backend server
- Development database
- Development LLM API credentials
- Development authentication secrets
- Debug-friendly logging

Development secrets must still remain outside Git.

---

### 14.3 Testing Environment

The testing environment is isolated from development and production.

It should use:

- Dedicated test database
- Test authentication secrets
- Mocked or test-specific external services
- Test-specific API configuration

Production credentials must never be used during automated testing.

---

### 14.4 Production Environment

The production environment contains the deployed application configuration.

Production configuration may include:

- Production database URL
- Production authentication secret
- LLM provider API key
- Frontend API URL
- Backend configuration
- Production logging configuration

Production secrets must be stored using the deployment platform's secure environment-variable mechanism.

---

### 14.5 Environment Files

The repository may contain:

```text
.env
.env.test
.env.example
```

Actual `.env` files containing secrets must be ignored by Git.

The `.env.example` file should contain variable names and safe placeholder values.

Example:

```text
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
LLM_API_KEY=
PORT=
FRONTEND_URL=
NODE_ENV=
```

No real credentials should ever be placed in `.env.example`.

---

### 14.6 Environment Variable Categories

Environment variables can be grouped into:

#### Application Configuration

```text
NODE_ENV
PORT
```

#### Database Configuration

```text
DATABASE_URL
```

#### Authentication Configuration

```text
JWT_SECRET
JWT_EXPIRES_IN
```

#### AI Configuration

```text
LLM_API_KEY
LLM_MODEL
LLM_TIMEOUT
```

#### Frontend Configuration

```text
FRONTEND_URL
```

The exact variable names may be adjusted during implementation.

---

### 14.7 Secret Management

Secrets include:

- Database credentials
- JWT signing secrets
- LLM API keys
- External service credentials

Secrets must:

- Never be committed to Git
- Never be included in frontend source code
- Never be logged
- Never be included in API responses
- Be stored using secure deployment configuration

---

### 14.8 Frontend Environment Variables

Only non-sensitive configuration may be exposed to the frontend.

For example:

```text
VITE_API_BASE_URL
```

The frontend must never receive:

- Database credentials
- JWT signing secrets
- LLM API keys
- Private backend credentials

Frontend environment variables should be treated as publicly accessible because they can be included in the browser bundle.

---

### 14.9 Backend Configuration Module

Backend environment variables should be loaded and validated through a centralized configuration module.

Conceptually:

```text
Environment Variables
        ↓
Configuration Module
        ↓
Validation
        ↓
Application
```

The application should fail fast during startup if required production configuration is missing.

---

### 14.10 Configuration Validation

Required environment variables should be validated when the backend starts.

For example:

```text
DATABASE_URL       → Required
JWT_SECRET         → Required
LLM_API_KEY        → Required for AI features
PORT               → Optional with default
NODE_ENV           → Required / defaulted
```

A missing required variable should produce a clear startup error.

Sensitive values should not be printed in the error message.

---

### 14.11 Environment Isolation

Configuration must remain environment-specific.

```text
Development
     ↓
Development Database
     +
Development Secrets

Testing
     ↓
Test Database
     +
Test Secrets

Production
     ↓
Production Database
     +
Production Secrets
```

No environment should accidentally use another environment's credentials or database.

---

### 14.12 Git Protection

The `.gitignore` file must prevent sensitive environment files from being committed.

At minimum:

```text
.env
.env.*
!.env.example
```

This allows the safe example configuration to remain version-controlled while keeping actual secrets private.

---

### 14.13 Environment Configuration Principle

The configuration architecture follows:

> **Keep secrets outside source control, expose only necessary configuration to the frontend, and validate required backend configuration before startup.**

---

### 14.14 Docker Configuration

Docker may be introduced to provide a consistent development and deployment environment.

The initial application may use separate containers for:

- Frontend
- Backend
- PostgreSQL
- MongoDB, if required

The exact container configuration will be finalized after the core application is stable.

---

### 14.15 Docker Compose

For local development, Docker Compose may be used to coordinate application dependencies.

Conceptually:

```text
Docker Compose
      |
      +-- Frontend
      |
      +-- Backend
      |
      +-- PostgreSQL
      |
      +-- MongoDB (optional)
```

Docker Compose should simplify starting the local development environment without changing application behavior.

---

### 14.16 Local Development Flow

The expected local development flow is:

```text
Clone Repository
      ↓
Install Dependencies
      ↓
Configure Environment Variables
      ↓
Start Database Services
      ↓
Start Backend
      ↓
Start Frontend
      ↓
Open Application
```

The project documentation should provide the exact commands required to start the application.

---

### 14.17 Backend Configuration Loading

The backend should load configuration during application startup.

The configuration process is:

```text
Environment
    ↓
Load Variables
    ↓
Validate Configuration
    ↓
Create Application Config
    ↓
Start Server
```

Configuration should not be read directly from `process.env` throughout the entire codebase.

A centralized configuration module should expose validated values to the rest of the application.

---

### 14.18 Frontend Configuration Loading

The frontend should use build-time environment variables for non-sensitive configuration.

The primary example is the backend API URL.

```text
Frontend Environment
        ↓
VITE_API_BASE_URL
        ↓
API Client
        ↓
Backend
```

The frontend must not contain backend-only secrets.

---

### 14.19 API Base URL

The frontend should use a configurable API base URL.

Example:

```text
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Production configuration will point to the deployed backend API.

This prevents API URLs from being hardcoded throughout the frontend application.

---

### 14.20 Deployment Configuration

The deployment environment should provide configuration through secure environment variables.

The deployment process is conceptually:

```text
Git Repository
      ↓
Build
      ↓
Install Dependencies
      ↓
Load Deployment Configuration
      ↓
Run Tests
      ↓
Build Application
      ↓
Deploy
```

The exact deployment platform will be selected during implementation.

---

### 14.21 Production Configuration Rules

Production configuration should:

- Use production databases.
- Use strong authentication secrets.
- Use production API credentials.
- Disable development-only debugging.
- Use appropriate logging.
- Restrict CORS to trusted frontend origins.
- Avoid exposing sensitive configuration.

---

### 14.22 CORS Configuration

The backend should restrict cross-origin requests to trusted frontend origins.

Development may allow:

```text
http://localhost:5173
```

Production should use the deployed frontend origin.

The allowed origins should be configurable through environment variables.

Example:

```text
FRONTEND_URL=https://example.com
```

The backend should not use unrestricted CORS in production.

---

### 14.23 Environment Startup Checks

The backend should perform startup checks before accepting requests.

Potential checks include:

- Required environment variables exist.
- Database configuration is valid.
- Required external-service configuration is available.
- Application configuration is internally consistent.

If a critical configuration is missing, the server should fail fast instead of starting in a broken state.

---

### 14.24 Environment Configuration Principle

The deployment configuration follows:

> **The same application code should be able to run across development, testing, and production by changing configuration rather than changing source code.**

---

## 15. Deployment Architecture

PantryPal will use a separated deployment architecture for the frontend and backend.

The initial deployment architecture is:

```text
                         Internet
                            |
                            v
                  +-------------------+
                  |  React Frontend   |
                  |    Deployment     |
                  +---------+---------+
                            |
                         HTTPS
                            |
                            v
                  +-------------------+
                  | Express Backend   |
                  |    Deployment     |
                  +----+---------+----+
                       |         |
                       |         |
                       v         v
               +-----------+  +-----------+
               | PostgreSQL|  | MongoDB   |
               | Database  |  | Optional  |
               +-----------+  +-----------+
                       |
                       |
                       v
                +-------------+
                | LLM Provider|
                +-------------+
```

---

### 15.1 Frontend Deployment

The React frontend will be built into production assets and deployed using a frontend hosting platform.

The frontend deployment should provide:

- HTTPS
- Production build
- Environment variable configuration
- SPA routing support
- CDN or static asset delivery where available

The exact hosting platform will be selected during implementation.

---

### 15.2 Backend Deployment

The Express backend will run as a server-side application.

The backend deployment should provide:

- HTTPS
- Environment variables
- Database connectivity
- Health checks
- Application logging
- Automatic restart or recovery
- Production configuration

---

### 15.3 Database Deployment

PostgreSQL should use a managed or production-ready database service.

The production database should provide:

- Secure connections
- Authentication
- Backups where available
- Access control
- Monitoring
- Appropriate resource limits

MongoDB will only be deployed if it is actually required by the implemented application.

---

### 15.4 External AI Service

The backend communicates with the external LLM provider.

```text
Backend
   ↓
Authenticated API Request
   ↓
LLM Provider
   ↓
Structured AI Response
   ↓
Backend Validation
```

The frontend never stores or uses the LLM provider API key.

---

### 15.5 HTTPS

All production communication should use HTTPS.

This includes:

```text
Browser → Frontend
Browser → Backend
Backend → External Services
Backend → Database
```

Where supported, database connections should also use encrypted transport.

---

### 15.6 Deployment Principle

The deployment architecture follows:

> **Expose only the frontend and required backend APIs publicly while keeping databases and sensitive services behind controlled access boundaries.**

---

## 16. Implementation Order

PantryPal will be implemented incrementally.

Development will follow dependency order so that foundational components are completed before features that depend on them.

---

### 16.1 Phase 1 — Project Foundation

The first phase establishes the development environment.

Tasks:

- Create frontend application
- Create backend application
- Configure Git
- Configure environment variables
- Configure linting
- Configure formatting
- Configure basic testing
- Configure API structure
- Configure database connection
- Create initial application documentation

Expected result:

```text
Frontend
   +
Backend
   +
Database Connection
   +
Development Configuration
   ↓
Working Project Foundation
```

---

### 16.2 Phase 2 — Backend Architecture

The backend structure will be established before implementing feature-specific APIs.

Initial structure:

```text
backend/
└── src/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── routes/
    ├── services/
    ├── validators/
    ├── models/
    ├── utils/
    └── app.js
```

Tasks:

- Express application setup
- Configuration module
- Database connection
- Error handling middleware
- Authentication middleware
- Request validation
- API versioning
- Health check
- Basic logging

---

### 16.3 Phase 3 — Database Implementation

The PostgreSQL schema will be implemented before dependent APIs.

Tasks:

- Create database schema
- Create migrations
- Create models
- Add relationships
- Add constraints
- Add indexes
- Configure database access layer
- Create development seed data where useful

Initial implementation order:

```text
Users
   ↓
Pantries
   ↓
Pantry Items
   ↓
Recipes
   ↓
Recipe Ingredients
   ↓
Grocery Lists
   ↓
Grocery Items
   ↓
Meal Plans
   ↓
Meal Plan Items
   ↓
User Preferences
```

---

### 16.4 Phase 4 — Authentication

Authentication will be implemented before protected application features.

Tasks:

- Registration
- Password hashing
- Login
- Token generation
- Authentication middleware
- Current-user endpoint
- Logout
- Authorization checks
- Authentication tests

Expected result:

```text
User
 ↓
Register / Login
 ↓
Authenticated
 ↓
Access Protected APIs
```

---

### 16.5 Phase 5 — Pantry Management

Pantry management is the core feature of PantryPal.

Tasks:

- Create pantry item
- View pantry items
- View pantry item details
- Update pantry item
- Delete pantry item
- Expiry filtering
- Quantity validation
- Pantry authorization
- Pantry API tests

Expected result:

```text
User
 ↓
Pantry
 ↓
Ingredients
 ↓
Quantity + Expiry Tracking

---
```

### 16.6 Phase 6 — Recipe System

The recipe system will be implemented after pantry management.

Tasks:

- Recipe storage
- Recipe retrieval
- Recipe details
- Recipe ingredients
- Serving adjustment
- Recipe validation
- Recipe API tests

The serving adjustment calculation will remain deterministic and will not depend on the LLM.

---

### 16.7 Phase 7 — AI Integration

AI integration will be introduced only after the underlying pantry and recipe systems are functional.

Tasks:

- AI service abstraction
- Prompt builder
- Pantry context builder
- User preference context
- LLM provider integration
- Structured response handling
- AI response validation
- AI error handling
- AI service tests

Expected flow:

```text
Pantry
   +
Preferences
   +
User Request
   ↓
AI Service
   ↓
LLM
   ↓
Validated Recommendation
```

---

### 16.8 Phase 8 — Grocery Management

Tasks:

- Create grocery list
- Add grocery items
- Update grocery items
- Mark items purchased
- Delete grocery items
- Grocery API tests

Future enhancement:

Recipe recommendations may automatically suggest missing ingredients for a selected recipe.

---

### 16.9 Phase 9 — Meal Planning

Tasks:

- Create meal plan
- View meal plans
- Add recipe to meal plan
- Remove recipe from meal plan
- Serving configuration
- Date validation
- Meal planning API tests

---

### 16.10 Phase 10 — Cooking Experience

The cooking experience will connect recipes with pantry consumption.

Tasks:

- Start cooking session
- Track current recipe step
- Update cooking progress
- Complete cooking session
- Calculate ingredient consumption
- Update pantry quantities
- Use database transactions
- Prevent duplicate completion
- Cooking API tests

Critical flow:

```text
Recipe
  ↓
Start Cooking
  ↓
Cooking Session
  ↓
Complete Recipe
  ↓
Calculate Consumption
  ↓
Update Pantry
  ↓
Transaction Commit
```

---

### 16.11 Phase 11 — Frontend Integration

After the backend APIs stabilize, the frontend will be connected to the implemented APIs.

Major frontend areas:

```text
Authentication
Dashboard
Pantry
Recipes
AI Recommendations
Grocery Lists
Meal Plans
Cooking Mode
Settings
```

Each feature should integrate with the corresponding backend API.

---

### 16.12 Phase 12 — UI/UX Refinement

After functional integration:

- Improve responsive design
- Improve loading states
- Improve error states
- Improve empty states
- Improve accessibility
- Improve navigation
- Improve mobile experience
- Improve visual consistency

Functionality should be prioritized before visual polish.

---

### 16.13 Phase 13 — Testing and Hardening

Before deployment:

- Run unit tests
- Run integration tests
- Run frontend tests
- Run API tests
- Test authentication
- Test authorization
- Test transactions
- Test AI failure scenarios
- Test validation errors
- Test responsive behavior
- Fix discovered defects

---

### 16.14 Phase 14 — Deployment

Final deployment steps:

```text
Code
 ↓
Tests
 ↓
Production Build
 ↓
Environment Configuration
 ↓
Database Configuration
 ↓
Deploy Backend
 ↓
Deploy Frontend
 ↓
Verify Health
 ↓
Smoke Test
```

---

### 16.15 Phase 15 — Documentation and Viva Preparation

Before final submission:

- Update README
- Update architecture documentation
- Update API documentation
- Add setup instructions
- Add screenshots
- Document technology choices
- Document important trade-offs
- Document testing strategy
- Prepare project demonstration
- Prepare viva questions and answers

---

### 16.16 Implementation Principle

Development will follow:

> **Build the foundation first, implement the core pantry workflow next, introduce AI after deterministic functionality is stable, and integrate advanced features incrementally.**

---

## 17. Git and Branch Strategy

PantryPal will use Git for version control and GitHub for remote repository hosting.

The repository will use a protected `main` branch as the stable integration branch.

Development work will be performed on short-lived feature, documentation, or fix branches.

---

### 17.1 Branch Structure

The primary branch is:

```text
main
```

Development branches will follow naming conventions such as:

```text
feature/authentication
feature/pantry-management
feature/recipe-system
feature/ai-recommendations
feature/grocery-management
feature/meal-planning
feature/cooking-mode
```

Documentation branches may use:

```text
docs/hld
docs/lld
docs/api
docs/readme
```

Bug-fix branches may use:

```text
fix/pantry-quantity
fix/auth-token
fix/recipe-validation
```

Refactoring branches may use:

```text
refactor/api-client
refactor/database-layer
```

---

### 17.2 Main Branch

The `main` branch represents the stable version of the project.

Direct development on `main` should be avoided.

Changes should reach `main` through a Pull Request whenever practical.

The main branch should contain code that:

- Builds successfully
- Passes required tests
- Follows project conventions
- Has been reviewed
- Is suitable for integration or deployment

---

### 17.3 Branch Creation

A new branch should be created from the latest `main`.

Example:

```bash
git switch main
git pull origin main
git switch -c feature/pantry-management
```

The branch name should clearly describe the work being performed.

---

### 17.4 Feature Branch Lifecycle

The normal workflow is:

```text
main
  ↓
Create Branch
  ↓
Implement Feature
  ↓
Write Tests
  ↓
Run Checks
  ↓
Commit Changes
  ↓
Push Branch
  ↓
Create Pull Request
  ↓
Review
  ↓
Merge
  ↓
Delete Branch
```

---

### 17.5 Commit Convention

Commits should use Conventional Commit-style prefixes.

Common prefixes include:

- `feat:` — New functionality
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code restructuring
- `test:` — Tests
- `chore:` — Tooling/configuration
- `style:` — Formatting or styling changes
- `perf:` — Performance improvements

Examples:

```text
feat: add pantry item creation API
fix: prevent negative pantry quantities
docs: update database schema
test: add pantry service tests
refactor: extract recipe service
chore: configure backend environment
```

Commit messages should describe the actual change clearly.

---

### 17.6 Commit Size

Commits should represent logical units of work.

Avoid large commits containing unrelated changes.

Prefer:

```text
feat: add pantry item model
feat: add pantry item service
test: add pantry service tests
feat: add pantry item API
```

over:

```text
feat: complete entire pantry feature
```

Small logical commits make debugging and reviewing easier.

---

### 17.7 Commit Before Pull Request

Before opening a Pull Request, the developer should verify:

```bash
git status
git diff
git log --oneline
```

Then run the relevant tests and checks.

The branch should contain only changes related to the intended feature.

---

### 17.8 Push Convention

A new branch should be pushed using:

```bash
git push -u origin feature/branch-name
```

After the upstream branch is established, subsequent pushes can use:

```bash
git push
```

---

### 17.9 Pull Request Title

Pull Request titles should follow the same Conventional Commit style where practical.

Examples:

```text
feat: implement pantry management
feat: add AI recipe recommendations
fix: prevent duplicate cooking session completion
docs: add low-level system design
```

The title should clearly communicate the purpose of the Pull Request.

---

### 17.10 Pull Request Description

Pull Requests should explain:

- What was changed
- Why it was changed
- How it was implemented
- What was tested
- Any known limitations

Recommended structure:

```text
## Summary

Brief description of the change.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- Test 1
- Test 2
- Test 3

## Notes

Additional implementation details or limitations.
```

---

### 17.11 Pull Request Example

Example title:

```text
feat: implement pantry management APIs
```

Example description:

```text
## Summary

Implements the initial pantry management functionality.

## Changes

- Added pantry item model
- Added pantry service
- Added pantry validation
- Added pantry controller
- Added pantry routes
- Added ownership checks
- Added API error handling

## Testing

- Added pantry service unit tests
- Added pantry API integration tests
- Tested invalid quantities
- Tested resource ownership

## Notes

Expiry filtering is included in the initial implementation.
```

---

### 17.12 Pull Request Review Checklist

Before merging a Pull Request:

- [ ] Feature works as expected
- [ ] Tests are included where required
- [ ] Existing tests pass
- [ ] Validation is implemented
- [ ] Authorization is checked
- [ ] No secrets are committed
- [ ] No unnecessary files are included
- [ ] Code follows project structure
- [ ] Documentation is updated if required
- [ ] Pull Request description is complete

---

### 17.13 Merge Strategy

Pull Requests should preferably be merged using Squash and Merge when the branch contains many small implementation commits.

This keeps `main` relatively clean while preserving the Pull Request as the complete feature history.

For example:

```text
feature/pantry-management
        |
        +-- feat: add pantry model
        +-- feat: add pantry service
        +-- test: add pantry tests
        +-- fix: update validation
        |
        ↓
Squash Merge
        ↓
main
        |
        +-- feat: implement pantry management
```

---

### 17.14 Branch Cleanup

After a Pull Request has been successfully merged, the remote feature branch should be deleted.

The local branch may also be deleted after confirming that the work exists on `main`.

Example:

```bash
git switch main
git pull origin main
git branch -d feature/pantry-management
git push origin --delete feature/pantry-management
```

The exact deletion command should only be used after confirming that the branch has been merged.

---

### 17.15 Keeping Branches Updated

Long-running branches should periodically synchronize with `main`.

Preferred workflow:

```bash
git switch main
git pull origin main
git switch feature/branch-name
git merge main
```

For this project, merge-based synchronization will be preferred initially because it is easier to understand and safer for a beginner-friendly workflow.

---

### 17.16 Before Every Commit

Before committing changes:

```bash
git status
git diff
```

Verify that:

- Only intended files changed.
- No `.env` files are staged.
- No credentials are present.
- No generated files were accidentally added.
- The code is in a working state.

Then:

```bash
git add <files>
git commit -m "type: clear description"
```

---

### 17.17 Before Every Push

Run:

```bash
git status
git log --oneline -3
```

Then run the relevant tests.

If everything is correct:

```bash
git push
```

---

### 17.18 Emergency Fixes

Critical bugs affecting the stable application may use a dedicated fix branch.

Example:

```bash
git switch main
git pull origin main
git switch -c fix/critical-authentication
```

The fix should remain focused and should not include unrelated feature work.

---

### 17.19 Git Security Rules

The repository must never contain:

- API keys
- Database passwords
- JWT secrets
- `.env` files containing real credentials
- Private certificates
- Personal authentication tokens

If a secret is accidentally committed, simply deleting it in a later commit is not sufficient because it may remain in Git history.

The credential should be revoked or rotated immediately.

---

### 17.20 Git Workflow Principle

The project follows:

> **Keep `main` stable, isolate development work in short-lived branches, make small logical commits, use Pull Requests for integration, and never commit secrets.**

---

## 18. LLD Completion Criteria

The Low-Level Design will be considered complete when the following areas have been defined:

- [x] Project architecture
- [x] Module boundaries
- [x] Database schema
- [x] API contracts
- [x] Authentication
- [x] Authorization
- [x] AI service architecture
- [x] Validation
- [x] Error handling
- [x] State management
- [x] Testing strategy
- [x] Environment configuration
- [x] Deployment architecture
- [x] Implementation order
- [x] Git and branch strategy

The LLD is a living document and may be updated when implementation reveals a requirement that was not known during the initial design.

Changes to the LLD should be documented through Git commits so that important architectural decisions remain traceable.

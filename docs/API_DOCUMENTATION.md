# PantryPal API Documentation & Swagger/OpenAPI Reference

Base URL: `http://localhost:3000/api/v1`

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Log in and obtain JWT access token | No |
| `POST` | `/auth/refresh` | Refresh JWT access token | Yes |
| `POST` | `/auth/logout` | Invalidate current session | Yes |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes |

---

## 2. Pantry Inventory (`/api/v1/pantries` & `/api/v1/pantry`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/pantries` | List all pantries for user | Yes |
| `POST` | `/pantries` | Create a new pantry location | Yes |
| `GET` | `/pantries/:pantryId/items` | List ingredients in pantry | Yes |
| `POST` | `/pantries/:pantryId/items` | Add ingredient to pantry | Yes |
| `PUT` | `/pantries/:pantryId/items/:itemId` | Update ingredient quantity/unit | Yes |
| `DELETE` | `/pantries/:pantryId/items/:itemId` | Remove ingredient from pantry | Yes |
| `GET` | `/pantries/expiry/alerts` | Get ingredients expiring soon | Yes |
| `GET` | `/pantries/low-stock/alerts` | Get low stock ingredients | Yes |

---

## 3. Recipes & Interactions (`/api/v1/recipes`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/recipes` | List recipes with pagination/filters | Yes |
| `POST` | `/recipes` | Create a new recipe | Yes |
| `GET` | `/recipes/:id` | Get recipe details by ID | Yes |
| `PUT` | `/recipes/:id` | Update existing recipe | Yes |
| `DELETE` | `/recipes/:id` | Delete recipe | Yes |
| `GET` | `/recipes/saved` | Fetch all saved/favorited recipes | Yes |
| `POST` | `/recipes/:id/save` | Save recipe to user favorites | Yes |
| `DELETE` | `/recipes/:id/save` | Remove recipe from user favorites | Yes |
| `POST` | `/recipes/:id/ratings` | Submit 1-5 star rating & review | Yes |
| `POST` | `/recipes/:id/history` | Log recipe cooking session | Yes |

---

## 4. Meal Plans (`/api/v1/meal-plans`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/meal-plans` | List scheduled meal plans | Yes |
| `POST` | `/meal-plans` | Create a new meal plan | Yes |
| `GET` | `/meal-plans/:id` | Get meal plan details | Yes |
| `PUT` | `/meal-plans/:id` | Update meal plan dates/servings | Yes |
| `DELETE` | `/meal-plans/:id` | Delete a meal plan | Yes |

---

## 5. Shopping List (`/api/v1/shopping-list`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/shopping-list` | Get user's shopping list | Yes |
| `POST` | `/shopping-list/items` | Add item to shopping list | Yes |
| `PATCH` | `/shopping-list/items/:itemId` | Toggle purchased status | Yes |
| `DELETE` | `/shopping-list/items/:itemId` | Remove item from shopping list | Yes |

---

## 6. AI Kitchen Intelligence (`/api/v1/ai`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/recommendations` | Generate grounded pantry recipes | Yes |
| `POST` | `/ai/chat` | Contextual AI Chef dialogue | Yes |
| `POST` | `/ai/generate-recipe` | AI Recipe Generator | Yes |

---

## 7. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get user notification stream | Yes |
| `GET` | `/notifications/unread-count` | Get unread badge count | Yes |
| `PATCH` | `/notifications/:id/read` | Mark notification as read | Yes |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | Yes |
| `DELETE` | `/notifications/:id` | Remove notification | Yes |

---

## 8. Dashboard & Search (`/api/v1/dashboard` & `/api/v1/search`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Retrieve all 10 KPI metrics | Yes |
| `GET` | `/search` | Debounced multi-entity search | Yes |

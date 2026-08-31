# PantryPal Database Architecture & Relational Mapping Design

This document details the database modeling, document schemas (MongoDB / Mongoose), relational SQL counterparts (PostgreSQL), and complex SQL relational queries.

---

## 1. Entity-Relationship Mapping & Schemas

### Entity 1: User
- **MongoDB Schema:** `models/User.js`
- **SQL Equivalent:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  refresh_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

---

### Entity 2: PantryItem
- **MongoDB Schema:** `models/PantryItem.js` (References `User` via `userId`)
- **SQL Equivalent:**
```sql
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  category VARCHAR(50) DEFAULT 'pantry' CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'spices', 'bakery', 'frozen', 'beverages', 'other')),
  expiry_date TIMESTAMP WITH TIME ZONE,
  low_stock_threshold NUMERIC(10, 2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_expiry ON pantry_items(user_id, expiry_date);
CREATE INDEX idx_pantry_items_category ON pantry_items(user_id, category);
```

---

### Entity 3: Recipe & RecipeIngredients
- **MongoDB Schema:** `models/Recipe.js`
- **SQL Equivalent:**
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  prep_time INTEGER NOT NULL DEFAULT 0,
  cook_time INTEGER NOT NULL DEFAULT 0,
  servings INTEGER NOT NULL DEFAULT 2 CHECK (servings > 0),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine VARCHAR(50) DEFAULT 'General',
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutrition JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(30) NOT NULL
);
CREATE INDEX idx_recipes_title ON recipes(title);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
```

---

### Entity 4: SavedRecipe (Favorites)
- **MongoDB Schema:** `models/SavedRecipe.js`
- **SQL Equivalent:**
```sql
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_id)
);
CREATE INDEX idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_recipe ON saved_recipes(recipe_id);
```

---

### Entity 5: MealPlan & MealPlanItems
- **MongoDB Schema:** `models/MealPlan.js`
- **SQL Equivalent:**
```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  people_count INTEGER NOT NULL DEFAULT 2 CHECK (people_count > 0),
  budget NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_meal_plan_dates CHECK (end_date >= start_date)
);

CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type VARCHAR(30) DEFAULT 'dinner',
  requested_servings INTEGER NOT NULL DEFAULT 2
);
```

---

### Entity 6: ShoppingList & ShoppingListItems
- **MongoDB Schema:** `models/ShoppingList.js`
- **SQL Equivalent:**
```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT 'Weekly Groceries',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
  unit VARCHAR(30) NOT NULL,
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_cost NUMERIC(10, 2) DEFAULT 0.00
);
```

---

### Entity 7: RecipeRating
- **MongoDB Schema:** `models/RecipeRating.js`
- **SQL Equivalent:**
```sql
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, recipe_id)
);
```

---

### Entity 8: RecipeHistory (Cooking Logs)
- **MongoDB Schema:** `models/RecipeHistory.js`
- **SQL Equivalent:**
```sql
CREATE TABLE recipe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  servings_cooked INTEGER DEFAULT 2 CHECK (servings_cooked > 0),
  duration_minutes INTEGER,
  notes TEXT,
  waste_prevented_grams NUMERIC(10, 2) DEFAULT 0.00
);
```

---

### Entity 9: Notification
- **MongoDB Schema:** `models/Notification.js`
- **SQL Equivalent:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('expiry_reminder', 'meal_reminder', 'shopping_reminder', 'recipe_recommendation', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### Entity 10: AIRequestLog
- **MongoDB Schema:** `models/AIRequestLog.js`
- **SQL Equivalent:**
```sql
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  feature VARCHAR(50) NOT NULL CHECK (feature IN ('recommendation', 'chat', 'recipe_generation', 'inventory_analysis')),
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER NOT NULL,
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_regenerated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Relational SQL Queries (JOIN Reference)

### 1. INNER JOIN (Find Matching Pantry Ingredients for Saved Recipes)
Returns only recipes that have matching pantry items present in the user's inventory.

```sql
SELECT 
  u.name AS chef_name,
  r.title AS recipe_title,
  ri.name AS ingredient_name,
  ri.quantity AS recipe_needed_qty,
  pi.quantity AS pantry_available_qty,
  pi.unit
FROM users u
INNER JOIN saved_recipes sr ON u.id = sr.user_id
INNER JOIN recipes r ON sr.recipe_id = r.id
INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
INNER JOIN pantry_items pi ON u.id = pi.user_id 
  AND LOWER(TRIM(ri.name)) = LOWER(TRIM(pi.name))
WHERE u.id = 'a1b2c3d4-0000-0000-0000-000000000000';
```

---

### 2. LEFT JOIN (Identify Missing Ingredients for Meal Plans)
Returns all required ingredients for planned meals and indicates whether the user owns them in their pantry (or `NULL` if missing).

```sql
SELECT 
  mp.name AS meal_plan_name,
  mpi.planned_date,
  r.title AS recipe_title,
  ri.name AS ingredient_needed,
  ri.quantity AS needed_quantity,
  ri.unit AS needed_unit,
  pi.id AS pantry_item_id,
  COALESCE(pi.quantity, 0) AS in_stock_quantity
FROM meal_plans mp
INNER JOIN meal_plan_items mpi ON mp.id = mpi.meal_plan_id
INNER JOIN recipes r ON mpi.recipe_id = r.id
INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN pantry_items pi ON mp.user_id = pi.user_id 
  AND LOWER(TRIM(ri.name)) = LOWER(TRIM(pi.name))
WHERE mp.user_id = 'a1b2c3d4-0000-0000-0000-000000000000'
ORDER BY mpi.planned_date ASC, r.title ASC;
```

---

### 3. RIGHT JOIN (Pantry Stock vs. Scheduled Dishes)
Returns all pantry items and right-joins planned dishes to detect unused pantry stock vs. consumed stock.

```sql
SELECT 
  r.title AS scheduled_recipe,
  mpi.planned_date,
  pi.name AS pantry_item_name,
  pi.quantity AS current_stock,
  pi.expiry_date
FROM recipes r
INNER JOIN meal_plan_items mpi ON r.id = mpi.recipe_id
INNER JOIN meal_plans mp ON mpi.meal_plan_id = mp.id
RIGHT JOIN pantry_items pi ON mp.user_id = pi.user_id
WHERE pi.user_id = 'a1b2c3d4-0000-0000-0000-000000000000'
ORDER BY pi.expiry_date ASC;
```

---

### 4. FULL OUTER JOIN (Comprehensive Inventory vs. Shopping Discrepancy)
Matches all pantry stock items against shopping list items to detect inventory surpluses or deficits.

```sql
SELECT 
  COALESCE(pi.name, sli.name) AS item_name,
  pi.quantity AS current_pantry_quantity,
  pi.unit AS pantry_unit,
  sli.quantity AS shopping_requested_quantity,
  sli.is_purchased,
  sli.estimated_cost
FROM pantry_items pi
FULL OUTER JOIN (
  SELECT sl.user_id, i.* 
  FROM shopping_lists sl
  INNER JOIN shopping_list_items i ON sl.id = i.shopping_list_id
) sli ON pi.user_id = sli.user_id 
  AND LOWER(TRIM(pi.name)) = LOWER(TRIM(sli.name))
WHERE COALESCE(pi.user_id, sli.user_id) = 'a1b2c3d4-0000-0000-0000-000000000000';
```

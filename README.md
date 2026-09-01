# PantryPal — AI-Powered Smart Kitchen Management System

> **"Use what you have before buying more."**

## Project Overview
PantryPal is a full-stack AI-powered kitchen management platform designed to help users intelligently manage their pantry, reduce food waste, simplify meal planning, and make better cooking decisions using their existing ingredients.

Unlike traditional recipe applications that only provide recipes, PantryPal acts as a personal kitchen assistant by combining pantry management, recipe intelligence, shopping automation, meal planning, and grounded AI recommendations into one seamless platform.

The primary objective of PantryPal is to solve one of the biggest household problems:
*"People buy groceries without knowing what they already have, resulting in food waste, unnecessary spending, and inefficient meal planning."*

PantryPal addresses this through intelligent inventory tracking, expiration monitoring, AI-assisted recipe recommendations, and automated shopping workflows.

---

## Core Objectives & Problem Statement

Many households experience:
- Food expiring before being used
- Duplicate grocery purchases
- Difficulty deciding what to cook
- Lack of meal planning
- Poor pantry organization
- Wasted ingredients
- Inefficient grocery shopping

PantryPal provides a centralized solution to:
- Reduce food waste and minimize unnecessary grocery spending
- Help users cook using available ingredients
- Automate pantry management and simplify meal planning
- Generate personalized recipe recommendations
- Create intelligent shopping lists
- Provide AI-powered cooking assistance

**Target Users**: Students, Families, Working professionals, Fitness enthusiasts, Home cooks, Budget-conscious households.

---

## Technology Stack

### Frontend (User Interface)
- **React 19**
- **Vite**
- **React Router** (Client-side routing)
- **Tailwind CSS v4**
- **Axios** (Async API Data Fetching)
- **React Hook Form & Zod** (Form handling & validation)
- **Framer Motion & Lucide React**

### Backend (API & Services)
- **Node.js & Express.js**
- **PostgreSQL** with **Prisma ORM** (Relational Data: Users, Recipes, Pantry)
- **MongoDB** (NoSQL Document Store: AI Interaction Logs & Unstructured AI Recipes)
- **JWT Authentication & Bcrypt**
- **Express Validator** (Request body validation)

### AI Integration
Large Language Model integration for Recipe recommendations, Cooking assistant, Meal planning suggestions, and Pantry analysis. 
*The AI is grounded, meaning recommendations are based on the user's actual pantry inventory instead of generating random recipes.*

---

## Key Features

1. **Authentication Module:** Registration, Login, JWT Authentication, Protected Routes, Secure Password Hashing.
2. **Pantry Management:** Manage inventory (add, edit, delete, categorize), track quantities/units, and purchase/expiration dates.
3. **Expiration Tracking:** Continuously monitors ingredient freshness with expired detection, alerts, and waste reduction recommendations.
4. **Low Stock Detection:** Automatically identifies ingredients running low with restock recommendations.
5. **Recipe Management:** Browse, search, filter, view nutrition, save favorites, and dynamically scale recipes.
6. **Dynamic Recipe Scaling:** Increase/decrease servings (e.g., 2 → 5) and automatically recalculate ingredient quantities.
7. **Pantry Matching Engine:** Determines how well a recipe matches current pantry inventory (e.g., "85% Pantry Match").
8. **Shopping List Management:** Manually add items or auto-generate from missing recipe ingredients.
9. **Meal Planning:** Support for Breakfast, Lunch, Dinner across daily or weekly planners.
10. **AI Recipe Recommendations:** Considers pantry inventory, expiring ingredients, user preferences, allergies, and budget.
11. **AI Conversational Assistant:** "What can I cook today?", "Suggest meals under 500 calories."
12. **Cooking Mode:** Step-by-step recipe instructions, progress tracking, and ingredient checklist.
13. **User Preferences:** Customize dietary preferences, allergies, favorite cuisines, serving sizes, and nutritional goals.
14. **Smart Dashboard:** Overview of pantry summary, expiring ingredients, low stock, upcoming meals, and AI recommendations.
15. **Notifications:** Expiration reminders, low stock alerts, meal reminders.

---

## Architecture

### Backend Architecture
The backend follows a layered architecture enforcing Separation of Concerns:
`Routes → Controllers → Validators → Middleware → Services → Prisma (SQL) / Mongoose (NoSQL)`
All database access is encapsulated within service layers, keeping controllers lightweight and maintainable.

### Frontend Architecture
The frontend is designed with scalability and React best practices in mind (Composition, State Management with `useState`, Side-effects with `useEffect`):

```text
src/
├── api/          # Axios instances and API calls
├── assets/
├── components/   # React Component Composition
│   ├── common/
│   ├── forms/    # Controlled inputs
│   ├── layout/
│   └── ui/
├── constants/
├── contexts/
├── hooks/        # Custom React hooks
├── layouts/
├── pages/        # Route boundaries
├── routes/       # Client-side routing maps
├── services/
├── styles/
└── utils/
```

### Design Philosophy
PantryPal follows a calm, minimal, earthy aesthetic inspired by natural kitchen environments.
- **Background (Parchment):** `#FAF8F3`
- **Primary (Sage Green):** `#8A9070`
- **Secondary (Soft Olive):** `#B8C39A`
- **Text (Olive Black):** `#272A1F`
- **Accent (Bark):** `#5E5947`

The interface emphasizes large spacing, rounded corners, soft shadows, smooth transitions, and responsive layouts.

---

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/code-jatin0112/PantryPal.git
   cd PantryPal
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Configure Postgres, Mongo, JWT, GenAI keys
   npx prisma generate
   npx prisma migrate deploy
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running Tests
```bash
cd backend
npm test
```

## Security Features
- JWT Authentication & Bcrypt password hashing
- Input/Request validation via `express-validator`
- Helmet Protection (Security Headers)
- CORS Whitelisting
- Sliding-Window Rate Limiting
- Prompt Injection defenses for AI APIs

## Project Documentation
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [High-Level Design (HLD)](./docs/HLD.md)
- [Low-Level Design (LLD)](./docs/LLD.md)
- [Project Score Mapping](./docs/PROJECT_SCORE_MAPPING.md)
---
name: "React Web Clean Bootstrap"
description: "Enterprise-level React Web project initializer with modular routing, logic/design separation, and strict TypeScript typing. Sets up pages (Auth/Dashboard/Frontend), modular Routes.ts, redux, and shared components."
category: "boilerplate"
tags: ["react", "typescript", "clean-architecture", "bootstrap", "web", "routing", "tailwind-css"]
---

# React Web Clean Bootstrap Skill

## Overview

This skill initializes a new React Web project using **Vite** with a modular architecture. It emphasizes Tailwind CSS for styling, clean routing, strict typing (No `any`), and a clear separation between UI design and business logic using custom hooks.

## 🏗️ Folder Structure

The skill generates the following directory tree:

```text
public/
└── assets/               # Images, Icons, static files (Web standard)

src/
├── component/            # Reusable UI components (Modals, Cards, Tables)
├── constant/             # Reusable UI elements (Buttons, Inputs) + UI Tokens (Colors, Fonts)
├── helper/               # axios.ts, API interceptors, utility functions
├── redux/                # slices/, store.ts, middleware/
├── types/                # Global interface definitions (e.g., login.types.ts)
└── pages/
    ├── Auth/             # Auth module
    │   ├── Login/
    │   │   ├── Login.tsx     # Design/UI only
    │   │   └── useLogin.ts   # Logic/Functionality (Custom Hook)
    │   └── index.ts      # Exports 'Auth' component with Auth-specific routes
    ├── Dashboard/        # Dashboard module
    │   ├── Home/
    │   │   ├── Home.tsx
    │   │   └── useHome.ts
    │   └── index.ts      # Exports 'Dashboard' component with Dashboard-specific routes
    ├── Frontend/         # Public/Frontend module
    │   └── index.ts      # Exports 'Frontend' component with Public routes
    └── Routes.ts         # Master routing file (Combines Auth, Dashboard, Frontend)
```

## 📜 Coding Rules & Standards

### 1. Styling (Tailwind CSS)
- Utility-first approach using Tailwind CSS is mandatory.
- All styles should be applied via Tailwind classes in `.tsx` files.
- Global theme configurations (colors, fonts) should be defined in `tailwind.config.js` and synced with `src/constant/`.

### 2. Modular Routing
- Each module folder (`Auth`, `Dashboard`, `Frontend`) must have an `index.ts`.
- This `index.ts` defines and exports the routes for that specific module.
- `src/pages/Routes.ts` imports these module routes and serves as the main router for `App.tsx`.

### 2. Logic Separation (Hook Pattern)
- Every page must have a dedicated directory.
- Design goes into `<PageName>.tsx`.
- All logic (state, API calls, handlers) must reside in a custom hook `use<PageName>.ts`.

### 3. 🔴 Hard Violation: Strict TypeScript (Zero "any")
- The use of `any` is strictly prohibited in all files. Using `any` is considered a hard violation of this skill.
- Every page/component must have its interfaces defined in `src/types/`.
- All API responses and props must be properly typed.
- If a type is unknown, use `unknown` or a generic, but never `any`.
- ESLint rules should be configured to fail on `no-explicit-any`.

### 4. Component vs Constant
- Reusable primitive elements (Buttons, Inputs) reside in `src/constant/`.
- Complex reusable UI (Modals, Cards, Layouts) reside in `src/component/`.

## 🚀 Execution Commands

### Initialize Full Structure
```bash
# Initialize the base clean architecture for Web
npx claude-flow skill run react-web-clean-bootstrap init
```

### Create a New Page
```bash
# Generate a new page folder with TSX, Hook, and Types
npx claude-flow skill run react-web-clean-bootstrap create-page --name "Settings" --module "Dashboard"
```

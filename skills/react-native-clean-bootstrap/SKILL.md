---
name: "React Native Clean Bootstrap"
description: "Professional React Native project initializer following a strict design/logic separation and absolute typing (No Any) architecture. Sets up src, screens (Auth/Dashboard), hooks, navigation, redux, and global types."
category: "boilerplate"
tags: ["react-native", "typescript", "clean-architecture", "bootstrap", "mobile"]
---

# React Native Clean Bootstrap Skill

## Overview

This skill initializes a new **React Native CLI** project (non-Expo) with a highly organized folder structure, ensuring a clear separation between UI design and business logic. It enforces strict TypeScript usage to eliminate `any` types and promotes scalability through modular screen management.

## 🏗️ Folder Structure

The skill generates the following directory tree under `src/`:

```text
src/
├── AppNavigation/        # Navigation definitions (Root, Auth, Dashboard stacks)
├── assets/               # Images, Icons, Lottie files
├── component/            # Reusable UI (Modals, Cards, Custom Buttons)
├── constant/             # Colors, Fonts, UI Tokens, API URLs
├── helper/               # axios.ts, API interceptors, utility functions
├── redux/                # slices/, store.ts, middleware/
├── types/                # Global interface definitions (e.g., login.types.ts)
└── screens/
    ├── Auth/             # Login, Register, ForgotPassword
    │   └── Login/
    │       ├── Login.tsx     # Design/UI only
    │       └── useLogin.ts   # Logic/Functionality (Custom Hook)
    └── Dashboard/        # Home, Profile, Settings
        └── Home/
            ├── Home.tsx      # Design/UI only
            └── useHome.ts    # Logic/Functionality (Custom Hook)
```

## 📜 Coding Rules & Standards

### 1. Logic Separation (Hook Pattern)
- Every screen must have a dedicated directory.
- Design goes into `<ScreenName>.tsx`.
- All logic (state, API calls, handlers) must reside in a custom hook `use<ScreenName>.ts`.
- The screen component should only receive what it needs from the hook.

### 4. 🔴 Hard Violation: Strict TypeScript (Zero "any")
- The use of `any` is strictly prohibited in all files. Using `any` is considered a hard violation of this skill.
- Every screen/component must have its interfaces defined in `src/types/`.
- All API responses, state, and props must be properly typed.
- If a type is unknown, use `unknown` or a generic, but never `any`.
- ESLint rules should be configured to fail on `no-explicit-any`.

### 1. Logic Separation (Hook Pattern)
- All API responses, state objects, and navigation params must be properly interfaced.

### 3. Centralized Constants
- UI-related strings, colors, and fonts must be imported from `src/constant/`.
- Hardcoding colors or fonts in styles is not allowed.

### 4. Modular Navigation
- Navigation logic is centralized in `src/AppNavigation/`.
- Individual stack navigators (AuthStack, MainStack) are defined separately and combined in a RootNavigator.

## 🚀 Execution Commands

### Initialize Full Structure
```bash
# Initialize the base clean architecture
npx claude-flow skill run react-native-clean-bootstrap init
```

### Create a New Screen
```bash
# Generate a new screen folder with TSX, Hook, and Types
npx claude-flow skill run react-native-clean-bootstrap create-screen --name "Profile" --module "Dashboard"
```

## 🛠️ Implementation Logic (Pseudo-code)

```javascript
[Bootstrap Operation]:
  // 1. Create Core Folders
  MKDIR("src/screens/Auth", "src/screens/Dashboard", "src/types", "src/constant", "src/helper", "src/redux", "src/AppNavigation", "src/component", "src/assets");

  // 2. Initialize Constants
  Write("src/constant/colors.ts", "export const Colors = { primary: '#000', ... };");
  Write("src/constant/fonts.ts", "export const Fonts = { bold: '...', ... };");

  // 3. Setup Axios Helper
  Write("src/helper/axios.ts", "[Axios instance with base URL and interceptors template]");

  // 4. Create Sample Screen (Login)
  MKDIR("src/screens/Auth/Login");
  Write("src/screens/Auth/Login/Login.tsx", "[UI Design Template using useLogin hook]");
  Write("src/screens/Auth/Login/useLogin.ts", "[Functional Logic Template]");
  Write("src/types/login.types.ts", "export interface LoginParams { ... }");

  // 5. Update App.tsx
  Write("App.tsx", "[Root component importing AppNavigation]");
```

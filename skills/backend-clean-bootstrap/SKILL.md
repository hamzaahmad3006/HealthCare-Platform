---
name: "Backend Clean Bootstrap"
description: "Professional Backend initializer for Node.js (with Prisma) and Python. Enforces a clean MVC-style architecture with routes, controllers, middleware, and strict typing (No 'any')."
category: "boilerplate"
tags: ["node", "python", "prisma", "clean-architecture", "backend", "typescript"]
---

# Backend Clean Bootstrap Skill

## Overview

This skill initializes a new Backend project (Node.js/TypeScript or Python) with a modular architecture. It emphasizes type safety (No `any`), database management via Prisma (for Node), and a clear separation of concerns (Routes, Controllers, Middleware).

## 🏗️ Folder Structure

### Node.js (TypeScript) + Prisma
```text
prisma/               # Prisma schema and migrations (Outside src)
src/
├── config/           # Environment variables, database config
├── controller/       # Request handlers (Business logic)
├── helper/           # Shared utility functions
├── middleware/       # Auth guards, validation, error handling
├── routes/           # API Route definitions
├── types/            # Global interface definitions (Zero "any" policy)
├── utils/            # Helper scripts and constants
└── server.ts         # Main entry point
```

### Python
```text
src/
├── config/
├── controller/
├── helper/
├── middleware/
├── routes/
├── types/            # Pydantic models or type definitions
├── utils/
└── main.py           # Main entry point (FastAPI or similar)
```

## 📜 Coding Rules & Standards

### 1. 🔴 Hard Violation: Strict TypeScript/Typing (Zero "any")
- The use of `any` is strictly prohibited.
- Every request/response and internal object must have its interfaces defined in `src/types/`.
- For Python, use Pydantic models or Type Hints for strict validation.

### 2. Separation of Concerns (MVC Pattern)
- **Routes:** Only define endpoints and map them to controllers.
- **Controllers:** Handle the business logic and database interactions.
- **Middleware:** Handle cross-cutting concerns like Authentication, Logging, and Error Catching.

### 3. Database (Node.js)
- **Prisma** is the mandatory ORM.
- Schema changes must be made in `prisma/schema.prisma`.
- Type-safe database queries are required via the generated Prisma Client.

## 🚀 Execution Commands

### Initialize Node.js Backend
```bash
# Initialize Node.js + Prisma + TS structure
npx claude-flow skill run backend-clean-bootstrap init --lang node
```

### Initialize Python Backend
```bash
# Initialize Python structure
npx claude-flow skill run backend-clean-bootstrap init --lang python
```

### Create a Module
```bash
# Generate Route, Controller, and Types for a new module
npx claude-flow skill run backend-clean-bootstrap create-module --name "User"
```

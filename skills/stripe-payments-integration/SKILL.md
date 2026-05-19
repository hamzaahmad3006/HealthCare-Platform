---
name: "Stripe Payments Integration"
description: "End-to-end Stripe payment integration for Web (Elements), Mobile (SDK), and Backend (Webhooks). Ensures secure, type-safe, and reliable payment flows including subscriptions and one-time payments."
category: "integrations"
tags: ["stripe", "payments", "webhooks", "react-web", "react-native", "backend"]
---

# Stripe Payments Integration Skill

## Overview

This skill provides a standardized way to implement Stripe payments across the entire stack. It focuses on security (no sensitive data in frontend), reliability (robust webhook handling), and premium UX (smooth checkout flows).

## 🏗️ Architecture & Flow

### 1. Frontend (Web/Mobile)
- **Web:** Use `@stripe/react-stripe-js` and Elements for custom branded checkout.
- **Mobile:** Use `@stripe/stripe-react-native` for native payment sheets (Apple/Google Pay).
- **Rule:** Never handle raw card data. Always use Stripe tokens/intents.

### 2. Backend (Node.js/Python)
- **Endpoints:** Create `PaymentIntent` or `CheckoutSession` endpoints.
- **Webhooks:** Mandatory `src/routes/webhook.ts` to handle `payment_intent.succeeded`, `invoice.paid`, etc.
- **Verification:** Always verify Stripe signatures to prevent spoofing.

### 3. Types & Interfaces
- Define Stripe-related interfaces in `src/types/stripe.types.ts`.
- No `any` type for Stripe payloads; use proper Stripe SDK types.

## 📜 Implementation Rules

### 1. The Webhook First Principle
- Always assume the frontend might fail or be closed.
- Business logic (unlocking features, updating subscription status) MUST happen in the **Webhook Controller**, not the frontend success callback.

### 2. Secure Config
- All Stripe Secret Keys must be managed via `src/config/` and `.env`.
- Public Keys are shared via `src/constant/`.

## 🚀 Execution Commands

### Setup Stripe Backend
```bash
# Initialize Stripe controllers, routes, and webhook handler
npx claude-flow skill run stripe-payments-integration setup-backend --platform "node"
```

### Setup Stripe Frontend
```bash
# Add Stripe provider and sample checkout component
npx claude-flow skill run stripe-payments-integration setup-frontend --platform "web"
```

### Add Webhook Logic
```bash
# Add a new event handler to the existing webhook
npx claude-flow skill run stripe-payments-integration add-webhook --event "customer.subscription.deleted"
```

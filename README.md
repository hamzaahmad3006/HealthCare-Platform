# HomeHealth — Healthcare Home Services Platform

Healthcare home services platform serving Faisalabad. Customers book verified nurses, doctors, caregivers, lab sampling, physiotherapy, and ambulance services online. Admins assign staff, track visits, and review reports.

## Stack

- **Backend** — Node.js 20, Express 5, TypeScript, Prisma + PostgreSQL, Redis (BullMQ), Argon2, JWT (RS256), Stripe webhooks.
- **Web** — React 18, Vite, TypeScript, Tailwind, Redux Toolkit, react-hook-form + zod, Headless UI.
- **Mobile** — React Native customer/staff app. See [mobile setup](healthcare-mobile/README.md); offline synchronization is not claimed as implemented.

## Repository layout

```
healthcare-backend/     # Express API + Prisma + BullMQ workers
healthcare-web/         # React Vite web app (customer + admin + staff)
healthcare-mobile/      # React Native customer + staff app
.github/workflows/      # CI (typecheck, unit tests, build)
```

## Quick start (local dev)

Prerequisites: Node 20 for backend/web, Node 22.11+ for mobile, PostgreSQL 15+.
Redis 7+ is required for shared cache/queue operation across processes; the configured
no-Redis fallback is single-process only. Use a dedicated development database for
the migration and seed commands below.

### Backend

```bash
cd healthcare-backend
cp .env.example .env       # fill in DATABASE_URL, REDIS_URL, JWT keys, etc.
npm install --legacy-peer-deps
npx prisma migrate dev
npx prisma db seed
npm run dev                # API on http://localhost:3000

# Workers (separate terminals)
npm run worker:notification
npm run worker:reminder
```

### Web

```bash
cd healthcare-web
cp .env.example .env       # VITE_API_URL=http://localhost:3000/api/v1
npm install --legacy-peer-deps
npm run dev                # http://localhost:5173
```

## Scripts

### Backend

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | ts-node-dev hot reload                        |
| `npm run build`     | tsc -> dist/                                  |
| `npm run start`     | node dist/server.js                           |
| `npm run typecheck` | tsc --noEmit                                  |
| `npm test`          | Jest tests (external-service mocks in current suites) |
| `npm run test:unit` | unit suite only — fast, no DB needed          |

### Web

| Script              | What it does                |
| ------------------- | --------------------------- |
| `npm run dev`       | Vite dev server             |
| `npm run build`     | Production build to `dist/` |
| `npm run preview`   | Serve the built dist        |
| `npm run typecheck` | tsc --noEmit                |
| `npm run lint`      | ESLint                      |

## Health & readiness

The backend exposes two probes for orchestrators:

- `GET /api/v1/health` — liveness, returns 200 if the process is alive.
- `GET /api/v1/readyz` — readiness, pings DB + Redis. Returns 503 on any failure.

## Security highlights

- Argon2id password hashing, RS256 JWTs (asymmetric keys via env).
- Sliding-window Redis rate limits on auth, refresh, API, uploads, and the Stripe webhook.
- Audit log middleware records mutations and **redacts sensitive fields** (`password`, `token`, `otp`, `cardNumber`, …) before persisting (SRS §11.6).
- Stripe webhook signature verified before any state change.
- CORS allow-list driven by `CORS_ORIGINS`; Helmet with strict CSP.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on every PR:

1. Backend — `prisma generate` -> typecheck -> jest unit suite.
2. Web — typecheck -> build.
3. Mobile — safe development API generation -> typecheck -> tests on Node 22.
   The separate `fix/mobile-lint-ci` branch also adds lint.

These are configured jobs, not evidence that a particular GitHub run passed.

## Project status

See [verified web/backend progress and PR handoff](web-missing.md) and
[mobile progress](task.md) for the 2026-11-13 review. Several old “missing” features
are implemented, while recovery/onboarding and the new fixes remain on unmerged
branches. Those documents distinguish merged code, local mocked checks, external
integration blockers and device verification. The project is not declared complete
or production-ready merely because local tests and builds pass.

## Contributing

- Work on feature branches off `main`.
- Keep commits scoped; CI must pass before merge.
- Backend: maintain zero `any` policy; controllers use `pickParam` / Zod for input validation.
- Web: maintain logic/UI separation — page logic lives in `useX.ts` hooks.

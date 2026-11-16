# Remaining Tasks & Production Readiness Checklist

**Last Updated:** 2026-11-16  
**Current Baseline:** `main` (`f86fe8c`)  
**Completion Estimate:**
- **Core Functional MVP (Backend + Web + Mobile Flows):** ~90% – 92%
- **Strict SRS v1.0 Scorecard (32 Capability Groups):** ~73.4% (`23.5 / 32`)

> **Note:** This file consolidates all remaining items from the earlier `task.md`, `web-missing.md`, `JAZZCASH_INTEGRATION.md`, and `docs/srs-implementation-assessment.md`. The completed items from `task.md` and `web-missing.md` (PRs #32–#47) have been verified and removed from the active backlog.

---

## 1. Completed & Removed from Old `task.md` and `web-missing.md`

The following items that were listed as pending in `task.md` and `web-missing.md` (dated 2026-11-13) are **100% completed** and no longer pending:

- [x] **Customer mobile patient pagination (`fix/mobile-patient-pagination`, PR #32)** — Merged into `main` (`e429fae`).
- [x] **Patient & address deletion history guards (`fix/patient-address-history-guards`, PR #33)** — Merged into `main` (`b2ab2e9`).
- [x] **Authorized web report downloads & retry states (`fix/web-report-downloads`, PR #34)** — Merged into `main` (`716a1ba`).
- [x] **Staff patient directory server-side search & pagination (`fix/staff-patient-directory-search`, PR #35)** — Merged into `main` (`ee8c2c4`).
- [x] **Web staff patient list error recovery (`fix/web-staff-patient-retry`, PR #37)** — Merged into `main` (`0e03ca0`).
- [x] **Web admin settings retry & stale filter response guard (`fix/web-admin-settings-retry`, PR #38)** — Merged into `main` (`00ac48e`).
- [x] **Scoped booking idempotency & PostgreSQL CI integration job (`fix/booking-idempotency-isolation`, PR #39)** — Merged into `main` (`433031a`).
- [x] **Audit & error log PHI/clinical data redaction (`fix/audit-patient-data-privacy`, PR #40)** — Merged into `main` (`0a63ef6`).
- [x] **Mobile native Keychain/Keystore session token storage (`fix/mobile-secure-session-storage`, PR #41)** — Merged into `main` (`e671b50`) and cold-restart hydration verified on physical Android device.
- [x] **Review ownership & completed-visit review authorization (`fix/review-record-authorization`, PR #42)** — Merged into `main` (`24ccba6`).
- [x] **Visit checkout, missed-visit & transactional completion guards (PR #43 & PR #44)** — Merged into `main` (`e34fc74`, `a68df00`).
- [x] **Web QA flows, role guards & booking status coverage (PR #46)** — Merged into `main` (`82507ee`).
- [x] **Android native APK build (`gradlew assembleDebug`) & physical device QA (`Infinix X659B`, Android 11 / SDK 30) (PR #47)** — Verified customer, staff, doctor, and admin-block flows, error/retry states, focus refresh, and indoor GPS network fallback (`e8de516`).
- [x] **GitHub Actions CI verification** — All 4 CI jobs (`Backend`, `Web`, `Mobile`, `Booking idempotency PostgreSQL`) observed passing on GitHub.
- [x] **SEO Service/City Landing Pages & SSG Pre-rendering (`SRS §9.5, §10.2, §18`)** — Added `/services`, `/services/:serviceSlug`, `/services/:serviceSlug/:citySlug`, and `/locations/:citySlug` routes, dynamic `SeoHead` with Schema.org JSON-LD (`MedicalBusiness`, `Service`, `FAQPage`, `BreadcrumbList`), automated 50-route SSG static HTML pre-renderer (`scripts/prerender-seo.mjs`), `sitemap.xml`, `robots.txt`, and headless Chrome verification suite (`tests/browser/seo-landing.cjs`).

---

## 2. P1 — High-Priority Security, Storage & Data Integrity Tasks

### 2.1 Private Medical File Storage (`SRS §13, §14`)
- [ ] **Switch Cloudinary uploads to `authenticated` / `private` delivery type:**
  - Currently `healthcare-backend/src/helper/storage.helper.ts` uses standard `upload` delivery type, meaning raw URLs could be accessed without a signature if leaked.
  - Enforce `type: 'authenticated'` (or private S3 bucket) so unsigned URLs are rejected by the storage provider.
- [ ] **Reduce signed download URL TTL to 15 minutes (`900s`):**
  - Update default signed URL expiration from `3600` seconds to `900` seconds (`SRS §14`).
- [ ] **Orphaned report metadata retention policy (from `web-missing.md`):**
  - Define and implement a cleanup/retention rule or UI indicator for `Report` records created before a failed attachment upload.
- [ ] **Verify with a designated test storage account (from `task.md` & `web-missing.md`):**
  - Test end-to-end presigned upload, confirmation, signed download, and rejected-document resubmission against a real test Cloudinary/S3 bucket.

### 2.2 Server-Side Offline Sync & Visit Deduplication (`SRS §7.5`)
- [ ] **Separate check-in and check-out `offlineSyncId` fields:**
  - Currently `BookingVisit` stores a single `offlineSyncId`, so an offline check-out overwrites the check-in deduplication key.
  - Add separate `checkInOfflineSyncId` and `checkOutOfflineSyncId` columns in Prisma.
- [ ] **Preserve client-captured timestamps (`recordedAt`):**
  - Accept and validate client-captured `checkInAt` / `checkOutAt` timestamps when syncing queued offline actions rather than overwriting with server `new Date()`.

### 2.3 Historical Data Audit (from `web-missing.md`)
- [ ] **Audit legacy Stripe & NotificationLog rows on designated staging/prod databases:**
  - Check for any pre-fix `Payment` rows where Stripe intents were labeled `CASH` or `NotificationLog` rows missing `userId` before running production migrations.

---

## 3. P2 — Core Feature Gaps (SRS & Product Scope)

### 3.1 Mobile Offline Persistence & Sync Queue (`SRS §7.1–7.4, §15`)
- [ ] **Encrypted local database (`WatermelonDB` / `SQLCipher`):**
  - Cache assigned staff visits and patient details locally on the device in encrypted storage.
- [ ] **Offline action queue & background reconnect sync:**
  - Queue staff `en-route`, `check-in`, and `check-out` actions when the device is offline and automatically replay them with `X-Offline-Sync-Id` when connectivity returns.

### 3.2 Payment Gateway Integration (`JAZZCASH_INTEGRATION.md`)
- [ ] **Backend JazzCash endpoints (once merchant credentials arrive):**
  - `POST /api/v1/payments/jazzcash/initiate` (HMAC-SHA256 secure hash generation).
  - `POST /api/v1/payments/jazzcash/callback` (verify response hash & mark payment `PAID`).
  - Add `JAZZCASH` to `PaymentMethod` enum in `prisma/schema.prisma`.
- [ ] **Web & Mobile payment redirect UI:**
  - Add "Pay Now" flow and success/failure callback screens on Web and Mobile.

### 3.3 Admin Dashboard Multi-City Filtering & Cache Invalidation (`SRS §10.1–10.3`)
- [ ] **Apply `cityId` filter in `/api/v1/admin/dashboard/summary`:**
  - Currently `admin.controller.ts` summary handler ignores query parameters and uses a single global cache key (`admin:dashboard:summary`).
  - Scope the query and Redis cache key by `cityId` (`admin:dashboard:summary:${cityId || 'all'}`).
- [ ] **Invalidate dashboard cache on booking/visit state transitions:**
  - Clear or update dashboard summary cache keys when bookings or visits change status.

### 3.4 Per-Visit Review UI on Web & Mobile (`SRS §3.7, §9.3`)
- [ ] **Client UI for completed-visit reviews on active recurring bookings:**
  - Backend `POST /api/v1/reviews` now supports reviewing individual completed visits while a multi-visit booking is still `IN_PROGRESS` (PR #42), but Web and Mobile UIs still only show the review trigger after the entire booking is `COMPLETED`.

### 3.5 Notification & Reminder Worker Hardening (`SRS §11.1–11.3`, from `web-missing.md`)
- [ ] **Sweep job for stuck `PENDING` notifications:**
  - Add a periodic sweep in `worker/notification.worker.ts` for `NotificationLog` rows that remained `PENDING` if Redis enqueue failed during a request, and mark exhausted BullMQ jobs as `FAILED`.
- [ ] **Atomic reminder deduplication & pagination:**
  - Make `worker/reminder.worker.ts` check/create deduplication atomic, enforce visit-count thresholds, and paginate the package-renewal scan beyond the current `take: 100` limit.
- [ ] **Validate workers with test Redis & notification adapters:**
  - Verify reminder timing, retry backoff, and cold/background push notification deep-linking (`usePushRegistration.ts`) using test FCM/SMS/WhatsApp credentials.

---

## 4. P3 — Compliance, Maintenance & Platform Verification

### 4.1 Six-Month Cold Log Archival (`SRS §10.3`)
- [ ] **Scheduled archival job for `AuditLog` and `NotificationLog`:**
  - Move or archive `AuditLog` and `NotificationLog` records older than 6 months to cold storage / archive tables.

### 4.2 Security Header & Endpoint Polish (`SRS §13`)
- [ ] **`Retry-After` header on rate-limit (`429`) responses:**
  - Include standard `Retry-After` HTTP header in `rateLimit.middleware.ts` responses.
- [ ] **JWKS endpoint (if external services verify RS256 tokens):**
  - Expose `/.well-known/jwks.json` if required by downstream services.

### 4.3 iOS Native Build & Code Maintenance (from `task.md`)
- [ ] **iOS native build & device/simulator verification:**
  - Run `cd healthcare-mobile && npm run ios` / Xcode build on a macOS runner and verify permissions, Keychain storage, and navigation on iOS.
- [ ] **Clean up remaining ESLint warnings (`healthcare-mobile`):**
  - Resolve the 60 non-blocking ESLint warnings (`no-void`, `react/no-unstable-nested-components`, `react-native/no-inline-styles`) in `healthcare-mobile`.
- [ ] **Configure Playwright browser regression suite in GitHub Actions (from `requirements-gap-review.md`):**
  - Add a CI job in `.github/workflows/ci.yml` to run the web Playwright regression scripts automatically on PRs.

# Mobile progress and remaining verification

Reviewed 2026-11-13 against `origin/main` at `5ea63cc`. See
[web/backend progress and branch handoff](web-missing.md) for full SHAs, compare links,
validation results and shared backend work. This file replaces outdated claims that
existing mobile screens are missing or mocked.

## Present in main

- Service selection fetches `/service-types`; customer booking, patient/address selection,
  bookings, reports and registration use backend APIs.
- Staff home, visits, visit detail/lifecycle, reports, patients, availability and password
  change have API integrations. Their presence is not physical-device verification.
- Notifications have a list, unread tracking and booking/visit navigation.
- Doctor selection, authorized requests, acceptance/time proposals and customer responses
  reached main in PR #24. Staff access, rescheduling and types/setup reached main in
  PRs #21–23. These are verified by fetched Git ancestry.
- Fresh-checkout API host generation and mobile typecheck/tests are in CI. Production
  API configuration requires an explicit environment value; no production URL is assumed.

## Implemented but not merged

- `feat/mobile-recovery-and-onboarding` (`7f63122621677b84d9d63645bb8f78fdb20feeda`):
  forgot/reset password, staff completion/documents/verification UI and backend work gates.
  It was preserved and included only in an isolated compatibility check.
- `fix/mobile-lint-ci` (`875e8a48d9eba90cc0412b68a7fc88f8caba4246`): fixes the three
  existing lint errors and adds the lint CI step. No unrelated UI changes.
- Shared backend payment, report-file and notification-access fixes are listed in
  [web-missing.md](web-missing.md). Their API response formats remain compatible.

## Local evidence

Main-based mobile lint branch: typecheck and **34 tests passed**; lint has **0 errors,
38 warnings**. Combined with recovery/onboarding and this review's backend/web fixes:
typecheck and **72 tests passed**; lint has **0 errors, 52 warnings**. Combined backend
unit/controller/helper tests: **278 passed**. These use test doubles for external services.

All branches combine without Git conflicts. No main merge was performed. GitHub API
access is forbidden, so GitHub CI and required checks remain **unverified**. Code branches
are **NOT READY TO MERGE** until those checks and review gates are satisfied.

## Remaining work

1. Review/merge recovery/onboarding and the independent fixes after CI is visible.
2. Use designated test database/storage/message integrations for reset codes, document
   rejection/resubmission, report confirmation, assignment revocation and notification
   navigation. No real reset messages were sent in automated tests.
3. Verify camera/file-picker permissions, upload cancellation/network recovery, push
   navigation from cold/background states, accessibility and complete customer/staff
   workflows on Android/iOS devices. These have not been device-tested in this review.
4. Build Android with JDK 17 and the Android SDK, and iOS on macOS/Xcode. This environment
   has Java 21 and no Android SDK commands or iOS toolchain; no native build pass is claimed.
5. Reduce remaining lint warnings as focused maintenance. They are reported, not suppressed.

The old blanket estimates and “backend already works” claim have been removed. Integration
and release readiness depend on the concrete checks above, not just TypeScript success.

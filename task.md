# Mobile progress and remaining verification

Reviewed 2026-11-13 against `origin/main` at `08444c3`. The earlier recovery,
onboarding, doctor booking and types/setup branches are now merged (PRs #23–#25).
The old list of absent screens and mocked staff workflows is no longer accurate.

## Present in main

- Customer registration, service selection, booking, patient/address management,
  booking status, reports and notifications are wired to backend APIs.
- Doctor requests, acceptance, time proposals and customer responses are implemented.
- Staff home, visits, visit lifecycle, reports, patients, profile, availability,
  recovery, onboarding and document upload have API integration and verification gates.
- Development API host generation, TypeScript, Jest and mobile lint are configured
  in CI. Production API configuration still requires an explicit environment value.

Presence in source does not prove full service integration or physical-device behavior.

## Local validation and pending work

The 2026-11-13 review passed mobile typecheck and 72 Jest tests on the combined code
before those branches merged. Mobile lint had zero errors and 52 warnings. GitHub CI
results after merge are unavailable through this environment's API and are not marked
passed here. No Android/iOS build or device test was performed in this review.

1. Run the customer, doctor and staff flows against a designated test database,
   test storage and notification adapters. Check rejected-document resubmission,
   password recovery, push navigation from cold/background states and offline failures.
2. Verify Android with JDK 17/Android SDK and iOS with macOS/Xcode, including file
   permissions, upload retries, accessibility and real navigation on devices.
3. Review remaining lint warnings as focused maintenance. They are reported, not
   suppressed. Do not send real reset codes or notifications during tests.

The unmerged `fix/mobile-patient-pagination` branch (`be5a8c41c6721e7fa4ea74e5e4d0839b5aa3e1c2`)
loads all customer patient pages with retry handling. Its local typecheck, 76 tests and
lint (0 errors, 52 warnings) passed. The staff patient directory still loads only
the first 100 records and searches locally; that remains a separate API/UI task.

See [web/backend progress](web-missing.md) for current unmerged fix branches and
remaining shared backend checks. The project is not declared production ready.

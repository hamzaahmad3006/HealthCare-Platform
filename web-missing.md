# Verified web and backend progress

Reviewed 2026-11-13 against `origin/main` at `08444c350e93f21c9559f3f61c632b374d8e6e6b`.
Code present, local tests, GitHub CI and external-service validation are separate claims.
The project is not declared complete or production ready.

## Verified in main

Fetched Git ancestry includes PRs #21–#31. Staff booking access, web rescheduling,
mobile types/setup and doctor booking, mobile recovery/onboarding, payment access,
report confirmation, personal notification access, signed web uploads, mobile lint CI,
and the previous progress documentation are all merged. No older task branch remains
outside main at the review start. See the current controllers and routes rather than
older task estimates for implemented behavior.

| Workflow or contract | Evidence in code |
| --- | --- |
| Customer/admin booking rescheduling and doctor proposals | Booking routes/controllers, customer/admin web detail actions and mobile doctor screens. |
| Staff verification and recovery | Auth/staff controllers, verified-staff middleware, web and mobile onboarding/recovery screens. |
| Report upload and access | Report routes/controller, report target helper, signed storage helper and web/mobile uploads. |
| Admin notification history | Filtered and paginated `/admin/notifications` and the web admin page. |
| Reminder and notification workers | `worker/reminder.worker.ts` and `worker/notification.worker.ts`; delivery/restart behavior has not been validated with test services. |
| Web/mobile CI | `.github/workflows/ci.yml` configures backend, web and mobile jobs; mobile lint is included. Actual GitHub run results are not available here. |

## Current fixes awaiting review

All three branches start independently from the main commit above; none contains another's changes. Merge the patient/address guard first because it protects historical
records; the web report download and mobile pagination fixes have no code dependency on it.

| Branch | Scope | Local checks |
| --- | --- | --- |
| [`fix/patient-address-history-guards`](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/patient-address-history-guards?expand=1) (`937442c3dc074f92bb8e39153785f9b200e228bb`) | Preserve patient/address references across every booking state and report history; reject another customer's default address; validate calendar dates and return clear errors for deletion races. | Backend typecheck/build and 304 mocked unit/controller tests passed. |
| [`fix/web-report-downloads`](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/web-report-downloads?expand=1) (`91f0782143e4d3026687b5ee524f3d1923c31838`) | Authenticated report download route checks current report/file access and fetches a freshly signed storage URL. Customer and staff pages get visible list retry and download failure/retry handling. | Backend typecheck/build and 288 mocked tests; web production build; mocked Chromium customer/staff retry and download flows passed. |
| [`fix/mobile-patient-pagination`](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/mobile-patient-pagination?expand=1) (`be5a8c41c6721e7fa4ea74e5e4d0839b5aa3e1c2`) | Customer patient list loads later pages, retains results after page failures and offers retry instead of showing a false empty state. | Mobile typecheck, 76 Jest tests and lint with 0 errors/52 existing warnings passed locally. |

Suggested PR titles and descriptions:

- `fix: protect patient and address history during deletion` — Prevent deletion of patients or addresses referenced by bookings, reports or patient defaults; validate default-address ownership and birth dates. Backend typecheck/build and 304 local mocked tests passed. Real database concurrency and GitHub CI remain unverified.
- `fix: load all customer patients in mobile list` — Load paginated customer patients with refresh and retry states. Mobile typecheck, 76 tests and lint with 0 errors passed locally; native/device and GitHub CI remain unverified.
- `fix: provide authorized web report downloads and retry states` — Serve report files through an ownership-checked endpoint with a fresh storage signature; give customer/staff pages clear loading, error and retry behavior. Backend typecheck/build, 288 mocked tests, web build and mocked Chromium flows passed. Real storage and GitHub CI remain unverified.

## Remaining work and limits

| Priority | Work | Current blocker or next verification |
| --- | --- | --- |
| P0 | Observe each PR's required GitHub checks before merging. | GitHub PR/Actions/branch-protection API requests return `Forbidden`; no GitHub CI run or protection rule can be claimed as verified. Opening a PR to main should trigger the configured jobs if Actions is enabled. |
| P1 | Validate report/download and deletion races with a disposable PostgreSQL database and test storage account. | Prisma native engine checksum downloads return HTTP 403 in this environment. Local tests use mocks; no designated database/storage account was supplied. |
| P1 | Audit historical Stripe and notification rows on designated data. | Older code could store Stripe intents labeled CASH or notification logs without a user ID. Do not silently modify or expose existing financial/private records. |
| P2 | Exercise reminder timing, duplicate dispatch and retry with test Redis and notification adapters. | Worker code exists; external delivery and multi-instance/restart behavior remain unverified. Do not send real messages during tests. |
| P2 | Decide retention for report records left after a failed attachment upload. | Text-only clinical reports are valid; automated deletion needs a retention rule. |
| P2 | Paginate/search the staff patient directory beyond its current first 100 records. | The staff screen loads a single 100-record page and searches only those loaded records; server search and mobile paging need a focused API/UI change. |
| P2 | Complete native mobile build/device verification. | JDK 17, Android SDK/emulator and iOS/macOS tooling are unavailable here; TypeScript and Jest do not replace device testing. |

No production migration, real message, live payment or clinical-record deletion was run
in this review. The new task branches have been pushed but not merged.

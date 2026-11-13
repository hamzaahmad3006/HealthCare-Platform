# Verified web and backend progress

Reviewed 2026-11-13 against fetched `origin/main` at `5ea63ccccf8ea94d27257c1b9f868922c52fe92f`.
This replaces the old estimates and missing-feature claims. Code present, locally tested,
merged, and verified against external services are separate states. The project is not
being declared complete or production-ready.

## Previous work verified in main

Git ancestry contains PR #21 (staff booking/report access), #22 (web rescheduling),
#23 (mobile types/setup), and #24 (mobile doctor booking). GitHub API access was denied,
so PR status is inferred only from the fetched merge commits, not a live API response.

| Previously listed gap | Current evidence |
| --- | --- |
| Single service/package/review endpoints | `serviceType.routes.ts`, `package.routes.ts`, `review.routes.ts` contain GET by ID. |
| Admin notification management | `/admin/notifications` has filtering/pagination; the web Notifications page and retry endpoint exist. This is separate from the personal `/notifications` feed. |
| Notification templates | `template.helper.ts` contains STAFF_EN_ROUTE, VISIT_REMINDER, REPORT_AVAILABLE, BOOKING_RESCHEDULED and PACKAGE_RENEWAL. Presence does not prove delivery. |
| Reminder scheduler | `worker/reminder.worker.ts` exists. Timing, restart recovery and multiple-worker behavior still need service-backed validation. |
| Staff availability | Web staff profile calls the availability API. Server verification restrictions are also part of the unmerged recovery/onboarding branch. |
| Customer/admin rescheduling | Both interfaces and server ownership/state rules exist. Mocked Chromium tests passed for local time, failure recovery, refreshed actions, admin reconfirmation and cancellation. |

`feat/mobile-recovery-and-onboarding` at `7f63122621677b84d9d63645bb8f78fdb20feeda`
is **not in main**. Its password recovery, staff profile/document workflows and backend
verification gates were preserved, not reimplemented.

## Fixes implemented in this review, awaiting manual merge

All five branches below start independently from the main commit above. No task branch
contains another task's commits. A temporary, detached worktree combined all five plus
recovery/onboarding without conflicts. That worktree was only for local verification;
main was not merged or pushed.

| Branch / commit | Result | Local validation |
| --- | --- | --- |
| `fix/payment-access-and-state` / `1dd2863da96174ed250cd757e55199a5850c187d` | Booking-scoped payment reads; stable cash receipt audit fields; stale callbacks cannot regress paid/refunded invoices or reopen clinical bookings; validated intent payload/method and no second payment channel for a cash invoice. | Backend typecheck/build; 202 tests, including 25 new payment cases. Provider/database mocked. |
| `fix/web-signed-uploads` / `7656990893f7b142e07b357a5aa178b886c389f6` | Shared document/avatar/report multipart uploader sends only signed fields, validates storage response and permits document-list retry. | Web production build; 186 backend/helper tests; mocked Chromium document-list failure/retry, failed upload without confirmation, same-file retry and refreshed list. |
| `fix/mobile-lint-ci` / `875e8a48d9eba90cc0412b68a7fc88f8caba4246` | Explicit Node Buffer import, removal of unused login-hook navigation argument, mobile lint CI step. | Mobile lint: 0 errors, 38 existing warnings; typecheck; 34 tests. No native/UI behavior change. |
| `fix/report-file-confirmation` / `00510036fe5d1df67aaccaee5deb421b1d0c4d7a` | Report-specific storage account/path and metadata validation; serializable authorization/file/notification transaction; identical confirmation retries do not create duplicate files/messages. | Backend typecheck/build; 193 tests, including existing web/mobile payload checks and 16 new validation/transaction cases. Real PostgreSQL concurrency remains unverified. |
| `fix/notification-recipient-access` / `87e682d5a4ba403c6eebb198ede59eebfaa7d049` | Personal notifications require the intended recipient and current booking access; former assignments do not grant access; eligible preferred doctors see pending requests. Admin access and response array preserved. | Backend typecheck; 186 tests including 9 new notification access cases; combined backend build passed. |

Suggested review order: payment access, report confirmation, notification access,
web uploads, mobile lint. There is no required dependency order between these five.
Recovery/onboarding may merge before or after them; the combined versions passed the
checks below. Merge this progress documentation when its recorded state is still accurate.

## Combined local verification

- Backend typecheck and build passed; **278 tests in 15 suites passed** with all five
  fixes plus recovery/onboarding. Database/provider/queue boundaries are mocked.
- Web production build passed. The browser checks used mocked API/storage responses,
  synthetic patient/file data, and Asia/Karachi for booking local-time checks.
- Mobile typecheck passed; **72 tests in 7 suites passed** with recovery/onboarding.
  Lint passed with zero errors and 52 warnings on that combined tree.
- All task diffs were reviewed and checked with `git diff --check` before commit.
- No real messages, live payments, production migrations or production record changes
  were executed. No credentials, generated API host files or build output were committed.

## Remaining work and exact limits

| Priority | Remaining work | Blocker / prerequisite |
| --- | --- | --- |
| P0 | Observe CI and required checks, then review/merge the security fixes. | GitHub GraphQL and Actions REST queries return `Forbidden`. CI is **unverified**, not passed. All code branches are **NOT READY TO MERGE** until required checks are observed and review gates are satisfied. |
| P1 | Validate report transactions, assignment changes and callback races against a disposable PostgreSQL database. | Normal `prisma generate` fails downloading the native engine checksum from `binaries.prisma.sh` with HTTP 403. Local checks reused the configured engine-free client; that is not live database verification. No designated database integration was run. |
| P1 | Verify signed uploads/downloads and payment callbacks with test provider accounts. | No designated Cloudinary/Stripe test integration is configured. Browser/provider mocks cannot prove remote signatures or provider delivery. No production URL/provider was invented or live transactions enabled. |
| P1 | Audit historical payment and notification rows before deployment. | Older code could store a Stripe intent with `paymentMethod=CASH`; older notification rows may have null `userId`. Read-only review on designated data is needed before deciding any backfill/reconciliation. The fixes deliberately do not grant broad access to legacy null-recipient records or silently switch cash invoices to Stripe. |
| P1 | Review and merge recovery/onboarding; then exercise recovery, rejected-document correction, verification and work restrictions with test integrations. | Branch is still unmerged; reset-message/storage integration and native/device behavior remain unverified. |
| P2 | Exercise reminder timing, restart recovery, duplicate dispatch and admin retry against test Redis/notification adapters. | Worker code is present, but no external delivery test was run. Memory fallback is single-process; deployment topology and test services must be established before claiming multi-instance reliability. |
| P2 | Decide retention/cleanup of report shells left by a failed file upload. | Text-only reports are supported; deleting apparently empty clinical records requires an explicit retention rule. No existing clinical records were deleted. |
| P2 | Native mobile release/device verification. | Java 21 is installed; required JDK 17, Android SDK tools/emulator and iOS/macOS tooling are unavailable. No native build/device pass is claimed for this review. |

## PR handoff

Git push succeeded. PR creation is blocked by API access, so use these compare links.
Each row provides a suggested title and description; append its local validation and
limits from the tables above. No branch has been merged by this review.

| Compare link / suggested title | Suggested description |
| --- | --- |
| [fix: enforce payment access and monotonic settlement](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/payment-access-and-state?expand=1) | Reuse booking access checks for payment reads, preserve cash collection audit fields on retries, and settle provider payments without changing booking lifecycle. Reject conflicting payment channels and validate settlement metadata. 202 mocked backend tests and typecheck/build pass; provider/database integration and GitHub CI remain unverified. |
| [fix: align web uploads with signed storage contract](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/web-signed-uploads?expand=1) | Remove unsigned multipart fields from staff uploads, share the uploader across documents/avatars/reports, validate provider responses and add document-list retry. Production build, 186 helper/backend tests and mocked Chromium upload checks pass; real storage integration and GitHub CI remain unverified. |
| [fix: clear mobile lint errors and enforce lint in CI](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/mobile-lint-ci?expand=1) | Import Buffer explicitly and remove the unused login-hook navigation argument; run mobile lint in CI. Local lint has zero errors, typecheck and 34 tests pass. Existing warnings remain; GitHub CI and native/device checks are unverified. |
| [fix: validate and atomically confirm report uploads](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/report-file-confirmation?expand=1) | Validate the report-specific asset path and metadata, commit file/notification records together, and reuse an existing file on identical confirmation retries. 193 mocked tests and backend typecheck/build pass; PostgreSQL concurrency, real storage and GitHub CI are unverified. |
| [fix: scope notifications to recipients and current booking access](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/notification-recipient-access?expand=1) | Prevent assignment-history access to another recipient's messages and preserve eligible preferred-doctor request notifications. Keep the web/mobile response array. 186 mocked backend tests and typecheck pass; combined build passes; GitHub CI remains unverified. |
| [docs: replace stale gaps with verified project progress](https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...docs/verified-project-progress?expand=1) | Replace outdated feature-gap claims with fetched merge ancestry, implemented branch handoffs, local evidence and explicit integration/device blockers. Documentation does not claim the project is complete or CI passed. |

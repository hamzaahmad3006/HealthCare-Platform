# Booking idempotency — SRS 5.3

Branch: `fix/booking-idempotency-isolation`, based on main `00ac48e`.
The earlier pending fixes were merged before this task began.

## Behavior

- An optional `X-Idempotency-Key` accepts 1–128 letters, digits, hyphens or underscores;
  existing UUID web keys and `mbk-*` mobile keys remain supported.
- The key is hashed with the authenticated actor, role and booking-create operation.
  Request identity is a canonical hash of the validated booking payload. No raw key
  or full request body is stored in the new table.
- A request record is committed in the same Serializable transaction as the booking,
  visits and notification logs. Its primary key prevents two successful commits for
  the same scoped key. Redis availability or cache resets cannot remove this guard.
- Identical retries return 200 with the same booking ID and its current state; new
  bookings return 201. Replays do not regenerate visits or queue notifications again.
- Reusing an active key for changed input returns 409 `IDEMPOTENCY_KEY_REUSED`.
  Serialization conflicts without a visible winner return 409 `BOOKING_RETRY` with
  `Retry-After: 1`; retry the same payload and key.
- The guarantee lasts 24 hours, matching the original cache TTL. Reuse after expiry
  is a new operation. Requests without a key retain legacy behavior and are not
  deduplicated. Web/mobile always send keys; changed payloads generate new keys.
- Mobile double taps share the pending request. Network failures retain the key
  while the form remains mounted. Process-death/offline request persistence is a
  separate SRS offline-sync task, not implemented here.

## Deployment and compatibility

Apply the additive `20261114090000_booking_creation_requests` migration before the
new backend version. No production migration was executed during development.
Old globally scoped Redis entries are intentionally not replayed. Retry guarantees
begin with requests handled by this version; coordinate deployment around pending
legacy submissions. Expired records may be pruned later using the expiry index;
no clinical bookings should be removed for request-record cleanup.

The existing response envelope and request payload are unchanged. Notification
recovery after a process crashes between DB commit and enqueue remains a separate
notification-durability task.

## Validation

Passed locally:
- Backend typecheck/build and 331 mocked unit/controller tests.
- Mobile typecheck, 82 tests and lint (0 errors, 52 existing warnings).
- Web production build and mocked Chromium booking retry/payload-change regression.
- All SQL migration files applied successfully to an isolated PostgreSQL 15 container.

Blocked locally:
- Real Prisma/PostgreSQL concurrency test: `prisma generate` cannot download its
  native engine because binaries.prisma.sh returns HTTP 403. The configured
  engine-free client supports typechecks/mocks but rejects direct PostgreSQL URLs.
  This failed integration attempt is not a passing database concurrency test.
- GitHub CI and native/device verification have not been observed.

The new `Booking idempotency (PostgreSQL)` CI job creates a disposable database,
installs/generates Prisma, applies migrations, and runs the real integration test.
It verifies concurrent requests leave exactly one booking, visit, request record
and notification, plus changed-payload rejection and separate customer scopes.
Merge readiness is blocked until this job and the existing checks pass.

Run integration locally with a normal native Prisma client:

```sh
cd healthcare-backend
# Apply migrations to the disposable database first; never use the application DB.
TEST_DATABASE_URL=postgresql://test:test@localhost:55439/healthcare_idempotency_test npm run test:integration
```

The test refuses non-local URLs and database names outside `healthcare_*_test`.
Provider notifications are mocked. Unit tests never automatically run DB tests.
The browser regression requires Playwright and a local web preview on port 5174:
`CHROMIUM_PATH=/usr/bin/chromium node healthcare-web/tests/browser/booking-idempotency.cjs`.

## PR

Title: **fix: isolate and persist booking idempotency**

Description: Prevent cross-user replay and duplicate booking commits by persisting
actor-scoped request identities atomically with booking creation. Keep retry keys
stable in web/mobile and reject changed payload reuse. Add unit, mobile, browser
and PostgreSQL concurrency regression coverage. Local builds/unit/browser checks
and SQL migrations passed; native Prisma integration was blocked by engine download
HTTP 403, so the added PostgreSQL CI job must pass before merge.

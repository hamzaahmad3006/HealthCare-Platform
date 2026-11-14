# Review record authorization

Branch: `fix/review-record-authorization`; base: `main` (`00ac48e`). Independent of the idempotency, audit privacy and secure mobile storage branches.

Review creation now validates customer ownership, optional visit membership/completion and optional staff service participation. Completed visits can be reviewed while a recurring booking is active; booking-level reviews still require a completed booking. Detail access is restricted to administrators, the submitting customer and the reviewed staff member with a matching completed visit. Historical client-supplied staff IDs alone do not grant access.

Eligibility checks, duplicate lookup and insertion run in a Serializable transaction. Concurrent transaction conflicts return HTTP 409 for retry. This does not clean historical duplicate or incorrectly linked reviews. Existing booking-level web request fields and response envelopes are preserved. No frontend redesign or mobile review screen is included.

Validation: 329 backend unit/API tests, backend typecheck/build, web production build and diff whitespace check pass. API tests use mocked database/authentication, real routing and role middleware; they cover unrelated customer/staff access, fabricated visit/staff targets, unfinished states, legacy booking payloads, completed recurring visits, duplicates and transaction-conflict responses. Native database concurrency/rollback is not verified because Prisma native engine downloads remain blocked. GitHub API returns Forbidden; GitHub CI has not been observed. No live notifications, payments or production data were used.

PR title: Enforce review ownership and booking/visit/staff integrity

PR description: Restrict review detail access and validate every supplied booking, visit and staff association before inserting feedback. Permit completed-visit reviews for active recurring bookings, preserve booking-level request compatibility, and make duplicate checks/inserts transactional. Add API regression tests. Local backend tests/typecheck/build and web build pass; real PostgreSQL concurrency validation and GitHub CI remain pending.

NOT READY TO MERGE until database concurrency validation and required CI results are available. Target main; no required merge order relative to other current branches. Documentation append conflicts may need resolving if multiple branches merge first.

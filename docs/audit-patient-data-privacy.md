# Audit and request-error privacy — SRS 13/15

Branch: `fix/audit-patient-data-privacy`, independently based on main `00ac48e`.
No dependency on `fix/booking-idempotency-isolation`.

New successful mutation audits retain actor, action, resource reference, IP and
creation time. Payloads contain only `valuesOmitted: true` and a top-level field
count. They never copy request values, nested content or arbitrary client field
names. User-agent headers are fingerprinted instead of stored in plaintext.
Resource types are resolved from a fixed vocabulary and IDs must be UUIDs; the
resource is captured before Express changes the mounted request context.

Request error logging no longer includes raw exception messages/objects, URL
parameters or Prisma validation input. It retains a safe error category and UUID
request ID. Invalid incoming correlation IDs are replaced with a server-generated
UUID. Existing application error responses/status codes remain intact.

This intentionally reduces diagnostic detail: clinicians' data must not be copied
into a secondary log store. The admin audit payload viewer can still render the
summary without an API shape change.

Historical audit/log records were not deleted or rewritten. Review retention and
existing deployments separately with authorized test/administrative data. This
change covers mutation audit storage and the global request-error boundary; it is
not a certification of every provider, infrastructure or external logging sink.

## Validation

- Backend typecheck and build passed.
- 325 unit/controller tests passed, including ten new privacy regressions.
- Tests cover nested clinical input, arbitrary field names, raw user-agent values,
  unknown resource paths, audit persistence failures and Prisma/unknown exceptions.
- Full diff and whitespace checks reviewed.
- No database migration or web/mobile change required; their builds were not rerun
  for this independent branch.
- GitHub API returned Forbidden. Actual CI results are unobserved; merge only after
  the required checks pass. Existing historical-data cleanup is not included.

## PR

Title: **fix: keep clinical request data out of audit and error logs**

Description: Replace copied mutation bodies with value-free audit summaries while
retaining actor/action/resource/IP metadata. Fingerprint user agents, validate
request correlation IDs and omit raw exceptions/URL parameters from global error
logs. Backend typecheck/build and 325 tests passed locally. Historical log records
are unchanged; GitHub CI remains unverified.

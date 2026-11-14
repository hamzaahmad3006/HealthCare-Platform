---
name: healthcare-web-testing
description: Verify and repair the existing web and backend workflows using isolated test data, role-based authorization checks, and honest validation reporting.
---

# Healthcare web and backend testing

Read applicable AGENTS.md files and current source, routes, configuration and package scripts. Fetch the remote and inspect main, relevant unmerged branches and local changes before choosing a base. Preserve existing work and do not duplicate unmerged fixes. Treat old documentation and the healthcare-qa examples as leads, not verified contracts. Explicit user instructions override this skill.

Use the configured environment without displaying or committing secret values. Check variable names only. Use a designated local/test database, synthetic accounts and test providers. Confirm the target and backup before applying migrations; never run destructive production migrations, live payments or real notifications. If a prerequisite is missing, report the exact blocker and continue independent checks.

Run backend typecheck, unit tests and build and web typecheck, available tests and production build. Exercise real browser/API flows when supported: customer authentication, patients, addresses, booking, duplicate submission, reschedule/cancel, reports and reviews; staff assignment and visit actions; admin confirmation and administration. Check customer/staff/admin permissions and cross-user access, server-side validation, state transitions, loading, empty, retry and failure states. Test notifications and payments with mocks or sandbox adapters only. Avoid printing tokens or patient information.

For confirmed defects, implement focused changes on a descriptive branch from the appropriate current base, preserve architecture and add meaningful regression tests. Review the complete diff, rerun affected checks and follow the user's commit/push/PR instructions. Never claim integration, browser or CI checks passed unless observed. Report per-check pass/fail/blocked, test environment, branch and SHA, remaining risks and merge readiness.

---
name: healthcare-mobile-testing
description: Verify mobile customer and staff workflows, native builds, device behavior and API integration with test accounts and safe configuration.
---

# Healthcare mobile testing

Read applicable AGENTS.md files, current mobile and backend code, and package scripts. Fetch remote state; inspect main, unmerged work and local changes before choosing a base. Preserve existing work and reuse existing features. Explicit user instructions override this skill.

Use configured development settings and designated test accounts. Check configuration variable names without displaying values. Never log or commit tokens, passwords, OTPs, credentials or environment files; never invent a production URL. Use test messaging, uploads and payment adapters; do not send real messages or change production data.

Run mobile lint, TypeScript typecheck and tests. Attempt Android debug build when JDK/SDK are available, and iOS build only on a supported macOS/Xcode host. Record emulator/device and OS versions when used. Exercise available customer login, recovery, booking and doctor proposals; staff onboarding, document upload, verification and visit actions; notifications, role restrictions, refresh/logout, app restart and secure-session migration. Test validation, empty/loading/retry states, network and upload failures using synthetic data. Verify backend authorization independently of client UI where the test environment permits.

Fix confirmed defects on a descriptive branch from the appropriate base, add meaningful regression tests, review the full diff and rerun affected checks. Follow user instructions for commit, push and PR. Report automated TypeScript/tests, native build, emulator/device, integration and GitHub CI results separately as passed, failed or blocked. Clearly identify untested platforms and merge readiness; a typecheck does not validate native behavior.

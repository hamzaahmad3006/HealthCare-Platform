# Mobile secure session storage

Base: `main` at `00ac48e`. Branch: `fix/mobile-secure-session-storage`.

Access and refresh tokens now use react-native-keychain (iOS Keychain / Android Keystore), including login, registration, reset, refresh and password changes. Legacy AsyncStorage tokens migrate only after a secure write succeeds. Store operations serialize; session generations reject refresh responses arriving after logout or a session change. Logout verifies secure deletion and displays a retry error if it fails. Cached user profile data is unchanged; this does not implement encrypted offline clinical storage.

Regression coverage includes successful/failed migration, absence of plaintext token writes, optional refresh-token preservation, late refresh rejection and failed secure deletion. Recovery UI tests retain successful/expired-code coverage.

Local validation: mobile typecheck and 85 Jest tests pass. Lint: no errors (existing warnings and two additional `void` warnings). Android `assembleDebug` attempted with writable Gradle cache, blocked because JDK 17 is unavailable and the foojay toolchain resolver failed. iOS build unavailable on Linux. Native autolinking, fresh install/upgrade migration, locked-device storage, logout and refresh must be exercised on Android and iOS before release. GitHub CI is unobserved; PR CI runs backend tests/typecheck, web typecheck/build, mobile lint/typecheck/tests, not native builds.

PR title: Store mobile session tokens in Keychain and Keystore

PR description: Replace plaintext token persistence with secure native storage across all authentication paths. Migrate existing sessions without deleting legacy tokens before successful persistence, prevent late token rotation after logout, and surface secure deletion failures. Add storage regression tests and retain recovery UI coverage. Local mobile tests and typecheck pass; native build/device verification remains blocked as described above.

Readiness: NOT READY TO MERGE until native dependency build and device storage verification are available. No dependency on the separate booking-idempotency or audit-privacy branches; target main.

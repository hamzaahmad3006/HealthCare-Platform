# Admin settings regression

Prerequisites: web dependencies, Playwright available to Node, and Chromium.
Build the web app and run its local preview on port 5174, then from repository root:

```sh
CHROMIUM_PATH=/usr/bin/chromium node healthcare-web/tests/browser/admin-settings.cjs
```

Omit CHROMIUM_PATH for Playwright's installed Chromium. WEB_TEST_URL overrides the
local preview address. API responses are synthetic and no settings are persisted.
The test verifies failed loads, repeated retries, recovery and create-button states
in all three tabs. It also delays an older package-filter failure until the newer
request succeeds, and verifies that current results stay visible.

This test requires no backend/database. It does not establish real API integration
or GitHub CI success and is not yet included in GitHub Actions.

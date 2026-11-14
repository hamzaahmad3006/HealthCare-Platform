# Staff patient list regression

Prerequisites: web dependencies, Playwright available to Node, and a Chromium browser.
No backend, database or notification provider is required; API responses are mocked.

```sh
cd healthcare-web
npm run build
npm run preview -- --host 127.0.0.1 --port 5174 --strictPort
# In another terminal, from the repository root:
CHROMIUM_PATH=/usr/bin/chromium node healthcare-web/tests/browser/staff-patients.cjs
```

Omit CHROMIUM_PATH to use Playwright's installed Chromium. WEB_TEST_URL can override
http://127.0.0.1:5174. The test checks initial and next-page failures, retrying the
same page, clearing old errors, previous-page navigation and successful empty results.
This is a mocked browser regression, not evidence of live API integration. It is not
currently part of GitHub Actions.

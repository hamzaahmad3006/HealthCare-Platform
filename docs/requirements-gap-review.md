# Requirements gap review — 2026-11-14

**Update:** The SRS was subsequently supplied and inspected. See
[SRS assessment](srs-implementation-assessment.md) for the scored requirements
review and newly confirmed gaps. The missing-document notes below describe the
earlier snapshot; a separate PRD is still unavailable.

## Evidence and scope

Latest fetched main: `08444c350e93f21c9559f3f61c632b374d8e6e6b`.
The working tree and main's tracked file list contain no original PRD or SRS.
README and backend comments reference SRS sections; the repository QA checklist
is a testing guide, not a substitute for those specifications. The original file
paths or document links were requested. Requirement-by-requirement completeness
cannot be established until those sources are available.

No applicable AGENTS.md was found. Existing work was clean and preserved. The
previous staff-access, rescheduling, mobile setup, doctor booking and recovery/
onboarding work is in main. The five branches listed below were still unmerged at
this review; their fixes must be reused, not implemented again.

## Prioritized checklist

| Priority | Item | Verified status / next step |
| --- | --- | --- |
| P0 | Match every PRD/SRS requirement to web, mobile, backend and acceptance tests | Blocked: original PRD/SRS documents unavailable. Obtain authoritative files/links; do not infer missing product features from old progress notes. |
| P1 | Patient/address history and default-address ownership | Already implemented on `fix/patient-address-history-guards`, awaiting merge and remaining integration checks. |
| P1 | Authorized web report downloads and retry | Already implemented on `fix/web-report-downloads`, awaiting merge and test-storage checks. |
| P1 | Web staff patient list recovery | Fixed on `fix/web-staff-patient-retry` at `375e73c8817499b72d7a33cf347686b74542bbae`. Retry the same page, clear old errors and avoid false empty/stale lists on failures. |
| P1 | Admin settings failure and package-filter response ordering | Fixed on `fix/web-admin-settings-retry` at `bb1003274d585e0546766c17345cb195417370d8`. All three tabs have persistent retry states; old responses cannot overwrite newer results. |
| P2 | Customer mobile patient pagination | Already implemented on `fix/mobile-patient-pagination`, awaiting merge. |
| P2 | Staff patient search and paging | Already implemented on `fix/staff-patient-directory-search`, awaiting merge. |
| P2 | Progress documentation | Existing `docs/refresh-merged-project-status` remains unmerged; this review extends it. |
| P2 | Real API/storage/database and worker integration | Remains unverified. Use designated test data and adapters; never send real notifications or perform live payments. |
| P2 | Mobile native builds and device flows | Not performed in this follow-up. Existing TypeScript/Jest results do not establish physical-device behavior. |
| P2 | Run the new browser regressions in GitHub Actions | Scripts are committed with setup instructions. They ran locally with Playwright/Chromium, but are not yet configured as CI jobs. |

## New changes and validation

Both new code branches are independent branches from the main commit above. Target
`main` for both PRs; there is no dependency between them or on the unmerged mobile
search branch. The documentation branch is also based on that same main commit.
Nothing was merged into main.

- Staff patients: production build passed, including TypeScript. A mocked Chromium
  regression passed first-page failure/retry, second-page failure/retry, clearing old
  errors, previous-page navigation and successful empty results.
- Admin settings: production build passed, including TypeScript. Mocked Chromium
  regressions passed repeated failure/retry and successful empty states for service
  types, packages and cities, disabled create actions while data is unavailable,
  and a late failed package-filter request after a newer successful request.
- Full diffs and whitespace checks were reviewed. No backend/mobile code changed in
  these two branches; their test suites were not rerun during this follow-up.
- GitHub PR API returned `Forbidden`. PR creation and GitHub CI results are unavailable.
  PRs targeting main should run the configured backend, web and mobile jobs if
  Actions is enabled. Actual results must be checked on GitHub.

## PR copy

### fix/web-staff-patient-retry

Title: **fix: recover failed web staff patient lists**

Description: Failed staff patient requests now show a retry action for the same page
and no longer appear as empty results. Successful retries clear old errors. Web
production build and mocked Chromium pagination/recovery regression passed. Real
backend integration and GitHub CI remain unverified.

Compare: https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/web-staff-patient-retry?expand=1

### fix/web-admin-settings-retry

Title: **fix: recover admin settings loads and ignore stale responses**

Description: Service types, packages and cities now show persistent retry states
when loading fails. Create actions wait for a successful load, and stale package
filter responses cannot replace current results. Web production build and mocked
Chromium regressions passed for all three tabs and response ordering. Real backend
integration and GitHub CI remain unverified.

Compare: https://github.com/hamzaahmad3006/HealthCare-Platform/compare/main...fix/web-admin-settings-retry?expand=1

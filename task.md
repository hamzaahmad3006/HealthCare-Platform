# Mobile App — Remaining Tasks

Healthcare Home Services Platform — **healthcare-mobile** (React Native)
Backend base URL: `/api/v1`. All endpoints below already exist and work on the backend — only the mobile wiring is missing.

---

## 1. Customer App

| Screen | Endpoint(s) to wire | Priority | Effort | Notes |
|---|---|---|---|---|
| **New Booking flow** `NewBooking/*` | `GET /service-types`, `GET /packages?serviceTypeId=`, `GET /users/patients`, `GET /users/addresses`, `POST /bookings` | 🔴 High | 3 hr | Steps 2/3/4 are not assembled in navigation. Build the Step 1→4 wizard with shared state, then submit `POST /bookings` (send `X-Idempotency-Key` header). This is the biggest gap. |
| **Home — Services grid** `Home/Home.tsx` | `GET /service-types` | 🟡 Medium | 30 min | Grid is a hardcoded list. Fetch real service types; tap → New Booking pre-selected. |
| **Account — Add address** `Account/Account.tsx` | `POST /users/addresses` | ⚪ Low | 1 hr | "Add" button is a no-op. Needs a city/zone picker (`GET /cities`) + create form. (List/read is already wired.) |
| **Notifications** (bell icon, all screens) | `GET /notifications` | 🟡 Medium | 1 hr | Bell icons are decorative. Add a notifications list screen + unread badge. |

## 2. Staff App

| Screen | Endpoint(s) to wire | Priority | Effort | Notes |
|---|---|---|---|---|
| **Staff Home** `staff/Home/Home.tsx` | `GET /visits`, `PATCH /staff/:id/availability` | 🟠 High | 1.5 hr | Stats, next patient, and "later today" list are mock. Duty toggle is local-only. |
| **Staff Visits** `staff/Visits/StaffVisits.tsx` | `GET /visits` | 🟠 High | 1 hr | Hardcoded empty list. Fetch and group into Today / Upcoming / Completed. |
| **Visit Detail** `staff/VisitDetail/VisitDetail.tsx` | `GET /visits/:id`, `PATCH /visits/:id/en-route` · `/check-in` · `/check-out` · `/complete`, `POST /reports` (+ presign/confirm) | 🟠 High | 2 hr | Patient data hardcoded; Mark-En-Route and Upload-Report are no-ops. Wire the full visit lifecycle + report upload. Also add navigation from Staff Visits → Visit Detail. |
| **Staff Reports** `staff/Reports/StaffReports.tsx` | `GET /reports` | 🟡 Medium | 30 min | Hardcoded empty list. Fetch staff-submitted reports. |
| **Staff Patients** `staff/Patients/StaffPatients.tsx` | `GET /users/patients` | 🟡 Medium | 45 min | Not in `StaffTabs` yet + list is mock. Add tab/route and wire directory + search. |
| **Staff Profile — extras** `staff/Profile/StaffProfile.tsx` | `PATCH /staff/:id/availability`, `PATCH /auth/change-password` | 🟡 Medium | 45 min | Availability toggle is local-only; Change-Password row is a no-op. (Profile display + logout already wired.) |

## 3. Cross-cutting

| Task | Endpoint(s) | Priority | Effort | Notes |
|---|---|---|---|---|
| **Register screen** | `POST /auth/register` | 🟡 Medium | 1 hr | No sign-up UI exists (only Login). Endpoint + auth handling are ready. |
| **Reschedule handling** | `PATCH /bookings/:id/reschedule` | ⚪ Low | 15 min | Backend gates this `adminOnly` → a customer call returns 403. Either hide reschedule from the mobile UI or coordinate a backend ownership-check relaxation. |
| **Empty/error/loading states** | — | 🟡 Medium | ongoing | Apply the `useMyBookings` loading/empty/refresh pattern to each newly-wired staff screen. |

---

## Effort Estimate

| Item | Effort | Priority |
|---|---|---|
| New Booking flow (Steps 2–4 + `POST /bookings`) | 3 hr | 🔴 High |
| Visit Detail lifecycle + report upload | 2 hr | 🟠 High |
| Staff Home (visits + duty toggle) | 1.5 hr | 🟠 High |
| Staff Visits list | 1 hr | 🟠 High |
| Notifications list + badge | 1 hr | 🟡 Medium |
| Register screen | 1 hr | 🟡 Medium |
| Account add-address (city picker) | 1 hr | ⚪ Low |
| Staff Profile extras (availability + password) | 45 min | 🟡 Medium |
| Staff Patients (tab + wire) | 45 min | 🟡 Medium |
| Home services grid | 30 min | 🟡 Medium |
| Staff Reports list | 30 min | 🟡 Medium |
| Reschedule 403 handling | 15 min | ⚪ Low |

**Total estimated: ~13 hours**

---

## Status Legend
- 🔴 High / blocker — core flow missing
- 🟠 High — whole staff area depends on it
- 🟡 Medium — feature incomplete
- ⚪ Low — nice-to-have / edge case

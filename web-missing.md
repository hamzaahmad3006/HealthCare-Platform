# Web Missing — SRS Gap Analysis
Healthcare Home Services Platform — Faisalabad, Pakistan

---

## 1. Backend — Missing Endpoints

### 1.1 Public Reference Endpoints
| Endpoint | SRS Section | Notes |
|---|---|---|
| `GET /service-types/:id` | 4.4 | Single service type by ID |
| `GET /packages/:id` | 4.5 | Single package by ID |
| `GET /reviews/:id` | 4.9 | Single review by ID |

### 1.2 Admin Notifications List
| Endpoint | SRS Section | Notes |
|---|---|---|
| `GET /notifications` | 4.10 | Admin can list all notification logs with filters (status, booking_id, template_code) |

---

## 2. Backend — Missing WhatsApp Notification Templates

Worker exists and BOOKING_RECEIVED, BOOKING_CONFIRMED, STAFF_ASSIGNED are implemented.
The following are missing:

| Template Code | Trigger | SRS Section |
|---|---|---|
| `STAFF_EN_ROUTE` | Staff marks visit en-route | 8 |
| `VISIT_REMINDER` | Scheduled job — 60 min before visit | 8 |
| `REPORT_AVAILABLE` | Staff uploads a report | 8 |
| `BOOKING_RESCHEDULED` | Admin reschedules a booking | 8 |
| `PACKAGE_RENEWAL` | Package nearing completion | 8 |

---

## 3. Backend — Missing Scheduled Job

| Job | Description | SRS Section |
|---|---|---|
| Visit Reminder Scheduler | Cron/worker that checks upcoming booking_visits and creates VISIT_REMINDER notification 60 min before scheduled_start_at | 8 (Reminder Scheduling) |

---

## 4. Web Frontend — Admin Portal

| Feature | Notes |
|---|---|
| **Notifications List Page** `/admin/notifications` | Table of all notification_logs — status, template, recipient, sent_at. Already has retry button in backend. Needs GET /notifications endpoint + page |

---

## 5. Web Frontend — Staff Portal

| Feature | Notes |
|---|---|
| **Availability Toggle** `/staff/profile` | Staff can toggle their own `isAvailable` flag. Backend endpoint exists: `PATCH /staff/:id/availability`. Just needs a toggle button on the staff profile page |

---

## 6. Web Frontend — Customer Facing

| Feature | Notes |
|---|---|
| **Booking Reschedule** `/my-bookings/:id` | Customer can request reschedule from booking detail page. Backend endpoint exists: `PATCH /bookings/:id/reschedule`. Needs date picker + confirm UI on customer booking detail |

---

## 7. Admin — Booking Reschedule UI

| Feature | Notes |
|---|---|
| **Reschedule from Admin Booking Detail** | Backend endpoint exists (`PATCH /bookings/:id/reschedule`). Admin booking detail page has no reschedule button yet |

---

## Summary — Effort Estimate

| Item | Effort | Priority |
|---|---|---|
| Staff availability toggle (frontend only) | 15 min | High |
| Admin notifications list page (backend + frontend) | 45 min | High |
| Booking reschedule UI — admin side (frontend only) | 30 min | Medium |
| Booking reschedule UI — customer side (frontend only) | 30 min | Medium |
| WhatsApp missing templates (backend only) | 1 hr | Medium |
| Visit reminder scheduler (backend only) | 1.5 hr | Medium |
| Missing GET by ID endpoints (backend only) | 15 min | Low |

**Total estimated: ~4.5 hours**

---

## Status Legend
- ❌ Not started
- ⚠️ Backend ready, frontend missing
- ✅ Complete

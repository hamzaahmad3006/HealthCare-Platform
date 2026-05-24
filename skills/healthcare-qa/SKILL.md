---
name: "Healthcare Platform QA"
description: "Full QA audit for HealthCare Home Services Platform — browser-based UI testing for all 3 roles (Customer, Staff, Admin) + backend security penetration checklist. Catches broken buttons, missing flows, auth bypasses, IDOR, and data leaks."
version: "1.0.0"
category: "quality-assurance"
tags: ["qa", "testing", "security", "browser", "healthcare", "penetration-testing"]
triggers:
  - /healthcare-qa
  - qa platform
  - test platform
  - security audit
---

# Healthcare Platform QA Skill

## What This Skill Does

End-to-end quality check of the entire Healthcare Home Services Platform:

1. **UI/UX Testing** — opens browser, clicks every button, fills every form for all 3 roles
2. **Role Isolation Testing** — verifies CUSTOMER cannot see STAFF/ADMIN pages and vice versa
3. **Backend Security Audit** — checks for IDOR, auth bypass, SQL injection, XSS, sensitive data exposure
4. **Notification Flow Check** — verifies WhatsApp triggers fire correctly
5. **Edge Case Testing** — empty states, invalid inputs, expired tokens, concurrent actions

---

## Prerequisites

```bash
# Both servers must be running:
cd healthcare-backend && npm run dev        # http://localhost:4000
cd healthcare-web    && npm run dev        # http://localhost:5173

# Test accounts needed in DB (or create via registration):
# CUSTOMER: customer@test.com / Test@1234
# STAFF (nurse, verified): staff@test.com / Test@1234
# STAFF (doctor, verified): doctor@test.com / Test@1234
# ADMIN: admin@test.com / Test@1234
```

---

## Phase 1 — Customer Role UI Testing

### 1.1 Auth Flow

```bash
# Open landing page
agent-browser open http://localhost:5173
agent-browser snapshot -i
# EXPECT: Hero section, "Book Now" CTA, TopNav visible

# Register new customer
agent-browser click --find "Register" or "/auth/register"
agent-browser fill [fullName] "QA Customer"
agent-browser fill [phone] "03001234567"
agent-browser fill [email] "qa@test.com"
agent-browser fill [password] "Test@1234"
agent-browser click [Register button]
# EXPECT: Redirect to /auth/login or dashboard

# Login
agent-browser open http://localhost:5173/auth/login
agent-browser fill [phone/email] "customer@test.com"
agent-browser fill [password] "Test@1234"
agent-browser click [Login]
# EXPECT: Redirect to homepage or /my-bookings
# EXPECT: TopNav shows user name + bell icon

# Wrong password
agent-browser fill [password] "wrongpassword"
agent-browser click [Login]
# EXPECT: Error toast, NOT redirected
```

### 1.2 Booking Form (Full Flow)

```bash
agent-browser open http://localhost:5173
agent-browser click [Book Now] or [Get Started]

# Step 1 — Service & Doctor
agent-browser snapshot -i
# EXPECT: Service type dropdown visible
agent-browser select [serviceType] "Visiting Doctor"
# EXPECT: Doctor picker grid appears with verified available doctors
# Select a doctor
agent-browser click [first doctor card]
# EXPECT: Doctor highlighted/selected, "Clear" button visible
agent-browser click [Next]

# Step 2 — Patient & Address
# EXPECT: Patient selector + address selector visible
agent-browser snapshot -i
# Fill patient if none
agent-browser click [Add patient] or fill existing
# EXPECT: Address dropdown with saved addresses

agent-browser click [Next]

# Step 3 — Schedule
agent-browser fill [datetime] "2026-06-10T10:00"
agent-browser select [urgency] "ROUTINE"
agent-browser click [Next]

# Step 4 — Review
agent-browser snapshot -i
# EXPECT: Summary shows service, doctor name, patient, address, date, price
# EXPECT: "Booking pending doctor confirmation" text visible (for doctor booking)
agent-browser click [Confirm Booking]
# EXPECT: Success toast, redirect to /my-bookings

# Repeat for non-doctor service (no doctor picker should appear)
agent-browser open http://localhost:5173
agent-browser click [Book Now]
agent-browser select [serviceType] "Nursing Care"
# EXPECT: No doctor picker section
```

### 1.3 My Bookings & Booking Detail

```bash
agent-browser open http://localhost:5173/my-bookings
agent-browser snapshot -i
# EXPECT: List of bookings with status badges
# EXPECT: Pagination if > 10 bookings

# Click a CONFIRMED booking
agent-browser click [first CONFIRMED booking]
# EXPECT: Booking detail page
# EXPECT: "Reschedule booking" button visible
# EXPECT: "Cancel booking" button visible

# Test Reschedule
agent-browser click [Reschedule booking]
# EXPECT: Modal opens with datetime-local input
agent-browser fill [datetime] "2026-07-01T09:00"
agent-browser click [Confirm reschedule]
# EXPECT: Success toast, booking status changes to RESCHEDULED

# Test Cancel Modal
agent-browser click [Cancel booking]
# EXPECT: Modal opens
# EXPECT: Confirm button is DISABLED until reason typed
agent-browser click [Confirm cancel] -- should be disabled
agent-browser fill [reason] "Changed my mind"
agent-browser click [Confirm cancel]
# EXPECT: Booking status → CANCELLED, button disappears

# PENDING_DOCTOR booking
# EXPECT: Purple banner "Waiting for doctor confirmation"
# EXPECT: NO reschedule/cancel buttons (only pending allowed cancel)

# TIME_PROPOSED booking
# EXPECT: Orange banner with proposed time
# EXPECT: "Accept new time" + "Decline" buttons
agent-browser click [Accept new time]
# EXPECT: Booking → PENDING, banner disappears
```

### 1.4 My Reports

```bash
agent-browser open http://localhost:5173/my-reports
agent-browser snapshot -i
# EXPECT: Table or card list of reports for this customer's bookings
# EXPECT: Download/view button per file
```

### 1.5 My Patients

```bash
agent-browser open http://localhost:5173/my-patients
# EXPECT: List of patient profiles
# EXPECT: Add patient button
agent-browser click [Add patient]
# EXPECT: Form modal opens
agent-browser fill [fullName] "Test Patient"
agent-browser fill [dateOfBirth] "1990-01-01"
agent-browser select [relationship] "SELF"
agent-browser click [Save]
# EXPECT: Patient added to list
```

### 1.6 Account Settings

```bash
agent-browser open http://localhost:5173/account
agent-browser snapshot -i
# EXPECT: Profile section, Saved Addresses section, Change Password section

# Edit profile
agent-browser fill [fullName] "Updated Customer"
agent-browser click [Save changes]
# EXPECT: Success toast

# Add address
agent-browser click [Add address button]
# EXPECT: Modal opens
agent-browser fill [contactName] "QA User"
agent-browser fill [contactPhone] "0300-1234567"
agent-browser fill [line1] "123 Test Street"
agent-browser fill [area] "Gulberg"
agent-browser select [city] first option
agent-browser click [Add address]
# EXPECT: Address appears in list

# Change password
agent-browser fill [currentPassword] "Test@1234"
agent-browser fill [newPassword] "NewTest@5678"
agent-browser fill [confirmPassword] "NewTest@5678"
agent-browser click [Update password]
# EXPECT: Success toast
```

---

## Phase 2 — Staff Role UI Testing

### 2.1 Staff Login & Verification Gate

```bash
agent-browser open http://localhost:5173/auth/login
agent-browser fill [phone] "staff@test.com"
agent-browser fill [password] "Test@1234"
agent-browser click [Login]
# EXPECT: Redirect to /staff/visits (or verification gate if not verified)

# Unverified staff
# EXPECT: StaffVerificationGate shows "Pending verification" message
# EXPECT: My Visits link is blocked until VERIFIED
```

### 2.2 My Visits

```bash
agent-browser open http://localhost:5173/staff/visits
agent-browser snapshot -i
# EXPECT: Today's visits list with status badges
# EXPECT: EN_ROUTE / CHECK_IN / CHECK_OUT buttons per visit stage

# En Route
agent-browser click [En Route] button on ASSIGNED visit
# EXPECT: Status → EN_ROUTE, button changes to Check In

# Check In
agent-browser click [Check In]
# EXPECT: Modal for before-condition notes
agent-browser fill [beforeCondition] "Patient is comfortable"
agent-browser click [Confirm Check In]
# EXPECT: Status → CHECKED_IN

# Check Out
agent-browser click [Check Out]
# EXPECT: Modal for after-condition notes
agent-browser fill [afterCondition] "Treatment completed"
agent-browser click [Confirm Check Out]
# EXPECT: Status → COMPLETED
```

### 2.3 Doctor Requests (STAFF with doctor role only)

```bash
agent-browser open http://localhost:5173/staff/doctor-requests
agent-browser snapshot -i
# EXPECT: List of PENDING_DOCTOR bookings assigned to this doctor

# Accept booking
agent-browser click [Accept] on a PENDING_DOCTOR booking
# EXPECT: Success toast, booking moves to PENDING (removed from list)

# Propose time
agent-browser click [Propose Time] on another booking
# EXPECT: Modal with datetime-local input
agent-browser fill [datetime] "2026-06-15T11:00"
agent-browser click [Propose]
# EXPECT: Booking status → TIME_PROPOSED, card shows "awaiting customer"
```

### 2.4 My Profile

```bash
agent-browser open http://localhost:5173/staff/profile
agent-browser snapshot -i
# EXPECT: Avatar, name, staff code, verification badge
# EXPECT: Availability toggle button

# Toggle availability
agent-browser click [Available — tap to go offline]
# EXPECT: Button turns grey "Unavailable — tap to go online"
agent-browser click [Unavailable — tap to go online]
# EXPECT: Button turns green again

# Upload avatar
agent-browser find [Camera button]
# Trigger file upload — verify loading spinner appears
# EXPECT: After upload, new avatar shown, sidebar avatar also updates
```

### 2.5 My Documents

```bash
agent-browser open http://localhost:5173/staff/documents
# EXPECT: Document upload section
# EXPECT: List of existing documents with status (PENDING/APPROVED/REJECTED)
```

---

## Phase 3 — Admin Role UI Testing

### 3.1 Admin Dashboard

```bash
agent-browser open http://localhost:5173/admin
agent-browser snapshot -i
# EXPECT: KPI cards (Total Bookings, Revenue, Active Staff, Pending)
# EXPECT: Recent bookings list
# EXPECT: Analytics charts visible
```

### 3.2 Bookings Management

```bash
agent-browser open http://localhost:5173/admin/bookings
# EXPECT: Tab bar: All, Pending, Confirmed, Assigned, In Progress, Completed, Cancelled, Doctor
agent-browser click [Pending tab]
# EXPECT: Only PENDING bookings shown

agent-browser click [Doctor tab]
# EXPECT: Only PENDING_DOCTOR bookings shown

# Open booking detail
agent-browser click [first booking row]
# EXPECT: Detail page with correct booking info

# Confirm booking
agent-browser click [Confirm button] (visible on PENDING booking)
# EXPECT: Status → CONFIRMED, button disappears

# Reschedule booking
agent-browser click [Reschedule button] (visible on CONFIRMED/ASSIGNED)
# EXPECT: Modal with datetime-local input
agent-browser fill [datetime] "2026-07-10T09:00"
agent-browser click [Confirm reschedule]
# EXPECT: Toast success, booking status → RESCHEDULED

# Assign staff to visit
agent-browser click [Assign button] on a visit row
# EXPECT: Staff assignment panel slides in
# EXPECT: List of available, verified staff in same city
agent-browser click [first staff member]
# EXPECT: Visit status → ASSIGNED, panel closes

# Cancel booking
agent-browser click [Cancel button]
# EXPECT: Modal opens
# EXPECT: Confirm button disabled until reason entered
agent-browser fill [reason] "Admin cancelled"
agent-browser click [Confirm cancel]
# EXPECT: Status → CANCELLED

# Mark payment as collected (CASH pending payment)
agent-browser find [Mark as Collected button]
agent-browser click [Mark as Collected]
# EXPECT: Payment status → Collected, button disappears
```

### 3.3 Staff Management

```bash
agent-browser open http://localhost:5173/admin/staff
# EXPECT: Staff list with verification status badges
# EXPECT: Add Staff button

agent-browser click [Add Staff button]
# EXPECT: Modal with form fields
agent-browser fill [phone] "0311-9999999"
agent-browser fill [fullName] "Test Nurse"
agent-browser click [Save]
# EXPECT: Staff added, appears in list

# Open staff detail
agent-browser click [first staff member]
# EXPECT: Full profile: contact, documents, services, availability
# EXPECT: Verify/Reject buttons for PENDING_VERIFICATION staff
agent-browser click [Verify button]
# EXPECT: Status → VERIFIED
```

### 3.4 Customers

```bash
agent-browser open http://localhost:5173/admin/customers
# EXPECT: Customer list with booking counts
agent-browser click [first customer]
# EXPECT: Customer detail: profile, booking history, addresses, patients
```

### 3.5 Notifications Page

```bash
agent-browser open http://localhost:5173/admin/notifications
agent-browser snapshot -i
# EXPECT: Table with columns: Time, Template, Recipient, Status, Sent At, Action
# EXPECT: Status filter dropdown (All/Pending/Sent/Failed)

agent-browser select [status filter] "Failed"
# EXPECT: Only FAILED notifications shown
# EXPECT: Retry button visible on each row

agent-browser click [Retry button]
# EXPECT: Loading spinner, then success toast "Notification queued for retry"

agent-browser select [status filter] "Sent"
# EXPECT: Only SENT notifications, no retry buttons
```

### 3.6 Settings

```bash
agent-browser open http://localhost:5173/admin/settings
# EXPECT: 3 tabs: Service Types, Packages, Cities & Zones

# Service Types tab
agent-browser click [Service Types tab]
agent-browser click [Add Service Type]
# EXPECT: Modal with Code, Name, Description, Active fields
agent-browser fill [code] "TEST_SVC"
agent-browser fill [name] "Test Service"
agent-browser click [Save]
# EXPECT: New row appears in list

# Toggle active
agent-browser click [toggle icon] on a service type
# EXPECT: Icon changes (green toggle ↔ grey toggle)

# Edit
agent-browser click [pencil icon]
# EXPECT: Modal pre-filled with existing values

# Packages tab
agent-browser click [Packages tab]
agent-browser click [Add Package]
# EXPECT: Modal with all package fields
agent-browser fill [name] "QA Package"
agent-browser fill [priceAmount] "1500"
agent-browser click [Save]
# EXPECT: Package appears in list

# Cities & Zones tab
agent-browser click [Cities & Zones tab]
agent-browser click [Add City]
agent-browser fill [cityName] "Lahore"
agent-browser fill [slug] "lahore"
agent-browser click [Save]
# EXPECT: City appears with expand arrow

agent-browser click [expand arrow] on Lahore
agent-browser click [+ zone button]
agent-browser fill [zoneName] "Gulberg"
agent-browser fill [slug] "gulberg"
agent-browser click [Save]
# EXPECT: Zone appears under Lahore
```

### 3.7 Analytics, Payments, Audit Logs

```bash
agent-browser open http://localhost:5173/admin/analytics
# EXPECT: Charts render without errors, date range selector works

agent-browser open http://localhost:5173/admin/payments
# EXPECT: Payment history table with booking numbers, amounts, status

agent-browser open http://localhost:5173/admin/audit-logs
# EXPECT: Audit log table with actor, action, entity, timestamp
```

---

## Phase 4 — Role Isolation Testing (CRITICAL)

### 4.1 Customer Cannot Access Admin/Staff Routes

```bash
# While logged in as CUSTOMER:
agent-browser open http://localhost:5173/admin
# EXPECT: Redirect to /auth/login or 403 page, NOT admin dashboard

agent-browser open http://localhost:5173/admin/bookings
# EXPECT: Redirect, NOT bookings list

agent-browser open http://localhost:5173/staff/visits
# EXPECT: Redirect, NOT visits page
```

### 4.2 Staff Cannot Access Admin Routes

```bash
# While logged in as STAFF:
agent-browser open http://localhost:5173/admin
# EXPECT: Redirect to staff portal or 403

agent-browser open http://localhost:5173/admin/customers
# EXPECT: Redirect, NOT customer list
```

### 4.3 Unauthenticated Access

```bash
# Not logged in:
agent-browser open http://localhost:5173/my-bookings
# EXPECT: Redirect to /auth/login

agent-browser open http://localhost:5173/admin/bookings
# EXPECT: Redirect to /auth/login

agent-browser open http://localhost:5173/staff/visits
# EXPECT: Redirect to /auth/login
```

---

## Phase 5 — Backend Security Audit

### 5.1 Authentication & Token Security

```bash
# Test 1: Access protected endpoint without token
curl http://localhost:4000/api/bookings
# EXPECT: 401 Unauthorized {"success":false,"code":"UNAUTHENTICATED"}

# Test 2: Access with tampered/fake JWT
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakepayload.fakesig" \
  http://localhost:4000/api/bookings
# EXPECT: 401 Unauthorized

# Test 3: Access with expired token
# (get an old token, try using it)
curl -H "Authorization: Bearer <expired_token>" http://localhost:4000/api/bookings
# EXPECT: 401 {"code":"TOKEN_EXPIRED"}

# Test 4: Token refresh works correctly
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<valid_refresh_token>"}'
# EXPECT: New access token returned

# Test 5: Logout invalidates refresh token
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer <access_token>"
# Try refresh after logout:
curl -X POST http://localhost:4000/api/auth/refresh \
  -d '{"refreshToken":"<now_invalid_refresh_token>"}'
# EXPECT: 401 (token revoked)
```

### 5.2 Role-Based Access Control (RBAC)

```bash
# Get a CUSTOMER token
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"customer@test.com","password":"Test@1234"}' | jq -r '.data.accessToken')

# Test: Customer accessing admin endpoint
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" http://localhost:4000/api/admin/dashboard/summary
# EXPECT: 403 Forbidden {"code":"FORBIDDEN"}

curl -H "Authorization: Bearer $CUSTOMER_TOKEN" http://localhost:4000/api/admin/customers
# EXPECT: 403 Forbidden

curl -H "Authorization: Bearer $CUSTOMER_TOKEN" http://localhost:4000/api/admin/notifications
# EXPECT: 403 Forbidden

# Get a STAFF token
STAFF_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"staff@test.com","password":"Test@1234"}' | jq -r '.data.accessToken')

# Test: Staff accessing admin endpoint
curl -H "Authorization: Bearer $STAFF_TOKEN" http://localhost:4000/api/admin/dashboard/summary
# EXPECT: 403 Forbidden

curl -H "Authorization: Bearer $STAFF_TOKEN" http://localhost:4000/api/admin/customers
# EXPECT: 403 Forbidden

# Test: Staff accessing another staff's profile
OTHER_STAFF_ID="<uuid-of-other-staff>"
curl -H "Authorization: Bearer $STAFF_TOKEN" \
  http://localhost:4000/api/staff/$OTHER_STAFF_ID
# EXPECT: 200 OK (public profile) — but sensitive fields should be hidden

# Test: Staff trying to verify another staff
curl -X PATCH -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{"verificationStatus":"VERIFIED"}' \
  http://localhost:4000/api/staff/$OTHER_STAFF_ID/verify
# EXPECT: 403 Forbidden (admin-only)
```

### 5.3 IDOR (Insecure Direct Object Reference) Testing

```bash
# Get Customer A and Customer B tokens
CUSTOMER_A_TOKEN="..."  # customer A's token
CUSTOMER_B_TOKEN="..."  # customer B's token

# Customer A's booking ID
BOOKING_A_ID="<booking-id-belonging-to-customer-A>"

# Test: Can Customer B read Customer A's booking?
curl -H "Authorization: Bearer $CUSTOMER_B_TOKEN" \
  http://localhost:4000/api/bookings/$BOOKING_A_ID
# EXPECT: 403 Forbidden or 404 Not Found
# CRITICAL: Must NOT return Customer A's data

# Test: Can Customer B cancel Customer A's booking?
curl -X PATCH -H "Authorization: Bearer $CUSTOMER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Hack attempt"}' \
  http://localhost:4000/api/bookings/$BOOKING_A_ID/cancel
# EXPECT: 403 Forbidden

# Test: Can Customer B access Customer A's patients?
curl -H "Authorization: Bearer $CUSTOMER_B_TOKEN" \
  "http://localhost:4000/api/users/patients"
# EXPECT: Only Customer B's own patients (filtered by JWT sub)

# Test: Can Customer B access Customer A's addresses?
curl -H "Authorization: Bearer $CUSTOMER_B_TOKEN" \
  "http://localhost:4000/api/users/addresses"
# EXPECT: Only Customer B's own addresses

# Test: Can Staff access a booking not assigned to them?
UNASSIGNED_BOOKING="<booking-id-not-assigned-to-this-staff>"
curl -H "Authorization: Bearer $STAFF_TOKEN" \
  http://localhost:4000/api/bookings/$UNASSIGNED_BOOKING
# EXPECT: Allowed (staff needs to see for context) — but verify no sensitive override possible

# Test: Can Staff complete a visit not theirs?
OTHER_VISIT_ID="<visit-id-assigned-to-different-staff>"
curl -X POST -H "Authorization: Bearer $STAFF_TOKEN" \
  http://localhost:4000/api/visits/$OTHER_VISIT_ID/complete
# EXPECT: 403 Forbidden
```

### 5.4 Input Validation & Injection

```bash
# Test: SQL injection via booking filters
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  "http://localhost:4000/api/bookings?status='; DROP TABLE bookings;--"
# EXPECT: 400 Bad Request (Zod validation rejects invalid enum)
# NOTE: Prisma uses parameterized queries — raw SQL injection not possible

# Test: XSS via booking special instructions
curl -X POST -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceTypeId":"<valid-id>",
    "packageId":"<valid-id>",
    "patientId":"<valid-id>",
    "addressId":"<valid-id>",
    "requestedStartAt":"2026-07-01T10:00:00Z",
    "specialInstructions":"<script>alert(1)</script>"
  }' \
  http://localhost:4000/api/bookings
# EXPECT: Booking created (stored as literal string)
# In browser: React renders it as text, NOT as script (JSX auto-escaping ✓)

# Test: Oversized payload
curl -X POST -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"specialInstructions\":\"$(python -c 'print("A"*100000)')"}" \
  http://localhost:4000/api/bookings
# EXPECT: 413 or 400 (express body limit / Zod max length)

# Test: Invalid UUID injection
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  "http://localhost:4000/api/bookings/../../admin/customers"
# EXPECT: 400 Bad Request (UUID validation fails) or 404

# Test: Missing required fields
curl -X POST -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceTypeId":"test"}' \
  http://localhost:4000/api/bookings
# EXPECT: 400 with Zod validation errors listing missing fields
```

### 5.5 Sensitive Data Exposure

```bash
# Test: Login response should NOT include password hash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"customer@test.com","password":"Test@1234"}' | jq .
# EXPECT: Response has user.phone, user.fullName, user.role
# EXPECT: NO passwordHash, NO refreshToken in body (only in HTTP-only cookie or separate field)

# Test: User listing should not expose passwords
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/customers | jq '.data[0]'
# EXPECT: No passwordHash field in any user object

# Test: Staff listing should not expose CNIC/sensitive docs to customers
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  "http://localhost:4000/api/staff/doctors" | jq '.data[0]'
# EXPECT: Only public fields (name, avatar, experience, city)
# EXPECT: NO cnic, NO dateOfBirth, NO documents

# Test: Notification logs should not be accessible by customers
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  http://localhost:4000/api/admin/notifications
# EXPECT: 403 Forbidden (WhatsApp numbers are sensitive)

# Test: Audit logs should not be accessible by customers/staff
curl -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  http://localhost:4000/api/admin/audit-logs
# EXPECT: 403 Forbidden
```

### 5.6 File Upload Security (Cloudinary Presign)

```bash
# Test: Customer cannot presign files for another user's staff profile
FAKE_STAFF_ID="<some-other-staff-id>"
curl -X POST -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"AVATAR","mimeType":"image/jpeg","fileSizeBytes":1000}' \
  http://localhost:4000/api/staff/$FAKE_STAFF_ID/documents/presign
# EXPECT: 403 Forbidden

# Test: File type validation
curl -X POST -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"LICENSE","mimeType":"application/x-executable","fileSizeBytes":1000}' \
  http://localhost:4000/api/staff/me/documents/presign
# EXPECT: 400 Bad Request (invalid mime type)

# Test: Oversized file rejection
curl -X POST -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"LICENSE","mimeType":"image/jpeg","fileSizeBytes":999999999}' \
  http://localhost:4000/api/staff/me/documents/presign
# EXPECT: 400 (file too large)
```

### 5.7 Password Security

```bash
# Test: Weak password rejected at registration
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"03009999999","fullName":"Test","password":"123","role":"CUSTOMER"}'
# EXPECT: 400 validation error (minimum password requirements)

# Test: Wrong current password rejected at change-password
curl -X POST -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"wrong","newPassword":"NewTest@1234"}' \
  http://localhost:4000/api/auth/change-password
# EXPECT: 401 or 400 with "incorrect password" error

# Verify bcrypt is used (check source code):
grep -n "bcrypt" healthcare-backend/src/controller/auth.controller.ts
# EXPECT: bcrypt.compare() for login, bcrypt.hash() for registration
```

### 5.8 Rate Limiting & CORS

```bash
# Test: Brute force login protection (if rate limiting is enabled)
for i in {1..20}; do
  curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"victim@test.com","password":"wrongpassword"}' | jq .code
done
# EXPECT: After N attempts, 429 Too Many Requests

# Test: CORS blocks unauthorized origins
curl -H "Origin: http://evil.com" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/admin/customers
# EXPECT: No Access-Control-Allow-Origin: http://evil.com header
# (allowed origins should only be localhost:5173 and production domain)

# Test: CORS preflight
curl -X OPTIONS -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:4000/api/admin/customers
# EXPECT: Access-Control-Allow-Origin does NOT include evil.com
```

### 5.9 Business Logic Security

```bash
# Test: Double-confirm a booking (replay attack)
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:4000/api/bookings/$ALREADY_CONFIRMED_ID/confirm
# EXPECT: 409 Conflict "INVALID_BOOKING_TRANSITION"

# Test: Cancel an already-cancelled booking
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason":"test"}' \
  http://localhost:4000/api/bookings/$ALREADY_CANCELLED_ID/cancel
# EXPECT: 409 Conflict

# Test: Staff completing a visit before checking in
curl -X POST -H "Authorization: Bearer $STAFF_TOKEN" \
  http://localhost:4000/api/visits/$SCHEDULED_VISIT_ID/complete
# EXPECT: 409 Conflict "INVALID_VISIT_TRANSITION"

# Test: Rescheduling a completed booking
curl -X PATCH -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestedStartAt":"2026-08-01T10:00:00Z"}' \
  http://localhost:4000/api/bookings/$COMPLETED_BOOKING_ID/reschedule
# EXPECT: 409 Conflict (COMPLETED → RESCHEDULED not allowed)

# Test: Customer accepting time on wrong booking
curl -X PATCH -H "Authorization: Bearer $CUSTOMER_A_TOKEN" \
  http://localhost:4000/api/bookings/$CUSTOMER_B_BOOKING/customer-accept-time
# EXPECT: 403 Forbidden
```

---

## Phase 6 — WhatsApp Notification Flow Verification

```bash
# Check notification log after key actions:

ADMIN_TOKEN="..."

# After booking creation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?templateCode=BOOKING_RECEIVED&limit=1" | jq '.data[0].status'
# EXPECT: "SENT" or "PENDING" (not FAILED)

# After booking confirmation
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?templateCode=BOOKING_CONFIRMED&limit=1" | jq '.'
# EXPECT: notification record exists

# After staff assignment
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?templateCode=STAFF_ASSIGNED&limit=1" | jq '.'
# EXPECT: notification record exists

# After staff goes en-route
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?templateCode=STAFF_EN_ROUTE&limit=1" | jq '.'

# After report upload
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?templateCode=REPORT_AVAILABLE&limit=1" | jq '.'

# Check for any FAILED notifications
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/api/admin/notifications?status=FAILED" | jq '.meta.total'
# EXPECT: 0 (or investigate each failure)
```

---

## QA Report Template

After running all tests, fill out this checklist:

```
## Healthcare Platform QA Report
Date: ___________
Tester: ___________

### Customer Portal
- [ ] Registration & Login
- [ ] Booking Form — Normal service (no doctor)
- [ ] Booking Form — Doctor service (with doctor picker)
- [ ] My Bookings list + status badges
- [ ] Booking Detail — reschedule
- [ ] Booking Detail — cancel
- [ ] Booking Detail — PENDING_DOCTOR banner
- [ ] Booking Detail — TIME_PROPOSED accept/decline
- [ ] My Reports — file download
- [ ] My Patients — add/edit
- [ ] Account — profile edit
- [ ] Account — address add/edit/delete
- [ ] Account — change password

### Staff Portal
- [ ] Login + verification gate
- [ ] My Visits — en route → check in → check out
- [ ] Doctor Requests — accept booking
- [ ] Doctor Requests — propose new time
- [ ] My Profile — availability toggle
- [ ] My Profile — avatar upload
- [ ] My Documents — upload

### Admin Portal
- [ ] Dashboard KPI cards
- [ ] Bookings tabs (all statuses including Doctor)
- [ ] Booking Detail — confirm
- [ ] Booking Detail — reschedule
- [ ] Booking Detail — cancel
- [ ] Booking Detail — assign staff
- [ ] Booking Detail — mark payment collected
- [ ] Staff management — add, verify, view docs
- [ ] Customers — list + detail
- [ ] Notifications — filter, retry failed
- [ ] Settings — service type CRUD
- [ ] Settings — package CRUD
- [ ] Settings — city + zone CRUD
- [ ] Analytics charts render
- [ ] Payments list
- [ ] Audit logs

### Role Isolation
- [ ] Customer cannot access /admin/* routes
- [ ] Customer cannot access /staff/* routes
- [ ] Staff cannot access /admin/* routes
- [ ] Unauthenticated → redirect to login

### Backend Security
- [ ] No token → 401
- [ ] Fake token → 401
- [ ] Customer → admin endpoint → 403
- [ ] Staff → admin endpoint → 403
- [ ] IDOR: Customer B cannot read Customer A's booking
- [ ] IDOR: Customer B cannot cancel Customer A's booking
- [ ] IDOR: Customer B cannot see Customer A's patients/addresses
- [ ] Staff cannot complete another staff's visit
- [ ] Passwords not exposed in API responses
- [ ] CNIC/sensitive staff data not exposed to customers
- [ ] Audit logs not accessible by customer/staff
- [ ] Invalid state transitions → 409
- [ ] Weak password → 400
- [ ] Wrong current password → 401/400
- [ ] Presign blocked for unauthorized user
- [ ] Oversized file → 400

### Issues Found
| # | Severity | Description | Route/Endpoint |
|---|---------|-------------|----------------|
| 1 | HIGH    |             |                |

### Overall Status
- [ ] PASS (all critical checks green)
- [ ] FAIL (issues found — listed above)
```

---

## Common Failures & Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 401 on valid token | Token sent as `Bearer<space>token` missing | Check `Authorization: Bearer ` header format |
| 403 on admin route | Role not ADMIN in JWT | Check `role` claim in JWT, re-login |
| IDOR not blocked | Missing ownership check in controller | Add `if (booking.customerUserId !== req.user.sub)` guard |
| Customer sees admin routes | `PrivateRoute` not checking role | Add `allowedRoles={['ADMIN']}` to route wrapper |
| Notification status FAILED | WhatsApp API key wrong or sandbox mode | Check `.env` WHATSAPP_API_KEY, verify sandbox number |
| TypeScript `any` warnings | Return type not specified | Add explicit return types to controller methods |
| Prisma UNIQUE constraint | Duplicate phone on register | Return user-friendly error message |

---

## Quick Run (All at Once)

```bash
# Start both servers
cd healthcare-backend && npm run dev &
cd healthcare-web && npm run dev &

# Wait for startup
sleep 5

# Run Phase 5 security checks (no browser needed)
# Replace tokens with real values from login calls above

# Run Phase 1-4 via browser automation
agent-browser open http://localhost:5173
# ... follow each phase above
```

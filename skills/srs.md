SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
Healthcare Home Services Platform – Faisalabad, Pakistan

1. SYSTEM ARCHITECTURE (HIGH-LEVEL)

Architecture Style
- Modular monolith backend (Node.js + Express) with clear domain modules
- PostgreSQL (Neon) as primary relational database
- Prisma as ORM and migration tool
- Object storage via AWS S3 or Cloudinary for reports and documents
- WhatsApp API integration via async notification service
- Web app: React (Vite) + Tailwind
- Mobile app: React Native

High-Level Components
- Web Client (Customer/Admin)
- Mobile Client (Customer/Staff)
- REST API Server (Express)
- Background Job Worker (notifications, retries, scheduled reminders)
- PostgreSQL Database
- File Storage Provider
- WhatsApp Provider

Recommended Backend Structure
- src/modules/auth
- src/modules/users
- src/modules/staff
- src/modules/services
- src/modules/packages
- src/modules/bookings
- src/modules/reports
- src/modules/reviews
- src/modules/notifications
- src/modules/common

Layering
- Controller layer: request/response handling
- Service layer: business logic
- Repository layer: Prisma data access
- Middleware: auth, RBAC, validation, error handling, audit logging

Deployment Model
- Single API service for initial launch
- Separate worker process for async jobs
- Stateless API instances behind load balancer when scaling
- Shared DB and storage across all instances

Core Design Principles
- UUID primary keys
- Snake_case table/column naming in PostgreSQL
- PascalCase Prisma models mapped to snake_case tables using @@map
- Soft delete only where needed (users)
- All critical write flows wrapped in DB transactions
- Async side effects (WhatsApp, reminders) handled outside request thread where possible


2. MODULES BREAKDOWN

2.1 Auth
Responsibilities
- Login
- Refresh token issuance
- Logout
- JWT creation/validation
- Password hashing
- Current session validation

Rules
- Access token: short-lived
- Refresh token: long-lived, stored hashed in DB
- Role included in JWT claims
- Password reset flow optional in phase 2

2.2 Users
Responsibilities
- Base user identity management
- Profile retrieval/update
- Customer profile management
- Address management
- Patient profile management

Rules
- One user has one role: ADMIN, STAFF, CUSTOMER
- Customer can manage multiple patients
- Customer can manage multiple addresses

2.3 Staff
Responsibilities
- Staff profile creation/update
- Verification tracking
- CNIC/certification storage
- Staff-to-service mapping
- Availability flagging
- ID card and uniform issuance tracking

Rules
- Staff records created/approved by admin only
- Staff can serve one or more service types
- Verification status required before assignment

2.4 Services
Responsibilities
- Manage service catalog
- Activate/deactivate services
- Store service descriptions and operational metadata

Rules
- Service types are static/controlled by admin
- Examples: NURSING, CAREGIVER, LAB_SAMPLING, VISITING_DOCTOR, PHYSIOTHERAPY, AMBULANCE

2.5 Bookings
Responsibilities
- Booking creation
- Visit generation from package
- Assignment of staff
- Visit lifecycle management
- Reschedule/cancel
- Status transitions

Rules
- Booking belongs to one customer, one patient, one service type, one package
- Booking can have one or many visits
- Each visit can be assigned independently
- Admin controls assignment in v1

2.6 Reports
Responsibilities
- Report metadata storage
- Report file upload confirmation
- Report visibility management
- Visit progress notes

Rules
- Reports may be linked to booking or specific visit
- Only authorized customer/admin/staff can access based on role and ownership
- Files stored outside DB; DB stores metadata only

2.7 Packages
Responsibilities
- Service package configuration
- Per-visit / weekly / monthly offerings
- City-specific pricing support

Rules
- Package belongs to one service type
- Package may be global or city-specific

2.8 Reviews
Responsibilities
- Rating and review submission
- Staff/service review retrieval
- Low-rating escalation flagging

Rules
- Review allowed only after visit or booking completion
- Customer can review only own completed service


3. DATABASE SCHEMA (POSTGRESQL TABLES WITH FIELDS)

Conventions
- PK: UUID unless noted otherwise
- Timestamps: timestamptz
- Money: numeric(12,2)
- Phone numbers stored in E.164-compatible string format where possible
- Enums implemented as PostgreSQL enums or constrained varchar columns

3.1 cities
- id UUID PK
- name varchar(100) NOT NULL
- slug varchar(120) UNIQUE NOT NULL
- is_active boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(slug)

3.2 zones
- id UUID PK
- city_id UUID NOT NULL FK -> cities.id
- name varchar(100) NOT NULL
- slug varchar(120) NOT NULL
- is_active boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(city_id, slug)
- INDEX(city_id)

3.3 users
- id UUID PK
- role varchar(20) NOT NULL CHECK role IN ('ADMIN','STAFF','CUSTOMER')
- full_name varchar(150) NOT NULL
- email varchar(255) NULL
- phone varchar(20) NOT NULL
- password_hash varchar(255) NOT NULL
- status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK status IN ('ACTIVE','INACTIVE','SUSPENDED')
- phone_verified boolean NOT NULL DEFAULT false
- email_verified boolean NOT NULL DEFAULT false
- last_login_at timestamptz NULL
- deleted_at timestamptz NULL
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(phone)
- UNIQUE(email) WHERE email IS NOT NULL
- INDEX(role, status)

3.4 refresh_tokens
- id UUID PK
- user_id UUID NOT NULL FK -> users.id
- token_hash varchar(255) NOT NULL
- expires_at timestamptz NOT NULL
- revoked_at timestamptz NULL
- ip_address inet NULL
- user_agent text NULL
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(token_hash)
- INDEX(user_id)
- INDEX(expires_at)

3.5 customer_profiles
- user_id UUID PK FK -> users.id
- whatsapp_number varchar(20) NULL
- alternate_phone varchar(20) NULL
- preferred_language varchar(10) NOT NULL DEFAULT 'en'
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

3.6 addresses
- id UUID PK
- customer_user_id UUID NULL FK -> users.id
- label varchar(50) NULL
- contact_name varchar(150) NOT NULL
- contact_phone varchar(20) NOT NULL
- line_1 varchar(255) NOT NULL
- line_2 varchar(255) NULL
- area varchar(120) NOT NULL
- city_id UUID NOT NULL FK -> cities.id
- zone_id UUID NULL FK -> zones.id
- postal_code varchar(20) NULL
- latitude numeric(9,6) NULL
- longitude numeric(9,6) NULL
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(customer_user_id)
- INDEX(city_id, zone_id)

3.7 patients
- id UUID PK
- customer_user_id UUID NOT NULL FK -> users.id
- default_address_id UUID NULL FK -> addresses.id
- full_name varchar(150) NOT NULL
- gender varchar(10) NULL CHECK gender IN ('MALE','FEMALE','OTHER')
- date_of_birth date NULL
- relationship_to_customer varchar(50) NULL
- primary_condition text NULL
- allergies text NULL
- notes text NULL
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(customer_user_id)
- INDEX(default_address_id)

3.8 service_types
- id UUID PK
- code varchar(50) NOT NULL
- name varchar(100) NOT NULL
- description text NULL
- is_active boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(code)

Seed Values
- NURSING
- CAREGIVER
- LAB_SAMPLING
- VISITING_DOCTOR
- PHYSIOTHERAPY
- AMBULANCE

3.9 packages
- id UUID PK
- city_id UUID NULL FK -> cities.id
- service_type_id UUID NOT NULL FK -> service_types.id
- name varchar(120) NOT NULL
- package_type varchar(20) NOT NULL CHECK package_type IN ('PER_VISIT','WEEKLY','MONTHLY')
- duration_days integer NOT NULL
- visit_count integer NOT NULL
- price_amount numeric(12,2) NOT NULL
- currency char(3) NOT NULL DEFAULT 'PKR'
- description text NULL
- is_active boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(service_type_id, package_type, is_active)
- INDEX(city_id)

3.10 staff_profiles
- user_id UUID PK FK -> users.id
- staff_code varchar(30) NOT NULL
- city_id UUID NOT NULL FK -> cities.id
- zone_id UUID NULL FK -> zones.id
- gender varchar(10) NULL CHECK gender IN ('MALE','FEMALE','OTHER')
- cnic varchar(25) NOT NULL
- date_of_birth date NULL
- experience_years integer NOT NULL DEFAULT 0
- verification_status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK verification_status IN ('PENDING','VERIFIED','REJECTED','EXPIRED')
- verified_at timestamptz NULL
- verified_by_user_id UUID NULL FK -> users.id
- id_card_number varchar(50) NULL
- id_card_issued_at timestamptz NULL
- uniform_issued boolean NOT NULL DEFAULT false
- uniform_issued_at timestamptz NULL
- is_available boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(staff_code)
- UNIQUE(cnic)
- UNIQUE(id_card_number) WHERE id_card_number IS NOT NULL
- INDEX(city_id, zone_id)
- INDEX(verification_status, is_available)

3.11 staff_service_types
- staff_user_id UUID NOT NULL FK -> staff_profiles.user_id
- service_type_id UUID NOT NULL FK -> service_types.id
- created_at timestamptz NOT NULL DEFAULT now()

Primary Key
- PRIMARY KEY (staff_user_id, service_type_id)

Indexes
- INDEX(service_type_id)

3.12 staff_documents
- id UUID PK
- staff_user_id UUID NOT NULL FK -> staff_profiles.user_id
- document_type varchar(50) NOT NULL
- file_provider varchar(20) NOT NULL CHECK file_provider IN ('S3','CLOUDINARY')
- file_key varchar(500) NOT NULL
- file_url varchar(1000) NOT NULL
- mime_type varchar(100) NOT NULL
- file_size_bytes bigint NOT NULL
- verification_status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK verification_status IN ('PENDING','VERIFIED','REJECTED')
- uploaded_at timestamptz NOT NULL DEFAULT now()
- verified_at timestamptz NULL
- verified_by_user_id UUID NULL FK -> users.id

Indexes
- INDEX(staff_user_id)
- INDEX(document_type, verification_status)

3.13 bookings
- id UUID PK
- booking_number varchar(30) NOT NULL
- customer_user_id UUID NOT NULL FK -> users.id
- patient_id UUID NOT NULL FK -> patients.id
- service_type_id UUID NOT NULL FK -> service_types.id
- package_id UUID NOT NULL FK -> packages.id
- address_id UUID NOT NULL FK -> addresses.id
- city_id UUID NOT NULL FK -> cities.id
- preferred_staff_gender varchar(10) NULL CHECK preferred_staff_gender IN ('MALE','FEMALE','OTHER')
- urgency_level varchar(20) NOT NULL DEFAULT 'NORMAL' CHECK urgency_level IN ('NORMAL','URGENT','EMERGENCY')
- requested_start_at timestamptz NOT NULL
- special_instructions text NULL
- status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK status IN ('PENDING','CONFIRMED','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED','RESCHEDULED')
- total_price numeric(12,2) NOT NULL
- currency char(3) NOT NULL DEFAULT 'PKR'
- source varchar(20) NOT NULL DEFAULT 'WEB' CHECK source IN ('WEB','MOBILE','ADMIN')
- confirmed_at timestamptz NULL
- confirmed_by_user_id UUID NULL FK -> users.id
- cancelled_at timestamptz NULL
- cancelled_by_user_id UUID NULL FK -> users.id
- cancellation_reason text NULL
- created_by_user_id UUID NOT NULL FK -> users.id
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(booking_number)
- INDEX(customer_user_id, status)
- INDEX(patient_id)
- INDEX(service_type_id, status)
- INDEX(city_id, status)
- INDEX(requested_start_at)

3.14 booking_visits
- id UUID PK
- booking_id UUID NOT NULL FK -> bookings.id
- sequence_no integer NOT NULL
- scheduled_start_at timestamptz NOT NULL
- scheduled_end_at timestamptz NULL
- assigned_staff_user_id UUID NULL FK -> staff_profiles.user_id
- status varchar(20) NOT NULL DEFAULT 'SCHEDULED' CHECK status IN ('SCHEDULED','ASSIGNED','EN_ROUTE','CHECKED_IN','COMPLETED','MISSED','CANCELLED')
- check_in_at timestamptz NULL
- check_out_at timestamptz NULL
- before_condition_text text NULL
- after_condition_text text NULL
- visit_notes text NULL
- completed_by_staff_user_id UUID NULL FK -> staff_profiles.user_id
- cancellation_reason text NULL
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- UNIQUE(booking_id, sequence_no)
- INDEX(assigned_staff_user_id, status)
- INDEX(scheduled_start_at, status)
- INDEX(booking_id)

3.15 booking_assignments
- id UUID PK
- booking_id UUID NOT NULL FK -> bookings.id
- booking_visit_id UUID NULL FK -> booking_visits.id
- staff_user_id UUID NOT NULL FK -> staff_profiles.user_id
- assigned_by_user_id UUID NOT NULL FK -> users.id
- status varchar(20) NOT NULL DEFAULT 'ASSIGNED' CHECK status IN ('ASSIGNED','ACCEPTED','REJECTED','REASSIGNED','COMPLETED','CANCELLED')
- response_note text NULL
- assigned_at timestamptz NOT NULL DEFAULT now()
- responded_at timestamptz NULL

Indexes
- INDEX(booking_id)
- INDEX(booking_visit_id)
- INDEX(staff_user_id, status)

3.16 reports
- id UUID PK
- booking_id UUID NOT NULL FK -> bookings.id
- booking_visit_id UUID NULL FK -> booking_visits.id
- patient_id UUID NOT NULL FK -> patients.id
- uploaded_by_user_id UUID NOT NULL FK -> users.id
- report_type varchar(30) NOT NULL CHECK report_type IN ('LAB_RESULT','PRESCRIPTION','VISIT_NOTE','PROGRESS_IMAGE','OTHER')
- title varchar(150) NOT NULL
- notes text NULL
- is_visible_to_customer boolean NOT NULL DEFAULT true
- created_at timestamptz NOT NULL DEFAULT now()
- updated_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(patient_id, created_at)
- INDEX(booking_id)
- INDEX(booking_visit_id)

3.17 report_files
- id UUID PK
- report_id UUID NOT NULL FK -> reports.id
- file_provider varchar(20) NOT NULL CHECK file_provider IN ('S3','CLOUDINARY')
- file_key varchar(500) NOT NULL
- file_url varchar(1000) NOT NULL
- mime_type varchar(100) NOT NULL
- file_size_bytes bigint NOT NULL
- checksum_sha256 varchar(64) NULL
- uploaded_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(report_id)

3.18 reviews
- id UUID PK
- booking_id UUID NOT NULL FK -> bookings.id
- booking_visit_id UUID NULL FK -> booking_visits.id
- customer_user_id UUID NOT NULL FK -> users.id
- staff_user_id UUID NULL FK -> staff_profiles.user_id
- rating smallint NOT NULL CHECK rating BETWEEN 1 AND 5
- review_text text NULL
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(booking_id)
- INDEX(staff_user_id, rating)
- INDEX(customer_user_id)

Application Constraint
- One review per customer per booking_visit; if booking_visit_id is null, one review per booking

3.19 notification_logs
- id UUID PK
- user_id UUID NULL FK -> users.id
- booking_id UUID NULL FK -> bookings.id
- booking_visit_id UUID NULL FK -> booking_visits.id
- channel varchar(20) NOT NULL CHECK channel IN ('WHATSAPP')
- template_code varchar(50) NOT NULL
- recipient varchar(20) NOT NULL
- rendered_content text NOT NULL
- external_message_id varchar(100) NULL
- status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK status IN ('PENDING','SENT','FAILED')
- provider_error text NULL
- sent_at timestamptz NULL
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(user_id)
- INDEX(booking_id)
- INDEX(status, created_at)

3.20 audit_logs
- id UUID PK
- actor_user_id UUID NULL FK -> users.id
- entity_type varchar(50) NOT NULL
- entity_id UUID NOT NULL
- action varchar(50) NOT NULL
- ip_address inet NULL
- user_agent text NULL
- created_at timestamptz NOT NULL DEFAULT now()

Indexes
- INDEX(entity_type, entity_id)
- INDEX(actor_user_id)
- INDEX(created_at)

Key Relationships
- users 1:1 customer_profiles
- users 1:1 staff_profiles
- users 1:N refresh_tokens
- users 1:N patients (as customer owner)
- users 1:N bookings (as customer)
- patients 1:N bookings
- service_types 1:N packages
- service_types 1:N bookings
- bookings 1:N booking_visits
- bookings 1:N booking_assignments
- bookings 1:N reports
- reports 1:N report_files
- staff_profiles N:M service_types through staff_service_types
- staff_profiles 1:N booking_visits
- staff_profiles 1:N booking_assignments
- bookings / visits / users 1:N notification_logs


4. API ENDPOINTS (REST FORMAT)

Base Prefix
- /api/v1

4.1 Auth
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- PATCH /auth/change-password

4.2 Users / Customers / Patients / Addresses
- GET /users/me
- PATCH /users/me
- GET /customers/:user_id
- PATCH /customers/:user_id
- POST /patients
- GET /patients
- GET /patients/:id
- PATCH /patients/:id
- POST /addresses
- GET /addresses
- GET /addresses/:id
- PATCH /addresses/:id
- DELETE /addresses/:id

4.3 Staff
- POST /staff
- GET /staff
- GET /staff/:user_id
- PATCH /staff/:user_id
- POST /staff/:user_id/verify
- PATCH /staff/:user_id/availability
- POST /staff/:user_id/services
- DELETE /staff/:user_id/services/:service_type_id
- POST /staff/:user_id/documents/presign
- POST /staff/:user_id/documents/confirm
- GET /staff/:user_id/documents

4.4 Services
- GET /service-types
- GET /service-types/:id
- POST /service-types
- PATCH /service-types/:id

4.5 Packages
- GET /packages
- GET /packages/:id
- POST /packages
- PATCH /packages/:id
- DELETE /packages/:id

Suggested Filters
- service_type_id
- package_type
- city_id
- is_active

4.6 Bookings
- POST /bookings
- GET /bookings
- GET /bookings/:id
- PATCH /bookings/:id/confirm
- PATCH /bookings/:id/cancel
- PATCH /bookings/:id/reschedule
- POST /bookings/:id/assignments
- GET /bookings/:id/visits

Suggested Filters
- status
- customer_user_id
- patient_id
- staff_user_id
- service_type_id
- city_id
- from_date
- to_date

4.7 Visits
- GET /visits
- GET /visits/:id
- PATCH /visits/:id/assign
- PATCH /visits/:id/en-route
- PATCH /visits/:id/check-in
- PATCH /visits/:id/check-out
- PATCH /visits/:id/complete
- PATCH /visits/:id/miss
- PATCH /visits/:id/cancel

4.8 Reports
- POST /reports
- GET /reports
- GET /reports/:id
- PATCH /reports/:id
- POST /reports/:id/files/presign
- POST /reports/:id/files/confirm
- DELETE /reports/:id/files/:file_id

Suggested Filters
- patient_id
- booking_id
- booking_visit_id
- report_type

4.9 Reviews
- POST /reviews
- GET /reviews
- GET /reviews/:id

Suggested Filters
- booking_id
- booking_visit_id
- staff_user_id
- rating

4.10 Notifications (Admin/Internal)
- GET /notifications
- POST /notifications/:id/retry

4.11 Admin Operational Endpoints
- GET /admin/dashboard/summary
- GET /admin/dashboard/bookings
- GET /admin/dashboard/staff-utilization
- GET /admin/dashboard/reviews
- GET /admin/audit-logs

Response Conventions
- Success:
  - { "success": true, "data": ... }
- Error:
  - { "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": [...] } }


5. AUTHENTICATION & AUTHORIZATION FLOW (JWT + ROLES)

Authentication Model
- JWT access token for API authorization
- Refresh token rotation for session renewal
- Password hash stored using bcrypt or Argon2
- Admin login via email/phone + password
- Staff/Customer login via phone + password in v1

Token Strategy
- Access token TTL: 15 minutes
- Refresh token TTL: 30 days
- Refresh token stored hashed in refresh_tokens table
- Revoke refresh token on logout
- Rotate refresh token on refresh request

JWT Claims
- sub: user_id
- role: ADMIN | STAFF | CUSTOMER
- phone
- session_id or token_id
- iat / exp

Authorization Rules
- ADMIN
  - Full CRUD across platform
  - Can confirm/cancel bookings
  - Can assign/reassign staff
  - Can verify staff
  - Can read all reports and reviews

- STAFF
  - Can read own profile
  - Can view assigned visits/bookings
  - Can update visit status
  - Can upload reports for assigned visits/bookings
  - Cannot access unrelated customer/patient data

- CUSTOMER
  - Can manage own profile, addresses, and patients
  - Can create/read/cancel own bookings
  - Can read reports for own patients
  - Can submit reviews for own completed services

Middleware
- authenticate: verifies JWT and loads user context
- authorize(...roles): enforces role-based access
- validateOwnership: ensures customer/staff accesses only own resources
- validateRequest: body/query/params schema validation

Web Storage Guidance
- Web: access token in memory, refresh token in HttpOnly secure cookie
- Mobile: access + refresh in secure encrypted storage


6. BOOKING WORKFLOW (STEP-BY-STEP)

Booking Creation
1. Customer selects service_type_id, package_id, patient_id, address_id, requested_start_at.
2. API validates:
   - customer owns patient_id
   - customer owns address_id (or address is allowed)
   - package belongs to selected service_type_id
   - package is active
3. API calculates total_price from package price.
4. API creates booking with status = PENDING.
5. API generates booking_number.
6. API creates booking_visits:
   - PER_VISIT -> 1 visit
   - WEEKLY -> generate package.visit_count visits within package.duration_days
   - MONTHLY -> generate package.visit_count visits within package.duration_days
7. API commits transaction.
8. API inserts notification_logs entry for booking received message.
9. Worker sends WhatsApp booking acknowledgement.

Booking Confirmation
10. Admin reviews booking.
11. Admin confirms booking -> status = CONFIRMED.
12. API records confirmed_at and confirmed_by_user_id.
13. Notification queued to customer.

Staff Assignment
14. Admin selects eligible staff by:
   - service type
   - city/zone
   - gender preference
   - verification_status = VERIFIED
   - availability = true
15. Admin assigns staff to one or more booking_visits.
16. API updates booking_visits.assigned_staff_user_id and status = ASSIGNED.
17. API inserts booking_assignments history rows.
18. If all pending visits have assignments, booking status = ASSIGNED.
19. Notifications queued to staff and customer.

Visit Execution
20. Staff marks visit EN_ROUTE.
21. Staff checks in -> status = CHECKED_IN, check_in_at set.
22. Staff performs service and submits before_condition_text, after_condition_text, visit_notes.
23. Staff uploads report(s) if applicable.
24. Staff checks out / completes visit -> status = COMPLETED, check_out_at set.
25. If first visit completed, booking may move to IN_PROGRESS.
26. If all visits completed, booking status = COMPLETED.
27. Completion/update notifications queued to customer.

Cancellation / Reschedule
28. Customer or admin requests cancel/reschedule.
29. API validates state transition.
30. API updates booking and/or affected visits.
31. Notification queued.

Review Submission
32. Customer submits rating after visit/booking completion.
33. API validates booking ownership and completion state.
34. Review saved.
35. Low rating threshold triggers internal alert.


7. FILE UPLOAD HANDLING (REPORTS)

Storage Strategy
- Files are stored in AWS S3 or Cloudinary
- Database stores only metadata and ownership references
- Direct-to-storage upload preferred for scalability

Allowed Files
- PDF
- JPG / JPEG
- PNG
- Maximum size configurable (recommended: 10 MB per file in v1)

Upload Flow
1. Client creates report record:
   - POST /reports
2. Client requests upload authorization:
   - POST /reports/:id/files/presign
3. API validates:
   - user has access to the linked booking/visit
   - report exists
   - file mime type and size are allowed
4. API returns:
   - signed upload URL or signed Cloudinary params
   - file_key/public_id
   - expiry time
5. Client uploads file directly to storage provider.
6. Client calls:
   - POST /reports/:id/files/confirm
   Body includes:
   - file_key
   - file_url
   - mime_type
   - file_size_bytes
   - checksum_sha256 (optional)
7. API stores metadata in report_files.
8. File becomes visible based on reports.is_visible_to_customer.

Validation Rules
- Reject unsupported mime types
- Reject oversize uploads
- Reject orphaned confirmations where report does not exist or user lacks access
- Optional malware scan hook can be added later

Access Rules
- ADMIN: full access
- STAFF: only own assigned booking/visit files
- CUSTOMER: only files related to own patients/bookings and where is_visible_to_customer = true

Deletion Policy
- Soft delete not required for files in v1
- Hard delete via admin only
- DB row and storage object should be removed together in a controlled operation


8. NOTIFICATION SYSTEM (WHATSAPP FLOW)

Architecture
- Notifications created as DB records first
- Worker polls/processes pending notification_logs
- WhatsApp provider call executed asynchronously
- Provider response stored in notification_logs

Trigger Events
- Booking created
- Booking confirmed
- Staff assigned
- Visit reminder
- Staff en route
- Visit completed
- Report uploaded
- Package nearing completion
- Booking cancelled/rescheduled

Recommended Template Codes
- BOOKING_RECEIVED
- BOOKING_CONFIRMED
- STAFF_ASSIGNED
- VISIT_REMINDER
- STAFF_EN_ROUTE
- VISIT_COMPLETED
- REPORT_AVAILABLE
- PACKAGE_RENEWAL
- BOOKING_CANCELLED
- BOOKING_RESCHEDULED

Flow
1. Business event occurs in API.
2. API writes domain data transaction first.
3. API creates notification_logs row with status = PENDING.
4. Worker fetches pending records in batches.
5. Worker renders message content using template + booking/user context.
6. Worker sends message through WhatsApp API.
7. On success:
   - status = SENT
   - external_message_id stored
   - sent_at stored
8. On failure:
   - status = FAILED
   - provider_error stored
9. Retry policy applies for transient failures.

Retry Policy
- Max 3 attempts
- Exponential backoff
- No retry for permanent validation errors (invalid number, blocked template, etc.)

Reminder Scheduling
- Scheduled job checks upcoming booking_visits
- Create VISIT_REMINDER notification N minutes before scheduled_start_at
- Recommended default: 60 minutes before visit


9. ERROR HANDLING STRATEGY

Error Categories
- Validation errors
- Authentication errors
- Authorization errors
- Not found errors
- Business rule violations
- External provider errors
- Database/transaction errors
- Internal server errors

HTTP Status Mapping
- 400 Bad Request -> invalid input / invalid state transition
- 401 Unauthorized -> missing/invalid token
- 403 Forbidden -> role/ownership violation
- 404 Not Found -> entity not found
- 409 Conflict -> duplicate/invalid conflicting state
- 422 Unprocessable Entity -> domain validation failure
- 429 Too Many Requests -> rate limit hit
- 500 Internal Server Error -> unexpected server error
- 502/503 -> external provider unavailable

Standard Error Payload
- success: false
- error.code: machine-readable code
- error.message: human-readable message
- error.details: optional list

Example Error Codes
- AUTH_INVALID_CREDENTIALS
- AUTH_TOKEN_EXPIRED
- ACCESS_FORBIDDEN
- BOOKING_NOT_FOUND
- BOOKING_ALREADY_CANCELLED
- STAFF_NOT_VERIFIED
- VISIT_ALREADY_COMPLETED
- REPORT_UPLOAD_INVALID_TYPE
- NOTIFICATION_PROVIDER_FAILED

Implementation Rules
- Global Express error middleware required
- Zod/Joi validation recommended at request boundary
- Prisma errors mapped to domain-safe messages
- No raw stack traces returned to client
- Request ID included in logs and error responses
- Critical multi-write flows use DB transaction with rollback


10. SECURITY CONSIDERATIONS

Authentication Security
- Password hashing with bcrypt/Argon2
- JWT signed with strong secret/private key
- Refresh token rotation and revocation
- Secure cookie for web refresh token
- Optional MFA for admin in phase 2

Authorization Security
- Strict RBAC middleware
- Ownership checks on all customer/staff resource access
- No trust in client-sent role/user identifiers

API Security
- HTTPS only
- CORS allowlist
- Rate limiting on auth and public endpoints
- Input validation and sanitization
- Helmet/security headers
- Request size limits

Data Protection
- Sensitive files stored privately
- Signed URLs for private file access where needed
- CNIC values masked in non-admin responses
- Audit logging for admin actions
- Avoid storing medical data in logs
- Backups encrypted at rest
- Secrets managed via environment secret manager

Operational Security
- Separate environments: dev/staging/prod
- Least-privilege DB credentials
- Prisma migrations reviewed before production apply
- Access logging for admin actions and report access
- Soft delete only where recovery is needed; hard delete for storage objects by admin only

Recommended Extra Controls
- IP/device monitoring for admin logins
- Brute-force protection on login
- Periodic token cleanup job
- Security event alerts for repeated failed logins


11. SCALABILITY CONSIDERATIONS

Application Scaling
- Keep API stateless
- Run multiple API instances behind load balancer when traffic grows
- Separate worker process for notifications/reminders
- Modular monolith first; extract services later only when justified

Database Scaling
- Use Neon pooled connections
- Add indexes on high-frequency filters and foreign keys
- Paginate all list endpoints
- Use cursor pagination for large booking/visit feeds if needed
- Avoid N+1 queries via Prisma include/select discipline
- Archive old audit/notification rows periodically

Query/Write Optimization
- Transaction boundaries only around critical writes
- Precompute booking totals and statuses instead of expensive runtime aggregation
- Use selective columns in list APIs
- Add partial indexes for active statuses if required

Storage Scaling
- Direct client upload to S3/Cloudinary
- CDN-backed file delivery when public or signed delivery when private
- Enforce file size/type limits before upload

Notification Scaling
- Queue-backed worker recommended (BullMQ/Redis or DB-backed scheduler)
- Batch pending notification fetches
- Idempotent send logic using notification_logs.id
- Retry transient failures only

Future-Ready Design
- city_id present in key business entities for multi-city expansion
- zones support intra-city dispatching
- packages can be city-specific
- service/staff matching can later move from admin-only to assisted auto-assignment
- can add payment, subscriptions, live tracking, and dispatch optimization without replacing core schema

Minimum Production Operational Targets
- P95 API latency under acceptable threshold for read endpoints
- Zero data loss for booking creation transactions
- At-least-once notification processing with deduplication safeguards
- Full auditability for assignment, status changes, and report uploads


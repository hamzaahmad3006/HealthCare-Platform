PRODUCT REQUIREMENTS DOCUMENT (PRD)
Healthcare Home Services Platform – Faisalabad, Pakistan

1. PRODUCT OVERVIEW

Product Name:
Home Healthcare Service Platform (working title)

Product Summary:
A city-focused healthcare service platform enabling families in Faisalabad to book trusted home healthcare services on demand through web and mobile channels. The platform manages booking, staff assignment, service delivery, patient progress updates, reporting, and family communication via WhatsApp.

Launch Scope:
Initial launch in Faisalabad with future expansion to additional cities in Pakistan.

Services in Scope:
- Home Nursing (Male / Female)
- Caregiver / Patient Attendant
- Home Lab Sampling
- Visiting Doctor
- Physiotherapy
- Ambulance Services

Business Model:
- Per Visit
- Weekly Package
- Monthly Package

Core Value Proposition:
- Fast and trusted access to verified healthcare staff at home
- Transparent pricing and service SOPs
- Family visibility through visit updates, reports, and WhatsApp notifications
- Operational control through admin-led staff assignment and performance tracking


2. TARGET USERS (PERSONAS)

Persona 1: Family Decision Maker
Profile:
- Adult son/daughter or spouse arranging care for a patient
- Usually manages booking, payments, and follow-up remotely or locally

Needs:
- Quick booking
- Trust in staff verification
- Clear pricing
- Regular visit updates
- Easy communication without repeated phone calls

Persona 2: Patient / Elderly Care Recipient
Profile:
- Elderly, post-surgery, chronic illness, or mobility-limited patient at home

Needs:
- Reliable and respectful care
- On-time visits
- Continuity of caregiver or nurse
- Progress tracking and comfort

Persona 3: Operations Admin
Profile:
- Internal team responsible for bookings, scheduling, staff allocation, quality assurance, and escalations

Needs:
- Central dashboard for requests and assignments
- Staff availability visibility
- Verification records
- Service tracking and issue resolution

Persona 4: Field Staff
Profile:
- Nurses, attendants, lab technicians, doctors, physiotherapists, ambulance crew

Needs:
- Clear assignment details
- Easy check-in/check-out
- Access to patient notes and SOPs
- Ability to upload visit updates and reports

Persona 5: Healthcare Startup Founder / Management
Profile:
- Business leadership tracking growth, utilization, quality, and operational efficiency

Needs:
- Service-level metrics
- Staff utilization
- Customer retention
- Unit economics by service/package/city


3. PROBLEMS & GOALS

Problems:
- Families struggle to find reliable and verified home healthcare providers
- Service booking and coordination are fragmented across calls and WhatsApp chats
- There is low trust due to unclear pricing, inconsistent staff quality, and lack of visibility
- Families do not receive structured patient progress updates after visits
- Admin teams lack a system to manage field staff, scheduling, compliance, and service history
- Local home healthcare providers often lack strong digital presence and SEO discoverability

Product Goals:
- Enable fast, structured booking of home healthcare services
- Build trust through verified staff profiles, SOPs, pricing transparency, and service visibility
- Give admin full operational control over staffing, scheduling, and service quality
- Keep family informed through visit updates, reports, and WhatsApp notifications
- Create a strong local acquisition engine through SEO pages, Maps, and Google Business Profile
- Build a scalable city-based operating model that can be replicated in new cities


4. KEY FEATURES (GROUPED)

A. Customer Booking Experience
- Service selection by category
- Package selection: Per Visit / Weekly / Monthly
- Patient details and address capture
- Preferred schedule selection
- Special instructions / medical notes
- Booking confirmation and tracking
- Web and mobile responsive experience

B. Admin Operations Console
- Booking queue and status management
- Manual/assisted staff assignment
- City/area-based dispatching
- Staff availability calendar
- Service rescheduling and cancellation handling
- Escalation and incident logging

C. Staff Management & Trust Layer
- Staff onboarding records
- CNIC, certifications, police verification, and training status
- Verified staff badges
- ID card issuance tracking
- Uniform issuance and replacement tracking
- Gender, specialty, shift, and area tagging
- Performance history and rating visibility

D. Service Delivery & Visit Updates
- Staff check-in/check-out for each visit
- Daily visit notes
- Vital observations / treatment notes (where applicable)
- Before/after progress tracking with text, images, or structured updates
- Missed visit and late visit reporting
- Family-facing progress timeline

E. Reports & Medical Documents
- Upload lab reports, prescriptions, progress notes, and discharge summaries
- Role-based access for patient/family/admin
- Report history by patient
- Download/view reports on web and mobile

F. Communication & Notifications
- WhatsApp auto-replies for inquiries and booking acknowledgement
- Booking confirmation notifications
- Visit reminders
- Staff en route / assigned notifications
- Daily update summaries to family
- Renewal reminders for weekly/monthly packages

G. Ratings, Reviews & Quality Control
- Customer rating after each service or package cycle
- Written review capture
- Internal issue tagging (professionalism, punctuality, care quality, behavior)
- Admin follow-up workflow for low ratings

H. Growth & Discovery
- SEO-focused service pages by service and city/area
- Google Business Profile integration
- Google Maps location and direction support
- Lead capture from website, search, and Maps
- Click-to-WhatsApp and call actions


5. USER JOURNEYS (STEP-BY-STEP)

Journey 1: Customer Books a Service
1. User lands on service page via search, direct, ad, or referral
2. User selects service type
3. User chooses package (Per Visit / Weekly / Monthly)
4. User enters patient details, location, preferred timing, and care notes
5. User submits booking request
6. System confirms request and sends WhatsApp acknowledgement
7. Admin reviews and confirms serviceability
8. Admin assigns appropriate staff
9. User receives confirmation with assigned staff details and visit timing

Journey 2: Admin Assigns Staff
1. Booking appears in admin dashboard
2. Admin reviews service type, location, timing, gender preference, and patient condition
3. System shows eligible staff based on skill, gender, area, shift, and availability
4. Admin assigns staff manually
5. Assigned staff receives task details
6. Customer/family receives assignment notification via WhatsApp

Journey 3: Staff Performs Visit
1. Staff views assignment details in app/panel
2. Staff arrives and checks in
3. Staff performs service per SOP
4. Staff uploads visit notes, observations, images, or report attachments if required
5. Staff checks out after completion
6. Admin can review visit completion and exceptions

Journey 4: Family Receives Updates
1. After visit completion, system generates summary
2. Family receives WhatsApp notification with update summary or secure link
3. Family can view progress timeline, reports, and upcoming visits
4. Family can submit feedback or raise concern

Journey 5: Repeat Package Management
1. Weekly/monthly package is active
2. Admin schedules recurring visits
3. Staff completes each visit with updates
4. Family receives daily/periodic progress notifications
5. System triggers renewal reminder near package end
6. User renews or changes package


6. FUNCTIONAL REQUIREMENTS

A. Booking & Customer Module
- Users must be able to book any listed service from web and mobile web/app
- System must support package selection: Per Visit, Weekly, Monthly
- System must capture:
  - Customer name and contact
  - Patient name, age, gender
  - Service address
  - Service type
  - Schedule preference
  - Gender preference for staff where applicable
  - Medical notes / special instructions
- System must create a unique booking ID
- System must allow admin review before final confirmation
- System must support booking status flow:
  - New
  - Pending Confirmation
  - Confirmed
  - Assigned
  - In Progress
  - Completed
  - Cancelled
  - Rescheduled

B. Staff Management Module
- Admin must be able to create and manage staff profiles
- Staff profile must include:
  - Full name
  - Role/service type
  - Gender
  - Area/zone
  - CNIC
  - Certifications/licenses
  - Verification status
  - Availability schedule
  - ID card status
  - Uniform issue status
  - Ratings/history
- System must support verification tags such as:
  - Documents Submitted
  - Background Checked
  - Trained
  - Active
- Admin must be able to activate/deactivate staff

C. Assignment & Scheduling
- Admin must be able to assign staff to each booking
- System should display eligible staff based on service type, geography, gender preference, and availability
- Admin must be able to reassign staff if needed
- System must maintain visit schedule for package bookings
- System must log assignment history and changes

D. Visit Execution
- Staff must be able to view assigned visits
- Staff must be able to check in and check out
- Staff must submit structured visit updates
- Visit update forms should vary by service type where needed
- Staff must be able to upload images, documents, and notes
- System must flag incomplete or missed updates to admin

E. Patient Reports & Progress Tracking
- Admin/staff must be able to upload reports and patient documents
- Customer/family must be able to view authorized reports
- System must maintain a patient progress timeline
- System must support before/after tracking for relevant services such as physiotherapy or long-term care
- System must maintain historical service records per patient

F. Notifications & WhatsApp
- System must send WhatsApp confirmation after booking submission
- System must send WhatsApp updates for:
  - Booking confirmation
  - Staff assigned
  - Visit reminder
  - Visit completed
  - Report uploaded
  - Package renewal reminder
- System should support auto-replies for common pre-booking inquiries
- Admin must be able to configure message templates

G. Reviews & Ratings
- Customers must be able to rate completed visits/services
- Customers must be able to leave written reviews
- System must flag low ratings for admin follow-up
- Admin must be able to view ratings by service, staff, and city

H. Website, SEO & Local Presence
- Platform must support SEO landing pages for each service
- Pages must support location-based content (e.g., home nursing in Faisalabad)
- Website must include pricing visibility or “starting from” pricing where relevant
- Google Maps location link and Google Business Profile actions must be visible
- Contact actions must include WhatsApp and phone call

I. Admin Reporting
- Admin dashboard must show:
  - Total bookings
  - Active package customers
  - Service completion rate
  - Staff utilization
  - Repeat booking rate
  - Average rating
  - Cancellation rate
- Reports should be filterable by date, service type, staff member, and area


7. NON-FUNCTIONAL REQUIREMENTS

- Mobile-first responsive experience for customers
- Simple UI for low-tech operational teams
- Secure handling of patient and medical data
- Role-based access control for admin, staff, and family/customer
- Audit logs for booking, assignment, report upload, and status changes
- High availability during business hours with reliable notification delivery
- Local language readiness (English/Urdu support preferred)
- Scalable architecture to support expansion to additional cities
- Fast page load for SEO landing pages
- Basic compliance-ready data practices for healthcare-sensitive information
- Backup and recovery for customer, staff, and patient records


8. SUCCESS METRICS

Business Metrics
- Number of bookings per week
- Conversion rate from website visitor to booking lead
- Package adoption rate (weekly/monthly vs per visit)
- Repeat booking rate
- Revenue by service line
- Customer acquisition from organic search and Google Business Profile

Operational Metrics
- Booking confirmation turnaround time
- Staff assignment turnaround time
- On-time visit rate
- Visit completion rate
- Staff utilization rate
- Missed/cancelled visit rate

Trust & Experience Metrics
- Average customer rating
- Net promoter or referral intent score
- Percentage of bookings with verified staff assigned
- Family update delivery rate via WhatsApp
- Complaint rate per 100 bookings

Growth Metrics
- Organic traffic to service pages
- Google Business Profile calls/clicks/direction requests
- Lead-to-booking conversion by source
- Area-wise demand distribution within Faisalabad


9. RISKS & ASSUMPTIONS

Assumptions
- Customers are comfortable using web/WhatsApp for booking and updates
- Admin-led assignment is operationally preferred at launch over auto-dispatch
- Sufficient supply of verified staff can be onboarded in Faisalabad
- WhatsApp will be a primary communication channel for both acquisition and retention
- Initial demand will be concentrated in a limited set of urban/locality zones

Risks
- Staff reliability and quality inconsistency may damage trust early
- Manual ops may become a bottleneck if booking volume grows quickly
- Medical data handling may create privacy and compliance risk if not controlled
- Incomplete visit updates from staff may reduce family confidence
- High cancellation or rescheduling rates can impact service experience
- Local competition using informal pricing may create price pressure
- Ambulance operations may require special partner workflows and availability control


10. FUTURE SCOPE (SHORT)

- Multi-city expansion with city-level ops dashboards
- Native iOS/Android apps for customers and staff
- In-app payments and subscriptions
- Real-time staff tracking for select services
- Auto-dispatch and smarter matching engine
- Teleconsultation add-on
- Electronic care plans and recurring treatment protocols
- Hospital/clinic referral partnerships
- Corporate/homecare partnerships
- CRM and marketing automation for retention and reactivation


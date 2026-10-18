
---

### 2. `PRD.md` (Product Requirements Document)
*(Create a `docs` folder in your root directory and save this as `docs/PRD.md`)*

```markdown
# Product Requirements Document (PRD): UniFlow

## 1. Overview
**UniFlow** is a SaaS platform that modernizes how universities manage student queues, appointments, and clearance workflows. By replacing physical lines with a digital, real-time queuing system, UniFlow improves campus efficiency and drastically improves the student experience.

## 2. Target Audience & Personas
- **Students (Primary Users):** Need to access campus services (Bursary, Library, Hostel) without missing classes by standing in lines.
- **Staff (Service Providers):** Need a simple interface to call the next person, manage their queue, and track service times.
- **Admin (University Management):** Needs oversight of all queues, staff, and students within their specific university.
- **Super Admin (Platform Owner):** Manages the entire multi-tenant platform, onboarding new universities and monitoring system health.

## 3. User Roles & Permissions

| Feature | Student (`USER`/`FRESHER`) | Staff (`STAFF`) | Admin (`ADMIN`) | Super Admin (`SUPER_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: |
| Join Queue | ✅ | ❌ | ❌ | ❌ |
| Call Next / Serve | ❌ | ✅ | ✅ | ✅ |
| Manage Appointments | ✅ (Book) | ✅ (Approve) | ✅ | ✅ |
| Clearance Workflows | ✅ (Complete) | ✅ (Approve) | ✅ (Create) | ✅ |
| View University Stats | ❌ | ❌ | ✅ | ✅ |
| Manage Staff/Offices | ❌ | ❌ | ✅ | ✅ |
| Manage Universities | ❌ | ❌ | ❌ | ✅ |

## 4. Functional Requirements

### 4.1. Authentication & Security
- Users must be able to register, log in, and verify their email.
- Passwords must be hashed (BCrypt).
- JWT Access Tokens and Refresh Tokens for secure sessions.
- Rate-limiting on login attempts to prevent brute-force attacks.

### 4.2. Queue Management (Core)
- Students can view a list of active queues across various offices.
- Students can join a queue and receive a digital ticket.
- The UI must poll for real-time updates (position, people ahead, estimated wait time).
- Staff can trigger "Call Next", "Serve", and "Complete" actions.
- Queues can be paused/closed by staff.

### 4.3. Student Workflows (Clearance)
- Admins can create multi-step workflows (e.g., "Hostel Clearance").
- Students can initiate a workflow and see their progress bar.
- Certain steps may require joining a queue or uploading documents.

### 4.4. Notifications
- Push notifications when a student is 3 positions away.
- Email notifications for account creation and password resets.
- In-app notification center.

## 5. Non-Functional Requirements
- **Performance:** The queue polling should not block the UI. Estimated wait times must update within 5 seconds.
- **Scalability:** The system must support multiple universities (multi-tenancy) without data leakage.
- **Reliability:** Flyway migrations must ensure database schema consistency across deployments.
- **UI/UX:** The interface must be mobile-responsive, accessible (WCAG 2.1 AA), and intuitive.

## 6. User Flow (High Level)
1. **Onboarding:** Super Admin creates a University. Admin registers staff.
2. **Daily Use:** Student logs in -> Views dashboard -> Joins "Library" queue -> Receives ticket #B-017 -> Gets notified -> Arrives at desk -> Staff clicks "Serve" -> Ticket completed.
3. **Clearance Season:** Admin publishes "Fall 2026 Clearance" -> Student starts workflow -> Visits Bursary queue -> Bursary approves step -> Student moves to Library step -> Completes workflow.
# MediBook — Hospital Appointment Management System

> Graduation Project — Full-Stack Web Application

---

## 1. Project Overview

**MediBook** is a web-based hospital appointment management system that allows patients to book appointments with doctors across different hospital departments. The system supports multiple user roles (patients, doctors, nurses, receptionists, administrators, directors) with role-based access control (RBAC), and includes an AI-powered triage assistant that helps patients identify the correct department based on their symptoms.

### Problem Statement

Traditional hospital appointment systems rely on phone calls, walk-ins, or fragmented tools. Patients often wait in long queues without knowing which department to visit. Staff lack a centralized dashboard to manage bookings, and administrators have no visibility into hospital utilization.

### Solution

A unified platform where:
- Patients can browse departments, select doctors, pick time slots, and book appointments online
- Staff can manage bookings, view schedules, and process cancellations from a dashboard
- Administrators can manage users, roles, departments, and doctors
- An AI assistant helps patients self-triage to the correct department before booking

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (Legacy) | React 19, Vite 8, React Router v7, Tailwind CSS |
| **Frontend (New)** | **Laravel 11, Livewire, Alpine.js, Tailwind CSS (TALL Stack)** |
| **Admin Panel** | **Filament v3** |
| **Backend** | **Laravel 11 (PHP 8.2+)** |
| **Database** | **MySQL 8 / PostgreSQL** |
| **Auth** | **Laravel Breeze / Fortify + Spatie Roles & Permissions** |
| **AI Integration** | **Laravel AI SDK (OpenRouter / Gemini)** |
| **Real-time** | **Laravel Echo + Pusher (optional)** |
| Queue System | Laravel Queues (Redis / Database) |
| Deployment | Laravel Forge / Railway / Docker |

---

## 3. User Roles & Permissions

### 3.1 Role Hierarchy

| Role | Access Level | Description |
|------|-------------|-------------|
| `patient` | Public portal | Books appointments, views own bookings |
| `doctor` | Dashboard (limited) | Views own schedule and assigned bookings |
| `nurse` | Dashboard | Views all bookings, creates/updates bookings |
| `receptionist` | Dashboard | Views all bookings, creates/updates/cancels |
| `dept_manager` | Dashboard + Reports | Manages department doctors, views reports |
| `admin` | Full dashboard | Manages users, departments, doctors, bookings |
| `director` | Full + Reports | Manages everything, views/exports reports |
| `super_admin` | Everything | Full system access, manages roles/permissions |

### 3.2 Permission Matrix

| Permission | Patient | Doctor | Nurse | Receptionist | Admin | Director | Super Admin |
|-----------|---------|--------|-------|-------------|-------|----------|-------------|
| Book appointment | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | — | — | — | — | — |
| View all bookings | — | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel bookings | Own only | — | — | ✅ | ✅ | ✅ | ✅ |
| Manage departments | — | — | — | — | ✅ | ✅ | ✅ |
| Manage doctors | — | — | — | — | ✅ | ✅ | ✅ |
| Manage users | — | — | — | — | ✅ | ✅ | ✅ |
| Manage roles | — | — | — | — | — | — | ✅ |
| View reports | — | — | — | — | — | ✅ | ✅ |
| Export reports | — | — | — | — | — | ✅ | ✅ |
| View dashboard | — | — | — | — | ✅ | ✅ | ✅ |

---

## 4. Feature Breakdown

### Module 1: Authentication & Registration

| Feature | Status | Description |
|---------|--------|-------------|
| Patient registration | ✅ Built | Email + password with full name |
| Email verification (OTP) | ✅ Built | 6-digit code via email, auto-verify on complete |
| Patient login | ✅ Built | Email + password with session persistence |
| Staff login (separate portal) | ✅ Built | Dark-themed login, role-based redirect |
| Password reset | ❌ Missing | Forgot password flow |
| Social login (Google) | ❌ Missing | OAuth2 via Google |
| Session management | ✅ Built | Auto-refresh, persistent sessions |

### Module 2: Patient Booking Flow

| Feature | Status | Description |
|---------|--------|-------------|
| Department listing | ✅ Built | Grid with images, slot availability, search/filter |
| Department capacity display | ✅ Built | Shows booked/max daily slots with progress bar |
| Booking type selection | ✅ Built | Choose between Consultant or Doctor |
| Doctor selection | ✅ Built | List with availability status, search, today filter |
| Slot selection | ✅ Built | Date picker, available/booked slots, time range display |
| Patient information form | ✅ Built | Name, phone, age with validation |
| Booking confirmation | ✅ Built | Queue number, booking ref, summary card |
| Next appointment display | ✅ Built | Shown on home page with notification bell |
| Walk-in booking (staff) | ❌ Missing | Staff books on behalf of patient |

### Module 3: Booking Management

| Feature | Status | Description |
|---------|--------|-------------|
| My Bookings (patient) | ✅ Built | List of patient's bookings with status |
| Cancel booking (patient) | ✅ Built | Search by ref + phone, confirm, cancel |
| Cancel booking (staff) | ✅ Built | From admin dashboard table |
| Booking status tracking | ✅ Basic | Active / Cancelled only |
| Reschedule booking | ❌ Missing | Change date/time of existing booking |
| Booking history | ❌ Missing | Past bookings (completed/cancelled) |
| SMS/Email confirmation | ❌ Missing | Notification on booking create/cancel |

### Module 4: Staff Dashboard

| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard overview | ✅ Built | Stats cards (total, active, cancelled) |
| Department breakdown | ✅ Built | Bookings per department with progress bars |
| All bookings table | ✅ Built | Search, filter by status, cancel action |
| Quick actions | ✅ Built | View bookings, patient portal link |
| Today's schedule view | ❌ Missing | Today's bookings grouped by doctor |
| Print queue list | ❌ Missing | Printable queue for reception |

### Module 5: Admin Panel

| Feature | Status | Description |
|---------|--------|-------------|
| User management | ✅ Built | List, search, filter by role, edit role, delete |
| Role management | ✅ Built | View roles, edit permissions (super_admin) |
| Role badge system | ✅ Built | Color-coded role badges |
| Department CRUD | ✅ Built | Create, edit, delete, toggle open/closed |
| Doctor/Consultant CRUD | ✅ Built | Add, edit, delete, toggle active, set working days + slots |
| Audit log | ❌ Missing | Track who did what and when |
| Bulk operations | ❌ Missing | Bulk delete, bulk role change |

### Module 6: AI Triage System

| Feature | Status | Description |
|---------|--------|-------------|
| Symptom input (chat interface) | ✅ Built | Bilingual Arabic/English chat |
| AI follow-up questions | ✅ Built | 3-5 focused questions via OpenRouter |
| Department recommendation | ✅ Built | JSON block with department, severity, advice |
| Severity levels | ✅ Built | Low, Medium, High, Emergency |
| Recommendation card UI | ✅ Built | Color-coded card with department + advice |
| Emergency detection | ✅ Built | Auto-recommends Emergency for critical symptoms |
| Direct booking from triage | ❌ Missing | "Book Now" button on recommendation card |
| Triage history | ❌ Missing | Save past triage sessions |
| Doctor review of triage | ❌ Missing | Doctor sees triage result before appointment |

### Module 7: Settings (Admin)

| Feature | Status | Description |
|---------|--------|-------------|
| Department management | ✅ Built | Full CRUD with bilingual names, capacity |
| Doctor management | ✅ Built | Full CRUD with working days, time slots |
| Hospital settings | ❌ Missing | Hospital name, hours, contact info |
| Slot duration config | ❌ Missing | Currently hardcoded to 15 minutes |
| Notification settings | ❌ Missing | Configure email/SMS templates |
| System-wide announcements | ❌ Missing | Banner messages for patients |

### Module 8: Reports & Analytics (MISSING)

| Feature | Priority | Description |
|---------|----------|-------------|
| Daily booking summary | High | Bookings per day, per department |
| Doctor utilization report | High | How busy each doctor is |
| Department analytics | Medium | Peak hours, busiest days |
| Patient demographics | Medium | Age distribution, repeat patients |
| Export to PDF/Excel | High | Downloadable reports |
| Date range filtering | High | Filter reports by period |

### Module 9: Notifications (MISSING)

| Feature | Priority | Description |
|---------|----------|-------------|
| Email booking confirmation | High | Send confirmation email on booking |
| Email cancellation notice | High | Notify on cancellation |
| SMS reminders | Medium | Day-before appointment reminder |
| Staff notifications | Medium | New booking alerts for doctors |
| Admin alerts | Low | Capacity warnings, daily summaries |

### Module 10: Patient Profile (MISSING)

| Feature | Priority | Description |
|---------|----------|-------------|
| Profile page | High | View/edit personal information |
| Booking history | High | All past and upcoming appointments |
| Medical notes | Low | Basic notes from doctor visits |
| Preferred language | Medium | Arabic/English preference |

---

## 5. Database Schema

### Core Tables

```
users (id, name, email, password, role, phone, avatar, timestamps)
├── profiles (id, user_id, full_name, role_id, phone, created_at)
│
├── roles (id, name, description)
├── permissions (id, name, resource, description)
├── role_permissions (role_id, permission_id)
│
├── departments (id, name_en, name_ar, max_daily, is_open, image, timestamps)
├── doctors (id, name, type, department_id, working_days[], slots[], is_active, timestamps)
│
├── bookings (id, booking_ref, patient_name, phone, age, user_id,
│             doctor_id, department_id, booking_date, slot_time,
│             queue_number, status, cancelled_by, created_at, updated_at)
│
├── triage_sessions (id, user_id, messages[], recommendation, created_at)
├── audit_logs (id, user_id, action, model, model_id, old_values, new_values, timestamps)
```

---

## 6. API Endpoints (Laravel)

### Public Routes

```
GET  /                          → Home (departments listing)
GET  /booking-type/{dept}       → Select consultant or doctor
GET  /doctor-select/{dept}      → List doctors
GET  /slot-select/{doctor}      → Available slots
POST /bookings                  → Create booking
GET  /confirmation/{ref}        → Booking confirmation
POST /bookings/cancel           → Cancel by ref + phone
GET  /triage                    → AI triage chatbot
POST /triage/chat               → Send message to AI
```

### Auth Routes

```
POST /register                  → Patient registration
POST /login                     → Patient login
POST /logout                    → Logout
GET  /verify-email              → Email verification page
POST /verify-email              → Verify OTP code
GET  /my-bookings               → Patient's bookings
```

### Staff Dashboard Routes (auth + staff role)

```
GET  /dashboard                 → Overview
GET  /dashboard/bookings        → All bookings table
POST /dashboard/bookings/{id}/cancel → Cancel booking
```

### Admin Routes (auth + admin role)

```
GET  /dashboard/admin           → Admin panel
GET  /dashboard/settings        → Department & doctor management
CRUD /api/departments           → Department CRUD
CRUD /api/doctors               → Doctor CRUD
CRUD /api/users                 → User management
PUT  /api/users/{id}/role       → Change user role
GET  /dashboard/reports         → Reports & analytics
```

---

## 7. Migration Plan (React → Laravel)

### Phase 1: Foundation (Week 1)

- [ ] Laravel project setup + database configuration
- [ ] Migrate database schema (departments, doctors, bookings, users)
- [ ] Install Spatie Roles & Permissions
- [ ] Seed roles, permissions, and default admin user
- [ ] Install Filament + configure admin panel
- [ ] Build UserResource (Filament) — replaces AdminPanel users tab
- [ ] Build DepartmentResource (Filament) — replaces Settings departments tab
- [ ] Build DoctorResource (Filament) — replaces Settings doctors tab

### Phase 2: Booking System (Week 2)

- [ ] Patient booking flow (Livewire components)
  - [ ] Department listing page
  - [ ] Booking type selection
  - [ ] Doctor selection
  - [ ] Slot selection with date picker
  - [ ] Patient form with validation
  - [ ] Confirmation page with queue number
- [ ] My Bookings page (patient)
- [ ] Cancel booking flow
- [ ] Booking validation (prevent double-booking, enforce capacity)

### Phase 3: Dashboard & Admin (Week 3)

- [ ] Staff dashboard (Filament custom page)
  - [ ] Stats overview
  - [ ] Bookings table with search/filter
  - [ ] Cancel action for staff
- [ ] Admin panel polish
  - [ ] Role management UI
  - [ ] Audit log resource
- [ ] Settings page (hospital config)

### Phase 4: AI Triage (Week 4)

- [ ] Laravel AI SDK integration
- [ ] Triage chatbot (Livewire + streaming)
- [ ] Bilingual support (Arabic/English)
- [ ] Department recommendation engine
- [ ] Severity assessment
- [ ] "Book Now" from recommendation → booking flow

### Phase 5: Reports & Notifications (Week 5)

- [ ] Reports module
  - [ ] Daily booking summary
  - [ ] Department utilization
  - [ ] Doctor utilization
  - [ ] Export to PDF/Excel
- [ ] Email notifications (booking confirmation, cancellation)
- [ ] SMS reminders (optional, via Twilio/Vonage)
- [ ] Final polish, testing, deployment

---

## 8. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Page load time | < 2 seconds |
| Booking creation | < 3 seconds |
| AI triage response | < 10 seconds |
| Concurrent users | 100+ |
| Uptime | 99.5% |
| Mobile responsive | Yes (mobile-first) |
| Bilingual | Arabic + English |
| Browser support | Chrome, Firefox, Safari, Edge |

---

## 9. Success Metrics

- Patients can complete a booking in under 2 minutes
- Staff can manage bookings without phone calls
- Admin can add/remove doctors in under 1 minute
- AI triage recommends correct department 80%+ of the time
- Zero double-bookings (system-enforced)
- Full audit trail for compliance

---

## 10. Project Timeline

| Week | Deliverable | Status |
|------|------------|--------|
| Week 1 | Laravel setup, Filament admin panel, DB migration | 🔲 |
| Week 2 | Patient booking flow (all steps) | 🔲 |
| Week 3 | Staff dashboard, admin panel completion | 🔲 |
| Week 4 | AI Triage chatbot with Laravel AI SDK | 🔲 |
| Week 5 | Reports, notifications, testing, deployment | 🔲 |

---

## Appendix: Existing React Code Reference

The current React codebase (to be replaced) serves as a **functional specification**:

| React File | What It Does | Laravel Equivalent |
|-----------|-------------|-------------------|
| `Home.jsx` (946 lines) | Department grid, navbar, search, appointments | Livewire: `DepartmentController@index` + Blade |
| `BookingType.jsx` | Consultant vs Doctor selection | Livewire: `BookingTypeController` |
| `DoctorSelect.jsx` | Doctor list with search/filter | Livewire: `DoctorSelectController` |
| `SlotSelect.jsx` | Date picker + slot grid | Livewire: `SlotSelectController` |
| `PatientForm.jsx` | Patient info form + booking creation | Livewire: `PatientFormController` |
| `Confirmation.jsx` | Booking confirmation display | Blade view |
| `Cancel.jsx` | Search + cancel flow | Livewire: `CancelBookingController` |
| `MyBookings.jsx` | Patient's booking list | Livewire: `MyBookingsController` |
| `AdminPanel.jsx` | User/role management | Filament: UserResource |
| `Settings.jsx` | Department/doctor CRUD | Filament: DepartmentResource, DoctorResource |
| `Overview.jsx` | Dashboard stats | Filament: Dashboard |
| `Bookings.jsx` | All bookings table | Filament: BookingResource |
| `Triage/index.jsx` | AI chat interface | Livewire: `TriageChat` component |
| `useSalama.js` | OpenRouter API call | Laravel AI SDK service class |
| `AuthContext.jsx` | Auth state + RBAC | Laravel auth + Spatie |

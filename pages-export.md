# Pages Export — Hospital Management System

## Structure Overview

```
src/pages/
├── auth/           # Authentication & Account
├── dashboard/      # Staff Dashboard
├── doctor/         # Doctor Portal
├── nurse/          # Nurse Portal
├── receptionist/   # Receptionist Portal
├── patient/        # Patient Portal
├── billing/        # Billing & Invoices
└── Triage/         # AI Triage Assistant (Salama)
```

---

## 🔐 Auth Pages

### `auth/StaffLogin.jsx` (219 lines)
- Email/password login with Supabase
- Role-based redirect (admin→/dashboard, doctor→/doctor, patient→/)
- Timeout handling (10s), email verification check
- Shows success states for verified/registered users

### `auth/Register.jsx` (141 lines)
- Registration form: full_name, email, password, confirm_password
- Validates password match & min 6 chars
- Redirects to `/verify-email` after signup

### `auth/ForgotPassword.jsx` (107 lines)
- Sends password reset link via Supabase
- Shows "check your email" confirmation state

### `auth/ResetPassword.jsx` (145 lines)
- New password form with token validation
- Auto-redirects to login after 3s on success

### `auth/VerifyEmail.jsx` (190 lines)
- 6-digit OTP input with auto-advance & paste support
- Resend timer (60s), auto-verify on complete

### `auth/MyBookings.jsx` (123 lines)
- Patient's booking list (by phone from session)
- Cancel with confirmation + email notification

---

## 📊 Dashboard Pages

### `dashboard/Overview.jsx` (110 lines)
- Stats: total/active/cancelled bookings
- Department breakdown with progress bars
- Quick links to bookings, records, billing

### `dashboard/Bookings.jsx` (154 lines)
- All bookings table with search & status filter
- Cancel action with email notification
- Reschedule navigation, permission check

### `dashboard/Analytics.jsx` (172 lines)
- Period filter (all/week/month)
- Stats: total, completed, today, cancelled
- Revenue & unpaid totals, department performance
- Daily trend bar chart (last 7 days)

### `dashboard/Settings.jsx` (331 lines)
- Tabs: Departments / Doctors
- CRUD for departments (name_en, name_ar, max_daily, is_open)
- CRUD for doctors (name, type, department, slots, working_days)
- Admin-only access via `hasPermission('settings:manage')`

### `dashboard/AdminPanel.jsx` (284 lines)
- Tabs: Users / Roles & Permissions
- User table with role editing, delete
- Role permissions editor (toggle per permission)
- Admin-only via `hasPermission('users:manage')`

### `dashboard/AuditLog.jsx` (117 lines)
- Merged activity from bookings + bills
- Filter by type (all/booking/invoice)
- Timeline view with timestamps

### `dashboard/DepartmentDashboard.jsx` (130 lines)
- Department-specific view: today's bookings, staff list
- Stats: today, active, completed, doctors count

### `dashboard/MedicalRecords.jsx` (82 lines)
- All medical records with search
- Uses `MedicalRecordCard` component

---

## 🩺 Doctor Pages

### `doctor/Dashboard.jsx` (152 lines)
- Doctor's today schedule with stats
- Complete booking action, consult navigation

### `doctor/Consultation.jsx` (235 lines)
- Patient info, vitals entry (BP, temp, weight, HR)
- Diagnosis (required), notes, prescription builder
- Creates medical_record + prescriptions, marks booking completed

### `doctor/PatientRecord.jsx` (149 lines)
- View patient's medical records by phone
- Expandable cards with vitals, prescriptions

### `doctor/PatientSearch.jsx` (90 lines)
- Search patients by name or phone
- Shows unique patients from bookings

### `doctor/Schedule.jsx` (137 lines)
- Weekly schedule view with day selector
- Shows working days, bookings per day

---

## 🩺 Nurse Pages

### `nurse/PatientQueue.jsx` (99 lines)
- Today's patient queue with stats
- Filter by status (active/completed/cancelled)

### `nurse/Triage.jsx` (144 lines)
- Split view: queue list + vitals form
- Records BP, temp, weight, HR, height, O₂ sat
- Saves vitals as booking notes

---

## 🏥 Receptionist Pages

### `receptionist/CheckInOut.jsx` (114 lines)
- Today's active bookings queue
- Mark as completed or no-show

### `receptionist/PatientDirectory.jsx` (100 lines)
- Unique patients from all bookings
- Search by name/phone, view history

### `receptionist/WalkInBooking.jsx` (206 lines)
- 3-step wizard: Patient Info → Doctor → Date/Slot
- Creates booking with generated ref

---

## 👤 Patient Pages

### `patient/Home.jsx` (150 lines)
- Department grid with search & filter (all/open/full)
- Shows next appointment card, remaining slots

### `patient/BookingType.jsx` (127 lines)
- Choose Consultant or Doctor for selected department
- Shows counts, disabled if none available

### `patient/DoctorSelect.jsx` (163 lines)
- Doctor list with search & "Available Today" filter
- Skeleton loading, animated cards

### `patient/SlotSelect.jsx` (161 lines)
- Date picker + slot grid
- Shows working days, booked slots

### `patient/PatientForm.jsx` (207 lines)
- Patient details form + booking summary
- Creates booking, sends confirmation email
- Generates queue number

### `patient/Confirmation.jsx` (126 lines)
- Success page with queue number, booking details
- Pay Now (Paymob), view bookings, cancel options

### `patient/Profile.jsx` (97 lines)
- Edit full_name, phone (email disabled)
- Upserts to profiles table

### `patient/MedicalHistory.jsx` (95 lines)
- Patient's own medical records
- Shows diagnosis, vitals, prescriptions

### `patient/Payments.jsx` (85 lines)
- Patient's invoices: paid/unpaid totals
- Invoice list with status badges

### `patient/Reschedule.jsx` (280 lines)
- 14-day date picker (respects working days)
- Slot selection, confirm reschedule
- Sends reschedule email notification

### `patient/Cancel.jsx` (218 lines)
- 3-step: Search (ref+phone) → Confirm → Done
- Validates booking exists, not already cancelled

---

## 💰 Billing Pages

### `billing/InvoiceList.jsx` (121 lines)
- All invoices with search & status filter
- Revenue/unpaid stats, InvoiceCard component

### `billing/CreateInvoice.jsx` (235 lines)
- Patient info + bill items (presets + custom)
- Tax rate editor, subtotal/tax/total calculation
- Links to booking if provided

### `billing/InvoiceDetail.jsx` (243 lines)
- Full invoice view with items table
- Mark paid (cash/card), Paymob online payment
- Print support

---

## 🤖 Triage Pages

### `Triage/index.jsx` (80 lines)
- Chat interface with Salama AI assistant
- Message list, input with send button
- Shows recommendation card when available

### `Triage/TriageHeader.jsx` (11 lines)
- Navbar with "سلامة · Salama" title

### `Triage/ChatBubble.jsx` (23 lines)
- User (blue) / Assistant (gray) message bubbles

### `Triage/RecommendCard.jsx` (34 lines)
- Severity-based styling (low/medium/high/emergency)
- Shows recommended department + advice

### `Triage/useSalama.js` (117 lines)
- Hook: messages, loading, recommendation state
- Calls Supabase Edge Function `Triage-Chat`
- Parses `<RECOMMENDATION>` JSON from response
- Bilingual Arabic/English AI triage

---

**Total: 43 page files across 8 modules**

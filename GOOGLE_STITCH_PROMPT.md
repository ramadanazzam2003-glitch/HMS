# Google Stitch Prompt — MediBook Hospital Management System

## Project Overview
Build a **complete, production-ready React frontend** for "MediBook" — a hospital appointment booking system. The app is a **Single Page Application (SPA)** using **React 19 + Vite + Tailwind CSS**. The backend is **Supabase** (Auth + PostgreSQL + RLS). There is NO separate backend server.

---

## Tech Stack
- **React 19** (JSX, functional components, hooks)
- **Vite** as build tool
- **Tailwind CSS 3** for styling
- **React Router DOM v7** for routing
- **Lucide React** for icons
- **Supabase JS Client** (@supabase/supabase-js) for all data operations
- **Google Fonts**: Sora (headings) + DM Sans (body)

---

## Design System (MUST follow exactly)

### Colors
```
Primary:        #2563EB (blue-600)
Primary Dark:   #1D4ED8
Primary Light:  #EFF6FF
Secondary:      #14B8A6 (teal)
Success:        #10B981
Warning:        #F59E0B
Danger:         #EF4444
Background:     #F8FAFC
Surface:        #FFFFFF
Text Primary:   #0F172A
Text Secondary: #475569
Text Muted:     #94A3B8
Border:         #E2E8F0
```

### Dark Mode (Dashboard only)
```
Background:     #0D1117
Surface:        #161B22
Text Primary:   #F0F6FC
Text Secondary: #8B949E
Border:         #30363D
```

### Typography
- Headings: `font-family: 'Sora', sans-serif; font-weight: 700-800`
- Body: `font-family: 'DM Sans', sans-serif; font-weight: 400-600`

### Border Radius
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Inputs: `rounded-lg` (10px)
- Badges: `rounded-full`

### Shadows
- Cards: `shadow-sm` (subtle)
- Hover: `shadow-lg` + `translateY(-2px)`
- Primary buttons: `shadow-md shadow-blue-200`

---

## Pages to Build (17 pages)

### A. Authentication Pages (Light theme)

#### 1. Patient Registration (`/register`)
- Centered card layout on gray-50 background
- Hospital emoji icon at top
- Fields: Full Name, Email, Password, Confirm Password
- "Create Account" blue button
- "Already have an account? Login" link
- Error display (red alert box)
- Loading state on button

#### 2. Patient Login (`/login`)
- Same layout as register
- Fields: Email, Password
- "Login" blue button
- "Don't have an account? Register" link
- Support for `state.verified` and `state.registered` success messages
- Error display

#### 3. Email Verification (`/verify-email`)
- 6-digit OTP input (individual digit boxes)
- Auto-focus next input on digit entry
- "Verify Email" button
- "Resend Code" link with cooldown timer
- Back to login link

#### 4. Staff Login (`/dashboard/login`)
- **Dark theme** (gray-900 background)
- Hospital icon + "Hospital Dashboard" title
- Fields: Email, Password
- "Sign In →" button
- "Staff members only" footer text

### B. Patient Portal Pages (Light theme)

#### 5. Patient Home (`/`)
- **Sticky navbar** with: Logo + "MediBook" brand, user avatar (initials), "My Bookings" link, logout button
- **Hero Section**: Full-width gradient background image (hospital photo), overlay text "Book Your Appointment", subtitle, 3 stat pills (Departments count, Available Now, 15m Slot Duration), wave SVG bottom border
- **Next Appointment Card** (if exists): Shows upcoming booking with doctor name, department, date, time, queue number
- **Department Section**: 
  - Section header "Select Department" with open count badge
  - Search input with magnifier icon
  - Filter buttons: All / Open / Full
  - "Showing X of Y departments" text
  - **Department Grid**: 3-column responsive grid of cards
- **Cancel Banner** at bottom

#### 6. Department Card Component
- Full-width card with background image (Unsplash medical photos mapped by department name)
- Gradient overlay (blue-900 at bottom)
- Status badge (Open green / Full red) top-right
- Department name (English + Arabic)
- Slots remaining + percentage progress bar
- Hover: scale image, elevate shadow
- Click: navigate to booking flow (unless full)

#### 7. Booking Type Selection (`/booking-type/:departmentId`)
- Step indicator (5 steps: Type → Doctor → Slot → Details → Confirm)
- Department info card at top
- Two selectable cards: "Consultant" vs "Doctor"
- Back button

#### 8. Doctor Selection (`/doctor-select/:departmentId`)
- Step indicator
- Search input for doctor name
- Grid of doctor cards
- Each card: Doctor name, type badge, "Select" button
- Back/Next buttons

#### 9. Slot Selection (`/slot-select/:doctorId`)
- Step indicator
- Calendar date picker (next 7 days)
- Time slot grid (morning/afternoon sections)
- Booked slots shown as disabled
- Selected slot highlighted
- Back/Next buttons

#### 10. Patient Form (`/patient-form`)
- Step indicator
- Form fields: Patient Name, Phone, Age
- Booking summary sidebar
- "Confirm Booking" button
- Back button

#### 11. Confirmation (`/confirmation`)
- Success animation/icon
- Booking reference number (BK-XXXXXX)
- Booking details card (doctor, department, date, time, queue number)
- "Back to Home" button
- "View My Bookings" button

#### 12. My Bookings (`/my-bookings`)
- List of patient's bookings
- Each card: booking ref, doctor, department, date, time, status badge
- Cancel button for active bookings
- Empty state if no bookings

#### 13. Cancel Booking (`/cancel`)
- Search form: Booking Reference + Phone Number
- "Search" button
- If found: booking details card + "Cancel Booking" button
- Confirmation modal before cancel
- Success message after cancellation

### C. Staff Dashboard Pages (Dark theme for login, Light for dashboard)

#### 14. Dashboard Overview (`/dashboard`)
- **Navbar**: Logo + "Hospital Dashboard", role badge, nav buttons (Bookings, Settings, Admin Panel), logout
- **Stats Grid**: 3 cards (Total Bookings, Active green card, Cancelled red card)
- **Bookings by Department**: Bar chart with progress bars
- **Quick Actions**: "View All Bookings" + "Patient Portal" buttons

#### 15. Bookings Management (`/dashboard/bookings`)
- **Navbar** same as overview
- **Filters**: Status dropdown, date range, search
- **Table**: Booking Ref, Patient Name, Phone, Doctor, Department, Date, Time, Queue#, Status badge, Actions (Cancel)
- **Pagination**
- Cancel confirmation modal

#### 16. Settings (`/dashboard/settings`)
- **Navbar** same as overview
- Two tabs: "Departments" and "Doctors"
- **Departments Tab**:
  - Add Department form/modal
  - Departments table: Name (EN/AR), Max Daily, Open/Closed toggle, Actions (Edit, Delete)
- **Doctors Tab**:
  - Add Doctor form/modal
  - Doctors table: Name, Type, Department, Active toggle, Actions (Edit, Delete)
  - Working days checkboxes
  - Time slots management

#### 17. Admin Panel (`/dashboard/admin`)
- **Navbar** same as overview
- **Users Table**: Full Name, Email, Role badge, Created At, Actions (Change Role, Delete)
- **Role Management**: Roles list with permissions checkboxes
- **Change Role Modal**: Dropdown to select new role
- **Delete Confirmation Modal**

### D. AI Triage Pages

#### 18. Triage Chat (`/triage`)
- **Chat Interface**: Message bubbles (user right, AI left)
- **Input Area**: Text input + Send button
- **Recommendation Card** (after AI response): Severity badge, recommended department, disclaimer
- **Loading indicator** while AI responds
- Back to home button

---

## Components to Build

### Layout Components
1. **PatientNavbar** — Sticky top, logo, nav links, user menu, logout
2. **DashboardNavbar** — Sticky top, dark/light, role badge, nav buttons, logout
3. **StepIndicator** — 5-step booking progress (horizontal, responsive)

### Card Components
4. **DepartmentCard** — Image background, gradient overlay, status badge, progress bar
5. **DoctorCard** — Doctor info, type badge, select button
6. **BookingCard** — Booking details, status badge, actions
7. **StatCard** — Number + label + optional icon
8. **NextAppointmentCard** — Upcoming appointment info
9. **CancelBanner** — CTA to cancel booking

### Form Components
10. **InputField** — Label + input + error message
11. **SelectField** — Label + select dropdown
12. **SearchInput** — Magnifier icon + input
13. **OTPInput** — 6-digit verification code input

### Feedback Components
14. **Alert** — Success/Error/Warning/Info variants
15. **Badge** — Status badges (active, cancelled, completed)
16. **Modal** — Confirmation dialog with title, message, actions
17. **Toast** — Temporary notification popup
18. **Skeleton** — Loading placeholder (text, circle, card)
19. **Spinner** — Loading indicator

### Utility Components
20. **EmptyState** — Icon + title + description + action button
21. **RoleGuard** — Route protection based on role
22. **PatientRoute** — Auth check for patient pages
23. **ProtectedRoute** — Auth + staff role check

---

## Supabase Integration (Connect all pages to these operations)

### Auth Operations
```javascript
// Registration
supabase.auth.signUp({ email, password, options: { data: { full_name } } })

// Login
supabase.auth.signInWithPassword({ email, password })

// Logout
supabase.auth.signOut()

// Get Session
supabase.auth.getSession()

// Verify OTP
supabase.auth.verifyOtp({ email, token, type: 'signup' })

// Resend OTP
supabase.auth.resend({ type: 'signup', email })

// Auth State Listener
supabase.auth.onAuthStateChange(callback)
```

### Database Operations
```javascript
// Departments
supabase.from('departments').select('*')
supabase.from('departments').insert(deptData)
supabase.from('departments').update(deptData).eq('id', id)
supabase.from('departments').delete().eq('id', id)

// Doctors
supabase.from('doctors').select('*, departments(name_en)')
supabase.from('doctors').insert(docData)
supabase.from('doctors').update(docData).eq('id', id)
supabase.from('doctors').delete().eq('id', id)

// Bookings
supabase.from('bookings').select('*, doctors(name), departments(name_en)')
supabase.from('bookings').insert(bookingData)
supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)

// Profiles
supabase.from('profiles').select('*, roles(name)').eq('user_id', userId).single()

// Roles
supabase.from('roles').select('*')
supabase.from('role_permissions').select('permissions(name)').eq('role_id', roleId)
```

---

## Routing Structure
```
/                           → Patient Home (PatientRoute)
/register                   → Patient Registration
/login                      → Patient Login
/verify-email               → Email Verification
/my-bookings                → My Bookings (PatientRoute)
/cancel                     → Cancel Booking
/booking-type/:departmentId → Booking Type (PatientRoute)
/doctor-select/:departmentId→ Doctor Select (PatientRoute)
/slot-select/:doctorId      → Slot Select (PatientRoute)
/patient-form               → Patient Form (PatientRoute)
/confirmation               → Booking Confirmation (PatientRoute)
/triage                     → AI Triage (PatientRoute)
/dashboard/login            → Staff Login
/dashboard                  → Dashboard Overview (ProtectedRoute)
/dashboard/bookings         → Bookings Management (ProtectedRoute)
/dashboard/settings         → Settings (ProtectedRoute)
/dashboard/admin            → Admin Panel (ProtectedRoute)
```

---

## UI/UX Requirements

1. **Responsive Design**: Mobile-first, works on all screen sizes
2. **Smooth Transitions**: Fade-in, slide-up animations on page load
3. **Loading States**: Skeleton loaders for cards, spinners for buttons
4. **Error Handling**: Red alert boxes with clear messages
5. **Empty States**: Friendly illustrations when no data
6. **Hover Effects**: Cards elevate on hover, buttons scale slightly
7. **Sticky Navigation**: Navbar stays on top while scrolling
8. **Dark Theme**: Dashboard login + dashboard pages use dark mode
9. **Arabic Support**: RTL-ready for Arabic department names
10. **Accessibility**: Proper labels, focus states, keyboard navigation

---

## Image Mapping (for Department Cards)
```javascript
const DEPT_IMAGES = {
  'internal medicine': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=82',
  'pediatrics': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=82',
  'ophthalmology': 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80',
  'cardiology': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&q=82',
  'dermatology': 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=800&q=82',
  'dentistry': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&q=80',
  'obstetrics': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=82',
  'orthopedics': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=82',
  'neurology': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&q=80',
  'psychiatry': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  'surgery': 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&q=80',
  'urology': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80',
}
```

---

## IMPORTANT NOTES
1. **No separate backend** — all data comes from Supabase directly via JS client
2. **RLS is enabled** — Row Level Security policies enforce access control at database level
3. **RBAC system** — 8 roles (patient, doctor, nurse, receptionist, dept_manager, admin, director, manager) with 22 permissions
4. **Booking flow is 5 steps**: Type → Doctor → Slot → Form → Confirmation
5. **Staff dashboard** checks role on login — non-staff users are signed out
6. **AI Triage** uses OpenRouter API via Vite proxy (`/api/openrouter/chat/completions`)
7. All components should use **Tailwind CSS classes** primarily, with CSS variables from theme.css for brand colors
8. Use **Lucide React** icons (e.g., `import { Search, Calendar, User } from 'lucide-react'`)

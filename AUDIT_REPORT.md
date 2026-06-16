# Hospital Management System - Audit Report

**Date:** 2026-06-12  
**Stack:** React 19 + Tailwind + Supabase + Vite  
**Files Reviewed:** 30 source files + 6 SQL migrations

---

## Critical Issues (2)

### 1. OpenRouter API Key Exposed in Client Bundle
- **File:** `.env:3` → `src/pages/Triage/useSalama.js:48`
- **Problem:** `VITE_OPENROUTER_API_KEY` is baked into client JS. Anyone can steal it from DevTools.
- **Fix:** Proxy through a Supabase Edge Function. Never expose 3rd-party keys to the browser.

### 2. RLS Policy Mismatch on Bookings
- **File:** `supabase/migrations/006_rls_policies.sql:33` + `src/pages/patient/PatientForm.jsx:59-70`
- **Problem:** RLS requires `auth.uid() = user_id` but `PatientForm` never sets `user_id` on insert. `MyBookings.jsx` queries by `phone` instead of user ID, leaking other patients' data.
- **Fix:** Add `user_id` to booking inserts, or redesign anonymous flow with server-side API.

---

## High Issues (8)

### 3. No Auth on Cancel Page
- **File:** `src/pages/patient/Cancel.jsx`
- **Problem:** `/cancel` route has no `<PatientRoute>` wrapper. Anyone can cancel bookings with just ref + phone.
- **Fix:** Add auth or rate-limiting + CAPTCHA.

### 4. No Route-Level Code Splitting
- **File:** `src/App.jsx:4-23`
- **Problem:** All 15 pages eagerly imported. Entire app bundle loads on first visit.
- **Fix:** `React.lazy()` + `<Suspense>` for every page.

### 5. `filteredDepts` Not Memoized
- **File:** `src/pages/patient/Home.jsx:175-185`
- **Problem:** Recalculates on every render of 931-line component. Causes unnecessary re-renders.
- **Fix:** Wrap in `useMemo`.

### 6. Waterfall API Calls in Home
- **File:** `src/pages/patient/Home.jsx:58-87`
- **Problem:** 3 sequential Supabase calls where steps 2-3 are independent.
- **Fix:** `Promise.all` for independent queries.

### 7. Waterfall in Next Appointment Fetch
- **File:** `src/pages/patient/Home.jsx:90-122`
- **Problem:** 3 sequential calls. Could use Supabase join + AuthContext session.
- **Fix:** Single query: `.select('*, doctors(name), departments(name_en, name_ar)')`.

### 8. Missing Database Indexes
- **File:** `supabase/migrations/` (no index definitions)
- **Problem:** No indexes on `bookings(doctor_id, booking_date)`, `bookings(status)`, `bookings(booking_ref)`, `bookings(phone)`, `doctors(department_id)`.
- **Fix:** Add composite indexes.

### 9. N+1 Query in Home (Next Appointment)
- **File:** `src/pages/patient/Home.jsx:96-118`
- **Problem:** Fetches booking, then fetches department separately. Supabase supports joins.
- **Fix:** Use `.select('*, doctors(name), departments(name_en, name_ar)')`.

### 10. State Lost on Refresh (SlotSelect)
- **File:** `src/pages/patient/SlotSelect.jsx:17-22`
- **Problem:** Doctor data from `useLocation().state` vanishes on page refresh. User stuck on error screen.
- **Fix:** Fetch doctor by `doctorId` param from Supabase, or persist to sessionStorage.

---

## Medium Issues (14)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 11 | `src/providers/AuthContext.jsx` | Duplicate of `contexts/AuthContext.jsx` | Delete file |
| 12 | `PatientForm.jsx:31-37` | No HTML sanitization on `patient_name` | Strip tags before insert |
| 13 | `utils/booking.js:25-27` | `generateBookingRef` is sequential/predictable | Use UUID or random suffix |
| 14 | `Home.jsx` (931 lines) | Monolith: 9 useState, 5 useEffect, inline CSS | Extract components |
| 15 | `DoctorSelect.jsx:158-161` | `isAvailableToday` recreated every render | `useCallback` |
| 16 | `DoctorSelect.jsx:22-118` | `DoctorCard` not memoized | `React.memo` |
| 17 | `Home.jsx:219-515` | ~300 lines CSS in `<style>` JSX tag | Move to CSS file |
| 18 | `Settings.jsx:207-231` | `fetchAll` defined twice | Remove duplicate |
| 19 | `BookingType.jsx:113-135` | Sequential dept + doctor query | `Promise.all` |
| 20 | `Overview.jsx:20-47` | Fetches ALL bookings, client-side aggregation | SQL aggregation RPC |
| 21 | `Bookings.jsx:28-42` | No pagination on bookings list | `.range()` + Load More |
| 22 | `Triage/useSalama.js:37-101` | Async IIFE inside `setState` (memory leak risk) | `AbortController` + ref |
| 23 | `Home.jsx:169-172` | `handleLogout` bypasses AuthContext | Use `signOut` from context |
| 24 | `MyBookings.jsx:23-27` | Queries by `phone` not `user_id` | Store user_id on bookings |

---

## Low Issues (4)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 25 | All components | No `<ErrorBoundary>` anywhere | Add boundary around `<Routes>` |
| 26 | `Navbar.jsx:24-28` | `handleBack` duplicates logic | Simplify to `navigate(back)` |
| 27 | `Home.jsx:6-20,233` | All images load eagerly (no lazy) | Use `<img loading="lazy">` |
| 28 | `Home.jsx:219-515` | Inline CSS prevents caching | Move to external CSS |

---

## Top 5 Priorities

1. **Move OpenRouter key to Edge Function** (security)
2. **Fix RLS + add user_id to bookings** (security)
3. **Add `React.lazy()` for code splitting** (performance)
4. **Add database indexes** (performance)
5. **Add ErrorBoundary** (reliability)

---

*Audit performed by reviewing all 30 source files and 6 SQL migration files.*

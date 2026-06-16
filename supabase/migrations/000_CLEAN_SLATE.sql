-- =============================================
-- CLEAN SLATE: Drop only RBAC tables
-- Departments, doctors, bookings stay untouched
-- =============================================

-- 1. Drop triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- 2. Drop functions if they exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_role_id() CASCADE;
DROP FUNCTION IF EXISTS has_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_staff() CASCADE;

-- 3. Drop RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 4. Drop RLS policies on departments
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can insert departments" ON departments;
DROP POLICY IF EXISTS "Admins can update departments" ON departments;
DROP POLICY IF EXISTS "Admins can delete departments" ON departments;

-- 5. Drop RLS policies on doctors
DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;
DROP POLICY IF EXISTS "Staff can view all doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON doctors;

-- 6. Drop RLS policies on bookings
DROP POLICY IF EXISTS "Patients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Patients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Patients can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "Doctors can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can create bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can update bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- 7. Disable RLS on profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 8. Drop profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- 9. Drop old RBAC tables
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- DONE! Departments, doctors, bookings are untouched.
-- Now run in order:
-- 1. 001_setup_rbac.sql
-- 2. 002_create_profiles.sql
-- 3. 003_rls_policies.sql

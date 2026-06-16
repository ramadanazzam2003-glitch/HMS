-- =============================================
-- 006: Enable RLS on all tables + policies
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Enable RLS on all tables
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "patient_own_bookings" ON bookings;
DROP POLICY IF EXISTS "staff_all_bookings" ON bookings;
DROP POLICY IF EXISTS "patient_insert_own" ON bookings;
DROP POLICY IF EXISTS "public_read_departments" ON departments;
DROP POLICY IF EXISTS "public_read_active_doctors" ON doctors;
DROP POLICY IF EXISTS "own_profile" ON profiles;
DROP POLICY IF EXISTS "staff_all_profiles" ON profiles;

-- 3. Bookings policies
CREATE POLICY "patient_own_bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "staff_all_bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role_id != 1
    )
  );

CREATE POLICY "patient_insert_own" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Departments: everyone can read
CREATE POLICY "public_read_departments" ON departments
  FOR SELECT USING (true);

-- 5. Doctors: everyone can read active doctors
CREATE POLICY "public_read_active_doctors" ON doctors
  FOR SELECT USING (is_active = true);

-- 6. Profiles: users see own, staff see all
CREATE POLICY "own_profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "staff_all_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role_id IN (5, 6, 7, 8)
    )
  );

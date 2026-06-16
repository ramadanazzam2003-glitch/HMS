-- =============================================
-- 003: RLS Policies for all tables
-- Run AFTER 002_create_profiles.sql
-- =============================================

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (get_user_role() = 'admin');

-- =============================================
-- DEPARTMENTS
-- =============================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
ON departments FOR SELECT
USING (true);

CREATE POLICY "Admins can insert departments"
ON departments FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update departments"
ON departments FOR UPDATE
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete departments"
ON departments FOR DELETE
USING (get_user_role() = 'admin');

-- =============================================
-- DOCTORS
-- =============================================
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active doctors"
ON doctors FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can view all doctors"
ON doctors FOR SELECT
USING (is_staff());

CREATE POLICY "Admins can insert doctors"
ON doctors FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update doctors"
ON doctors FOR UPDATE
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete doctors"
ON doctors FOR DELETE
USING (get_user_role() = 'admin');

-- =============================================
-- BOOKINGS
-- =============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Patients can view their own bookings
CREATE POLICY "Patients can view own bookings"
ON bookings FOR SELECT
USING (
  get_user_role() = 'patient'
  AND phone = (SELECT raw_user_meta_data ->> 'phone' FROM auth.users WHERE id = auth.uid())
);

-- Patients can create bookings
CREATE POLICY "Patients can create bookings"
ON bookings FOR INSERT
WITH CHECK (get_user_role() = 'patient');

-- Patients can cancel their own bookings
CREATE POLICY "Patients can cancel own bookings"
ON bookings FOR UPDATE
USING (
  get_user_role() = 'patient'
  AND phone = (SELECT raw_user_meta_data ->> 'phone' FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (get_user_role() = 'patient');

-- Doctors can view bookings assigned to them
CREATE POLICY "Doctors can view own bookings"
ON bookings FOR SELECT
USING (
  get_user_role() = 'doctor'
  AND doctor_id IN (
    SELECT id FROM doctors WHERE name = (
      SELECT full_name FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Staff can view all bookings
CREATE POLICY "Staff can view all bookings"
ON bookings FOR SELECT
USING (get_user_role() IN ('admin', 'receptionist', 'nurse'));

-- Staff can create bookings
CREATE POLICY "Staff can create bookings"
ON bookings FOR INSERT
WITH CHECK (get_user_role() IN ('admin', 'receptionist', 'nurse'));

-- Staff can update bookings
CREATE POLICY "Staff can update bookings"
ON bookings FOR UPDATE
USING (get_user_role() IN ('admin', 'receptionist', 'nurse'))
WITH CHECK (get_user_role() IN ('admin', 'receptionist', 'nurse'));

-- Admins can delete bookings
CREATE POLICY "Admins can delete bookings"
ON bookings FOR DELETE
USING (get_user_role() = 'admin');

-- ============================================
-- MIGRATION 005: RLS POLICIES WITH BRAC
-- Enables RLS and creates policies for all tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's role level
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS INT AS $$
  SELECT COALESCE(r.level, 0)
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get user's department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS INT AS $$
  SELECT department_id
  FROM profiles
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(perm_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN role_permissions rp ON p.role_id = rp.role_id
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE p.user_id = auth.uid()
      AND perm.name = perm_name
      AND (rp.valid_until IS NULL OR rp.valid_until > NOW())
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROLES POLICIES
-- ============================================

-- Everyone can read roles (needed for UI)
CREATE POLICY "Public read roles" ON roles
  FOR SELECT USING (true);

-- Only manager can modify roles
CREATE POLICY "Manager modify roles" ON roles
  FOR ALL USING (get_user_role_level() >= 7);

-- ============================================
-- PERMISSIONS POLICIES
-- ============================================

-- Everyone can read permissions (needed for UI)
CREATE POLICY "Public read permissions" ON permissions
  FOR SELECT USING (true);

-- Only manager can modify permissions
CREATE POLICY "Manager modify permissions" ON permissions
  FOR ALL USING (get_user_role_level() >= 7);

-- ============================================
-- ROLE_PERMISSIONS POLICIES
-- ============================================

-- Everyone can read role_permissions
CREATE POLICY "Public read role_permissions" ON role_permissions
  FOR SELECT USING (true);

-- Only manager can modify role_permissions
CREATE POLICY "Manager modify role_permissions" ON role_permissions
  FOR ALL USING (get_user_role_level() >= 7);

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read own profile
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- Staff (level >= 2) can read all profiles
CREATE POLICY "Staff read all profiles" ON profiles
  FOR SELECT USING (get_user_role_level() >= 2);

-- Users can update own profile (limited fields)
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Admins (level >= 5) can manage all profiles
CREATE POLICY "Admins manage profiles" ON profiles
  FOR ALL USING (get_user_role_level() >= 5);

-- ============================================
-- DEPARTMENTS POLICIES
-- ============================================

-- Everyone can read departments
CREATE POLICY "Public read departments" ON departments
  FOR SELECT USING (true);

-- Only admins can modify departments
CREATE POLICY "Admins manage departments" ON departments
  FOR ALL USING (get_user_role_level() >= 5);

-- ============================================
-- DOCTORS POLICIES
-- ============================================

-- Everyone can read active doctors
CREATE POLICY "Public read active doctors" ON doctors
  FOR SELECT USING (is_active = true);

-- Staff can read all doctors
CREATE POLICY "Staff read all doctors" ON doctors
  FOR SELECT USING (get_user_role_level() >= 2);

-- Dept managers can manage their department's doctors
CREATE POLICY "Dept managers manage own doctors" ON doctors
  FOR ALL USING (
    get_user_role_level() >= 4 AND
    department_id = get_user_department()
  );

-- Admins can manage all doctors
CREATE POLICY "Admins manage all doctors" ON doctors
  FOR ALL USING (get_user_role_level() >= 5);

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Patients can read own bookings
CREATE POLICY "Patients read own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Staff can read all bookings
CREATE POLICY "Staff read all bookings" ON bookings
  FOR SELECT USING (get_user_role_level() >= 2);

-- Patients can create own bookings
CREATE POLICY "Patients create own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can create bookings for anyone
CREATE POLICY "Staff create bookings" ON bookings
  FOR INSERT WITH CHECK (get_user_role_level() >= 2);

-- Patients can cancel own bookings
CREATE POLICY "Patients cancel own bookings" ON bookings
  FOR UPDATE USING (
    user_id = auth.uid() AND
    status = 'active'
  );

-- Staff can update all bookings
CREATE POLICY "Staff update all bookings" ON bookings
  FOR UPDATE USING (get_user_role_level() >= 2);

-- Only admins can delete bookings
CREATE POLICY "Admins delete bookings" ON bookings
  FOR DELETE USING (get_user_role_level() >= 5);

-- ============================================
-- TRIAGE SESSIONS POLICIES
-- ============================================

-- Users can read own triage sessions
CREATE POLICY "Users read own triage" ON triage_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Users can create own triage sessions
CREATE POLICY "Users create own triage" ON triage_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Staff can read all triage sessions
CREATE POLICY "Staff read all triage" ON triage_sessions
  FOR SELECT USING (get_user_role_level() >= 2);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only admins can read audit logs
CREATE POLICY "Admins read audit logs" ON audit_logs
  FOR SELECT USING (get_user_role_level() >= 5);

-- System inserts audit logs (via function)
CREATE POLICY "System insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- USER_ROLE_HISTORY POLICIES
-- ============================================

-- Admins can read role history
CREATE POLICY "Admins read role history" ON user_role_history
  FOR SELECT USING (get_user_role_level() >= 5);

-- Admins can insert role history
CREATE POLICY "Admins insert role history" ON user_role_history
  FOR INSERT WITH CHECK (get_user_role_level() >= 5);

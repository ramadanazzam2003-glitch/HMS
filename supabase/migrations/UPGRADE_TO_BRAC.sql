-- ============================================
-- UPGRADE EXISTING SCHEMA TO BRAC
-- Run these in order in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: ALTER ROLES TABLE
-- ============================================
ALTER TABLE roles ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS level INT DEFAULT 0;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- STEP 2: ALTER PERMISSIONS TABLE
-- ============================================
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'own' CHECK (scope IN ('own', 'department', 'global'));
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing permissions to have action field
UPDATE permissions SET action = 'view' WHERE name LIKE '%:view%';
UPDATE permissions SET action = 'manage' WHERE name LIKE '%:manage%';
UPDATE permissions SET action = 'create' WHERE name LIKE '%:create%';
UPDATE permissions SET action = 'update' WHERE name LIKE '%:update%';
UPDATE permissions SET action = 'delete' WHERE name LIKE '%:delete%';
UPDATE permissions SET action = 'export' WHERE name LIKE '%:export%';
UPDATE permissions SET action = 'assign' WHERE name LIKE '%:assign%';

-- Update scope based on permission name
UPDATE permissions SET scope = 'own' WHERE name LIKE '%:own%';
UPDATE permissions SET scope = 'global' WHERE name LIKE '%:all%' OR name LIKE '%:manage%' OR name LIKE '%:export%' OR name LIKE '%:assign%';

-- ============================================
-- STEP 3: ALTER ROLE_PERMISSIONS TABLE
-- ============================================
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS granted_by INT REFERENCES roles(id);

-- ============================================
-- STEP 4: ALTER PROFILES TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id INT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- STEP 5: ALTER BOOKINGS TABLE
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- STEP 6: CREATE NEW TABLES
-- ============================================

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  model TEXT NOT NULL,
  model_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Conflicts (Separation of Duties)
CREATE TABLE IF NOT EXISTS role_conflicts (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  conflicting_role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, conflicting_role_id)
);

-- User Role History (Audit Trail)
CREATE TABLE IF NOT EXISTS user_role_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role_id INT REFERENCES roles(id),
  new_role_id INT REFERENCES roles(id),
  assigned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: UPDATE ROLES WITH HIERARCHY
-- ============================================
UPDATE roles SET level = 0, parent_id = NULL WHERE name = 'patient';
UPDATE roles SET level = 1, parent_id = NULL WHERE name = 'doctor';
UPDATE roles SET level = 2, parent_id = NULL WHERE name = 'nurse';
UPDATE roles SET level = 3, parent_id = NULL WHERE name = 'receptionist';
UPDATE roles SET level = 4, parent_id = NULL WHERE name = 'dept_manager';
UPDATE roles SET level = 5, parent_id = (SELECT id FROM roles WHERE name = 'admin') WHERE name = 'director';
UPDATE roles SET level = 6, parent_id = NULL WHERE name = 'admin';
UPDATE roles SET level = 7, parent_id = NULL WHERE name = 'manager';

-- ============================================
-- STEP 8: CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_roles_parent_id ON roles(parent_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor_id ON bookings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_department_id ON bookings(department_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_model ON audit_logs(model);

-- ============================================
-- STEP 9: ENABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 10: CREATE HELPER FUNCTIONS
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

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := to_char(NOW(), 'YYYYMMDD');
  random_part := upper(substring(md5(random()::text) from 1 for 4));
  ref := 'MB-' || date_part || '-' || random_part;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 11: CREATE RLS POLICIES
-- ============================================

-- ROLES: Everyone can read
DROP POLICY IF EXISTS "Public read roles" ON roles;
CREATE POLICY "Public read roles" ON roles
  FOR SELECT USING (true);

-- ROLES: Manager can modify
DROP POLICY IF EXISTS "Manager modify roles" ON roles;
CREATE POLICY "Manager modify roles" ON roles
  FOR ALL USING (get_user_role_level() >= 7);

-- PERMISSIONS: Everyone can read
DROP POLICY IF EXISTS "Public read permissions" ON permissions;
CREATE POLICY "Public read permissions" ON permissions
  FOR SELECT USING (true);

-- PERMISSIONS: Manager can modify
DROP POLICY IF EXISTS "Manager modify permissions" ON permissions;
CREATE POLICY "Manager modify permissions" ON permissions
  FOR ALL USING (get_user_role_level() >= 7);

-- ROLE_PERMISSIONS: Everyone can read
DROP POLICY IF EXISTS "Public read role_permissions" ON role_permissions;
CREATE POLICY "Public read role_permissions" ON role_permissions
  FOR SELECT USING (true);

-- ROLE_PERMISSIONS: Manager can modify
DROP POLICY IF EXISTS "Manager modify role_permissions" ON role_permissions;
CREATE POLICY "Manager modify role_permissions" ON role_permissions
  FOR ALL USING (get_user_role_level() >= 7);

-- PROFILES: Users can read own
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- PROFILES: Staff can read all
DROP POLICY IF EXISTS "Staff read all profiles" ON profiles;
CREATE POLICY "Staff read all profiles" ON profiles
  FOR SELECT USING (get_user_role_level() >= 2);

-- PROFILES: Users can update own
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- PROFILES: Admins can manage all
DROP POLICY IF EXISTS "Admins manage profiles" ON profiles;
CREATE POLICY "Admins manage profiles" ON profiles
  FOR ALL USING (get_user_role_level() >= 5);

-- DEPARTMENTS: Everyone can read
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments
  FOR SELECT USING (true);

-- DEPARTMENTS: Admins can manage
DROP POLICY IF EXISTS "Admins manage departments" ON departments;
CREATE POLICY "Admins manage departments" ON departments
  FOR ALL USING (get_user_role_level() >= 5);

-- DOCTORS: Everyone can read active
DROP POLICY IF EXISTS "Public read active doctors" ON doctors;
CREATE POLICY "Public read active doctors" ON doctors
  FOR SELECT USING (is_active = true);

-- DOCTORS: Staff can read all
DROP POLICY IF EXISTS "Staff read all doctors" ON doctors;
CREATE POLICY "Staff read all doctors" ON doctors
  FOR SELECT USING (get_user_role_level() >= 2);

-- DOCTORS: Admins can manage
DROP POLICY IF EXISTS "Admins manage all doctors" ON doctors;
CREATE POLICY "Admins manage all doctors" ON doctors
  FOR ALL USING (get_user_role_level() >= 5);

-- BOOKINGS: Patients can read own
DROP POLICY IF EXISTS "Patients read own bookings" ON bookings;
CREATE POLICY "Patients read own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- BOOKINGS: Staff can read all
DROP POLICY IF EXISTS "Staff read all bookings" ON bookings;
CREATE POLICY "Staff read all bookings" ON bookings
  FOR SELECT USING (get_user_role_level() >= 2);

-- BOOKINGS: Patients can create own
DROP POLICY IF EXISTS "Patients create own bookings" ON bookings;
CREATE POLICY "Patients create own bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- BOOKINGS: Staff can create
DROP POLICY IF EXISTS "Staff create bookings" ON bookings;
CREATE POLICY "Staff create bookings" ON bookings
  FOR INSERT WITH CHECK (get_user_role_level() >= 2);

-- BOOKINGS: Staff can update
DROP POLICY IF EXISTS "Staff update all bookings" ON bookings;
CREATE POLICY "Staff update all bookings" ON bookings
  FOR UPDATE USING (get_user_role_level() >= 2);

-- BOOKINGS: Admins can delete
DROP POLICY IF EXISTS "Admins delete bookings" ON bookings;
CREATE POLICY "Admins delete bookings" ON bookings
  FOR DELETE USING (get_user_role_level() >= 5);

-- AUDIT_LOGS: Admins can read
DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
CREATE POLICY "Admins read audit logs" ON audit_logs
  FOR SELECT USING (get_user_role_level() >= 5);

-- AUDIT_LOGS: System can insert
DROP POLICY IF EXISTS "System insert audit logs" ON audit_logs;
CREATE POLICY "System insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- USER_ROLE_HISTORY: Admins can read
DROP POLICY IF EXISTS "Admins read role history" ON user_role_history;
CREATE POLICY "Admins read role history" ON user_role_history
  FOR SELECT USING (get_user_role_level() >= 5);

-- USER_ROLE_HISTORY: Admins can insert
DROP POLICY IF EXISTS "Admins insert role history" ON user_role_history;
CREATE POLICY "Admins insert role history" ON user_role_history
  FOR INSERT WITH CHECK (get_user_role_level() >= 5);

-- ============================================
-- STEP 12: SEED ROLE-PERMISSION MAPPINGS
-- ============================================

-- Clear existing mappings
DELETE FROM role_permissions;

-- Patient
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN (
  'bookings:view_own', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_active', 'triage:view'
);

-- Doctor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN (
  'bookings:view_own', 'departments:view', 'doctors:view_active', 'triage:view'
);

-- Nurse
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all'
);

-- Receptionist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'receptionist' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all'
);

-- Dept Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'dept_manager' AND p.name IN (
  'bookings:view_all', 'bookings:update',
  'departments:view', 'doctors:view_all', 'doctors:manage',
  'reports:view_all', 'dashboard:view'
);

-- Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update', 'bookings:delete',
  'departments:view', 'departments:manage',
  'doctors:view_all', 'doctors:manage',
  'profiles:view_all', 'profiles:manage',
  'settings:manage', 'dashboard:view',
  'users:view_all', 'users:manage',
  'reports:view_all'
);

-- Director
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'director' AND p.name IN (
  'users:view_all', 'users:manage',
  'bookings:view_all', 'bookings:create', 'bookings:update', 'bookings:delete',
  'departments:view', 'departments:manage',
  'doctors:view_all', 'doctors:manage',
  'reports:view_all', 'reports:export',
  'settings:manage',
  'profiles:view_all', 'profiles:manage',
  'dashboard:view'
);

-- Manager (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'manager';

-- ============================================
-- STEP 13: SEED SEPARATION OF DUTIES CONFLICTS
-- ============================================
DELETE FROM role_conflicts;

INSERT INTO role_conflicts (role_id, conflicting_role_id)
SELECT r1.id, r2.id FROM roles r1, roles r2
WHERE (r1.name = 'patient' AND r2.name IN ('admin', 'manager', 'director'))
   OR (r1.name = 'doctor' AND r2.name = 'patient');

-- ============================================
-- DONE! Verify with:
-- SELECT name, level FROM roles ORDER BY level;
-- SELECT r.name, COUNT(rp.permission_id) FROM roles r JOIN role_permissions rp ON r.id = rp.role_id GROUP BY r.name;
-- ============================================

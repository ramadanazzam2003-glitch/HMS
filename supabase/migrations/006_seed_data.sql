-- ============================================
-- MIGRATION 006: SEED DATA
-- Seeds: roles, permissions, role_permissions, role_conflicts
-- Note: Changed super_admin to manager
-- ============================================

-- ============================================
-- SEED ROLES (with hierarchy)
-- ============================================
INSERT INTO roles (name, description, level, parent_id) VALUES
  ('patient', 'Patient user', 0, NULL),
  ('doctor', 'Doctor/Consultant', 1, NULL),
  ('nurse', 'Nurse', 2, NULL),
  ('receptionist', 'Receptionist', 3, NULL),
  ('dept_manager', 'Department Manager', 4, NULL),
  ('admin', 'Administrator', 5, NULL),
  ('director', 'Hospital Director', 6, 5),
  ('manager', 'System Manager', 7, NULL);

-- ============================================
-- SEED PERMISSIONS
-- ============================================
INSERT INTO permissions (name, resource, action, scope) VALUES
  -- Bookings
  ('bookings:view_own', 'bookings', 'view', 'own'),
  ('bookings:view_all', 'bookings', 'view', 'global'),
  ('bookings:create', 'bookings', 'create', 'own'),
  ('bookings:update', 'bookings', 'update', 'own'),
  ('bookings:delete', 'bookings', 'delete', 'global'),
  -- Departments
  ('departments:view', 'departments', 'view', 'global'),
  ('departments:manage', 'departments', 'manage', 'global'),
  -- Doctors
  ('doctors:view_active', 'doctors', 'view', 'global'),
  ('doctors:view_all', 'doctors', 'view', 'global'),
  ('doctors:manage', 'doctors', 'manage', 'global'),
  -- Profiles
  ('profiles:view_own', 'profiles', 'view', 'own'),
  ('profiles:view_all', 'profiles', 'view', 'global'),
  ('profiles:manage', 'profiles', 'manage', 'global'),
  -- Settings
  ('settings:manage', 'settings', 'manage', 'global'),
  -- Triage
  ('triage:view', 'triage', 'view', 'own'),
  -- Users
  ('users:view_all', 'users', 'view', 'global'),
  ('users:manage', 'users', 'manage', 'global'),
  -- Reports
  ('reports:view_all', 'reports', 'view', 'global'),
  ('reports:export', 'reports', 'export', 'global'),
  -- Dashboard
  ('dashboard:view', 'dashboard', 'view', 'global'),
  -- Roles
  ('roles:view', 'roles', 'view', 'global'),
  ('roles:manage', 'roles', 'manage', 'global');

-- ============================================
-- SEED ROLE-PERMISSION MAPPINGS
-- ============================================

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

-- Department Manager
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
-- SEED SEPARATION OF DUTIES CONFLICTS
-- ============================================
INSERT INTO role_conflicts (role_id, conflicting_role_id)
SELECT r1.id, r2.id FROM roles r1, roles r2
WHERE (r1.name = 'patient' AND r2.name IN ('admin', 'manager', 'director'))
   OR (r1.name = 'doctor' AND r2.name = 'patient');

-- ============================================
-- SEED DEFAULT DEPARTMENTS
-- ============================================
INSERT INTO departments (name_en, name_ar, max_daily, is_open) VALUES
  ('Cardiology', 'القلب', 30, true),
  ('Dermatology', 'الجلدية', 25, true),
  ('Emergency', 'الطوارئ', 100, true),
  ('General Medicine', 'الطب العام', 40, true),
  ('Neurology', 'العصاب', 20, true),
  ('Orthopedics', 'العظام', 25, true),
  ('Pediatrics', 'الأطفال', 35, true),
  ('Radiology', 'الأشعة', 15, true);

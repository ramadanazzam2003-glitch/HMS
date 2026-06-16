-- =============================================
-- RUN THIS ONLY IF profiles TABLE DOESN'T EXIST
-- If profiles already exists with role enum, 
-- run the FIX script instead (001b_fix_profiles.sql)
-- =============================================

-- 1. Seed roles table (skip if already has data)
INSERT INTO roles (name, description) VALUES
  ('patient', 'Regular patient - can book and cancel own appointments'),
  ('doctor', 'Doctor - can view assigned appointments'),
  ('nurse', 'Nurse - can manage triage and view bookings'),
  ('receptionist', 'Receptionist - can manage all bookings'),
  ('admin', 'Administrator - full system access')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed permissions table (skip if already has data)
INSERT INTO permissions (name, resource) VALUES
  -- Bookings
  ('bookings:view_own', 'bookings'),
  ('bookings:view_all', 'bookings'),
  ('bookings:create', 'bookings'),
  ('bookings:update', 'bookings'),
  ('bookings:delete', 'bookings'),
  -- Departments
  ('departments:view', 'departments'),
  ('departments:manage', 'departments'),
  -- Doctors
  ('doctors:view_active', 'doctors'),
  ('doctors:view_all', 'doctors'),
  ('doctors:manage', 'doctors'),
  -- Profiles
  ('profiles:view_own', 'profiles'),
  ('profiles:view_all', 'profiles'),
  ('profiles:manage', 'profiles'),
  -- Settings
  ('settings:manage', 'settings'),
  -- Triage
  ('triage:view', 'triage')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign permissions to roles
-- Patient permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN (
  'bookings:view_own', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_active', 'profiles:view_own'
)
ON CONFLICT DO NOTHING;

-- Doctor permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'doctor' AND p.name IN (
  'bookings:view_own', 'departments:view', 'doctors:view_active', 'triage:view'
)
ON CONFLICT DO NOTHING;

-- Nurse permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'nurse' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all', 'triage:view'
)
ON CONFLICT DO NOTHING;

-- Receptionist permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'receptionist' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all'
)
ON CONFLICT DO NOTHING;

-- Admin permissions (ALL)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

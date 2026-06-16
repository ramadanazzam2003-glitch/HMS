-- =============================================
-- 001: Setup RBAC tables
-- Run AFTER 000_CLEAN_SLATE.sql
-- =============================================

-- 1. Roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- 2. Permissions table
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL
);

-- 3. Role-Permissions junction
CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Seed roles
INSERT INTO roles (name, description) VALUES
  ('patient', 'Regular patient - can book and cancel own appointments'),
  ('doctor', 'Doctor - can view assigned appointments'),
  ('nurse', 'Nurse - can manage triage and view bookings'),
  ('receptionist', 'Receptionist - can manage all bookings'),
  ('admin', 'Administrator - full system access');

-- 5. Seed permissions
INSERT INTO permissions (name, resource) VALUES
  ('bookings:view_own', 'bookings'),
  ('bookings:view_all', 'bookings'),
  ('bookings:create', 'bookings'),
  ('bookings:update', 'bookings'),
  ('bookings:delete', 'bookings'),
  ('departments:view', 'departments'),
  ('departments:manage', 'departments'),
  ('doctors:view_active', 'doctors'),
  ('doctors:view_all', 'doctors'),
  ('doctors:manage', 'doctors'),
  ('profiles:view_own', 'profiles'),
  ('profiles:view_all', 'profiles'),
  ('profiles:manage', 'profiles'),
  ('settings:manage', 'settings'),
  ('triage:view', 'triage');

-- 6. Assign permissions to roles

-- Patient
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'patient' AND p.name IN (
  'bookings:view_own', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_active', 'profiles:view_own'
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
  'departments:view', 'doctors:view_all', 'triage:view'
);

-- Receptionist
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'receptionist' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all'
);

-- Admin (ALL permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin';

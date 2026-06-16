-- =============================================
-- 004: Upgrade RBAC — Add hierarchy roles
-- Run AFTER 003_rls_policies.sql
-- =============================================

-- 1. Add new roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'System super administrator - full control over everything'),
  ('director', 'Hospital director - can manage all departments and staff'),
  ('deputy', 'Deputy director - can manage most operations'),
  ('dept_manager', 'Department manager - can manage own department')
ON CONFLICT (name) DO NOTHING;

-- 2. Add new permissions
INSERT INTO permissions (name, resource) VALUES
  -- System
  ('system:manage', 'system'),
  ('system:view_logs', 'system'),
  -- Users
  ('users:view_all', 'users'),
  ('users:manage', 'users'),
  ('users:assign_roles', 'users'),
  -- Reports
  ('reports:view_all', 'reports'),
  ('reports:export', 'reports'),
  -- Dashboard
  ('dashboard:view', 'dashboard'),
  ('dashboard:manage', 'dashboard')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign permissions to new roles

-- super_admin (EVERYTHING)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- director
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
  'dashboard:view', 'dashboard:manage'
)
ON CONFLICT DO NOTHING;

-- deputy
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'deputy' AND p.name IN (
  'users:view_all',
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'departments:manage',
  'doctors:view_all', 'doctors:manage',
  'reports:view_all',
  'profiles:view_all',
  'dashboard:view'
)
ON CONFLICT DO NOTHING;

-- admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update', 'bookings:delete',
  'departments:view', 'departments:manage',
  'doctors:view_all', 'doctors:manage',
  'profiles:view_all', 'profiles:manage',
  'settings:manage',
  'dashboard:view'
)
ON CONFLICT DO NOTHING;

-- dept_manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'dept_manager' AND p.name IN (
  'bookings:view_all', 'bookings:update',
  'departments:view',
  'doctors:view_all', 'doctors:manage',
  'reports:view_all',
  'dashboard:view'
)
ON CONFLICT DO NOTHING;

-- Update receptionist with more permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'receptionist' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update',
  'departments:view', 'doctors:view_all',
  'dashboard:view'
)
ON CONFLICT DO NOTHING;

-- Update admin (keep existing, add new)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
  'bookings:view_all', 'bookings:create', 'bookings:update', 'bookings:delete',
  'departments:view', 'departments:manage',
  'doctors:view_all', 'doctors:manage',
  'profiles:view_all', 'profiles:manage',
  'settings:manage',
  'dashboard:view'
)
ON CONFLICT DO NOTHING;

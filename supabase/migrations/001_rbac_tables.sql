-- ============================================
-- MIGRATION 001: RBAC TABLES
-- Creates: roles, permissions, role_permissions, role_conflicts
-- ============================================

-- 1. Roles with Hierarchy
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id INT REFERENCES roles(id) ON DELETE SET NULL,
  level INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permissions with Resource & Scope
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT DEFAULT 'own' CHECK (scope IN ('own', 'department', 'global')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Role-Permission Junction with Temporal Support
CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  granted_by INT REFERENCES roles(id),
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Separation of Duties Constraints
CREATE TABLE role_conflicts (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  conflicting_role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, conflicting_role_id)
);

-- Indexes
CREATE INDEX idx_roles_parent_id ON roles(parent_id);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

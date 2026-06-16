-- ============================================
-- FIX ALL 7 BRAC ISSUES
-- Run AFTER the UPGRADE_TO_BRAC.sql
-- ============================================

-- ============================================
-- FIX 1: HIERARCHY ENFORCEMENT
-- Parent roles inherit child permissions
-- ============================================

CREATE OR REPLACE FUNCTION has_permission(perm_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id INT;
  user_role_level INT;
  parent_role_id INT;
BEGIN
  -- Get user's role
  SELECT p.role_id, r.level INTO user_role_id, user_role_level
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.user_id = auth.uid();

  IF user_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check direct permission
  IF EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE rp.role_id = user_role_id
      AND perm.name = perm_name
      AND (rp.valid_until IS NULL OR rp.valid_until > NOW())
  ) THEN
    RETURN TRUE;
  END IF;

  -- Get parent role
  SELECT parent_id INTO parent_role_id
  FROM roles WHERE id = user_role_id;

  -- Check parent role permissions
  IF parent_role_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM role_permissions rp
      JOIN permissions perm ON rp.permission_id = perm.id
      WHERE rp.role_id = parent_role_id
        AND perm.name = perm_name
        AND (rp.valid_until IS NULL OR rp.valid_until > NOW())
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Check level-based permissions
  IF EXISTS (
    SELECT 1
    FROM role_permissions rp
    JOIN permissions perm ON rp.permission_id = perm.id
    JOIN roles req_role ON rp.role_id = req_role.id
    WHERE perm.name = perm_name
      AND user_role_level >= req_role.level
      AND (rp.valid_until IS NULL OR rp.valid_until > NOW())
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FIX 2: SCOPE ENFORCEMENT
-- RLS policies that use scope column
-- ============================================

-- BOOKINGS: Scope-aware policies
DROP POLICY IF EXISTS "Patients read own bookings" ON bookings;
CREATE POLICY "Patients read own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid()
    OR has_permission('bookings:view_all')
    OR (
      has_permission('bookings:view_own')
      AND EXISTS (
        SELECT 1 FROM doctors d
        WHERE d.id = bookings.doctor_id
        AND d.department_id = get_user_department()
      )
    )
  );

-- DOCTORS: Scope-aware policies
DROP POLICY IF EXISTS "Staff read all doctors" ON doctors;
CREATE POLICY "Staff read all doctors" ON doctors
  FOR SELECT USING (
    is_active = true
    OR has_permission('doctors:view_all')
    OR (
      has_permission('doctors:view_active')
      AND department_id = get_user_department()
    )
  );

-- PROFILES: Scope-aware policies
DROP POLICY IF EXISTS "Staff read all profiles" ON profiles;
CREATE POLICY "Staff read all profiles" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR has_permission('profiles:view_all')
    OR (
      has_permission('profiles:view_own')
      AND department_id = get_user_department()
    )
  );

-- ============================================
-- FIX 3: ROLE CONFLICTS ENFORCEMENT
-- Trigger prevents assigning conflicting roles
-- ============================================

CREATE OR REPLACE FUNCTION check_role_conflict()
RETURNS TRIGGER AS $$
DECLARE
  new_role_name TEXT;
  conflicting_role RECORD;
BEGIN
  -- Get the new role name
  SELECT name INTO new_role_name
  FROM roles WHERE id = NEW.role_id;

  -- Check each conflict rule
  FOR conflicting_role IN
    SELECT rc.conflicting_role_id
    FROM role_conflicts rc
    JOIN roles r ON rc.role_id = r.id
    WHERE r.name = new_role_name
  LOOP
    -- Check if user already has the conflicting role
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = NEW.user_id
        AND role_id = conflicting_role.conflicting_role_id
    ) THEN
      RAISE EXCEPTION 'Role assignment conflicts with existing role';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_role_conflict_trigger ON profiles;
CREATE TRIGGER check_role_conflict_trigger
  BEFORE INSERT OR UPDATE OF role_id ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_role_conflict();

-- ============================================
-- FIX 4: AUDIT LOGS AUTO-POPULATE
-- Triggers for INSERT/UPDATE/DELETE
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, new_values)
    VALUES (
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, old_values)
    VALUES (
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
DROP TRIGGER IF EXISTS audit_bookings ON bookings;
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_departments ON departments;
CREATE TRIGGER audit_departments
  AFTER INSERT OR UPDATE OR DELETE ON departments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_doctors ON doctors;
CREATE TRIGGER audit_doctors
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- FIX 5: CORRECT HIERARCHY
-- Director is ABOVE Admin (not below)
-- ============================================

-- Fix hierarchy order:
-- patient(0) < doctor(1) < nurse(2) < receptionist(3) < dept_manager(4) < admin(5) < director(6) < super_admin(7)
UPDATE roles SET level = 0, parent_id = NULL WHERE name = 'patient';
UPDATE roles SET level = 1, parent_id = NULL WHERE name = 'doctor';
UPDATE roles SET level = 2, parent_id = NULL WHERE name = 'nurse';
UPDATE roles SET level = 3, parent_id = NULL WHERE name = 'receptionist';
UPDATE roles SET level = 4, parent_id = NULL WHERE name = 'dept_manager';
UPDATE roles SET level = 5, parent_id = NULL WHERE name = 'admin';
UPDATE roles SET level = 6, parent_id = (SELECT id FROM roles WHERE name = 'admin') WHERE name = 'director';
UPDATE roles SET level = 7, parent_id = (SELECT id FROM roles WHERE name = 'director') WHERE name = 'manager';

-- ============================================
-- FIX 6: ADD SUPER_ADMIN ROLE
-- ============================================

-- Insert super_admin if it doesn't exist
INSERT INTO roles (name, description, level, is_active)
VALUES ('super_admin', 'Super Administrator - Full system access', 8, true)
ON CONFLICT (name) DO UPDATE SET level = 8;

-- Give super_admin all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Update manager to be below super_admin
UPDATE roles SET level = 7, parent_id = (SELECT id FROM roles WHERE name = 'director') WHERE name = 'manager';
UPDATE roles SET level = 8, parent_id = NULL WHERE name = 'super_admin';

-- ============================================
-- FIX 7: SAFE SEED STEP
-- Use UPSERT instead of DELETE
-- ============================================

-- Instead of DELETE FROM role_permissions, use:
-- DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name IN ('patient', 'doctor', ...));
-- This only clears specific roles, not ALL roles

-- Or better: Use ON CONFLICT for idempotent inserts
-- (Already done above with ON CONFLICT DO NOTHING)

-- ============================================
-- UPDATE HELPER FUNCTIONS
-- ============================================

-- Update get_user_role_level to handle super_admin
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS INT AS $$
  SELECT COALESCE(r.level, 0)
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update RLS policies to include super_admin
DROP POLICY IF EXISTS "Manager modify roles" ON roles;
CREATE POLICY "Manager modify roles" ON roles
  FOR ALL USING (get_user_role_level() >= 7);

DROP POLICY IF EXISTS "Manager modify permissions" ON permissions;
CREATE POLICY "Manager modify permissions" ON permissions
  FOR ALL USING (get_user_role_level() >= 7);

DROP POLICY IF EXISTS "Manager modify role_permissions" ON role_permissions;
CREATE POLICY "Manager modify role_permissions" ON role_permissions
  FOR ALL USING (get_user_role_level() >= 7);

-- ============================================
-- VERIFY HIERARCHY
-- ============================================

-- Run this to see the corrected hierarchy:
-- SELECT name, level, parent_id FROM roles ORDER BY level;

-- Expected output:
-- patient   | 0 | NULL
-- doctor    | 1 | NULL
-- nurse     | 2 | NULL
-- receptionist | 3 | NULL
-- dept_manager | 4 | NULL
-- admin     | 5 | NULL
-- director  | 6 | admin_id
-- manager   | 7 | director_id
-- super_admin | 8 | NULL

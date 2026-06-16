-- ============================================
-- FIX UUID ERROR - RUN THIS FIRST
-- ============================================

-- Step 1: Drop all problematic triggers first
DROP TRIGGER IF EXISTS check_role_conflict_trigger ON profiles;
DROP TRIGGER IF EXISTS audit_bookings ON bookings;
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS audit_departments ON departments;
DROP TRIGGER IF EXISTS audit_doctors ON doctors;

-- Step 2: Create fixed has_permission function
CREATE OR REPLACE FUNCTION has_permission(perm_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id INT;
  user_role_level INT;
  parent_role_id INT;
BEGIN
  SELECT p.role_id, r.level INTO user_role_id, user_role_level
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.user_id = auth.uid();

  IF user_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

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

  SELECT parent_id INTO parent_role_id
  FROM roles WHERE id = user_role_id;

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

-- Step 3: Create fixed get_user_role_level function
CREATE OR REPLACE FUNCTION get_user_role_level()
RETURNS INT AS $$
  SELECT COALESCE(r.level, 0)
  FROM profiles p
  JOIN roles r ON p.role_id = r.id
  WHERE p.user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 4: Create fixed get_user_department function
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS INT AS $$
  SELECT department_id
  FROM profiles
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 5: Create fixed check_role_conflict function (NO TRIGGER YET)
CREATE OR REPLACE FUNCTION check_role_conflict()
RETURNS TRIGGER AS $$
DECLARE
  new_role_name TEXT;
  conflicting_role_id INT;
BEGIN
  SELECT name INTO new_role_name
  FROM roles WHERE id = NEW.role_id;

  FOR conflicting_role_id IN
    SELECT rc.conflicting_role_id
    FROM role_conflicts rc
    WHERE rc.role_id = NEW.role_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = NEW.user_id
        AND role_id = conflicting_role_id
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Role assignment conflicts with existing role';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create fixed audit function (NO TRIGGER YET)
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, new_values)
    VALUES (auth.uid(), 'create', TG_TABLE_NAME, CAST(NEW.id AS TEXT), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, old_values, new_values)
    VALUES (auth.uid(), 'update', TG_TABLE_NAME, CAST(NEW.id AS TEXT), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, model, model_id, old_values)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, CAST(OLD.id AS TEXT), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update roles hierarchy
UPDATE roles SET level = 0, parent_id = NULL WHERE name = 'patient';
UPDATE roles SET level = 1, parent_id = NULL WHERE name = 'doctor';
UPDATE roles SET level = 2, parent_id = NULL WHERE name = 'nurse';
UPDATE roles SET level = 3, parent_id = NULL WHERE name = 'receptionist';
UPDATE roles SET level = 4, parent_id = NULL WHERE name = 'dept_manager';
UPDATE roles SET level = 5, parent_id = NULL WHERE name = 'admin';
UPDATE roles SET level = 6, parent_id = (SELECT id FROM roles WHERE name = 'admin') WHERE name = 'director';
UPDATE roles SET level = 7, parent_id = (SELECT id FROM roles WHERE name = 'director') WHERE name = 'manager';

-- Step 8: Add super_admin role
INSERT INTO roles (name, description, level, is_active)
VALUES ('super_admin', 'Super Administrator', 8, true)
ON CONFLICT (name) DO UPDATE SET level = 8;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Step 9: Update RLS policies
DROP POLICY IF EXISTS "Manager modify roles" ON roles;
CREATE POLICY "Manager modify roles" ON roles FOR ALL USING (get_user_role_level() >= 7);

DROP POLICY IF EXISTS "Manager modify permissions" ON permissions;
CREATE POLICY "Manager modify permissions" ON permissions FOR ALL USING (get_user_role_level() >= 7);

DROP POLICY IF EXISTS "Manager modify role_permissions" ON role_permissions;
CREATE POLICY "Manager modify role_permissions" ON role_permissions FOR ALL USING (get_user_role_level() >= 7);

-- ============================================
-- NOW RUN THIS TO ADD TRIGGERS SAFELY
-- ============================================

-- Add role conflict trigger
CREATE TRIGGER check_role_conflict_trigger
  BEFORE INSERT OR UPDATE OF role_id ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_role_conflict();

-- Add audit triggers
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_departments
  AFTER INSERT OR UPDATE OR DELETE ON departments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_doctors
  AFTER INSERT OR UPDATE OR DELETE ON doctors
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- VERIFY
-- ============================================
SELECT 'SUCCESS: All functions and triggers created!' as status;
SELECT name, level FROM roles ORDER BY level;

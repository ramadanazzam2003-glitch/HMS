-- Broaden RLS policies so admin & director can manage permissions
-- Previously only manager (level >= 7) could modify permissions/role_permissions

DROP POLICY IF EXISTS "Manager modify permissions" ON permissions;
CREATE POLICY "Manager modify permissions" ON permissions
  FOR ALL USING (get_user_role_level() >= 5);

DROP POLICY IF EXISTS "Manager modify role_permissions" ON role_permissions;
CREATE POLICY "Manager modify role_permissions" ON role_permissions
  FOR ALL USING (get_user_role_level() >= 5);

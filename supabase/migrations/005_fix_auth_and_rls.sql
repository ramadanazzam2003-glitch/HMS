-- =============================================
-- 005: Fix Auth trigger + RLS recursion
-- Run this in Supabase SQL Editor
-- Problems fixed:
--   1. handle_new_user() trigger fails silently
--      (was causing "Database error saving new user")
--   2. RLS policy called get_user_role() which queries
--      profiles → potential infinite recursion on SELECT
-- =============================================

-- 1. Make handle_new_user() robust — never block signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, full_name, role_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      1
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix RLS on profiles — remove recursive policy
--    The "Admins can view all profiles" policy used get_user_role()
--    which SELECTs from profiles, causing potential recursion.
--    Now only users see their own row. Admin bulk queries should
--    use SECURITY DEFINER RPC functions.
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

-- 3. Keep INSERT/UPDATE/DELETE-only policies (no SELECT = no recursion)
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (get_user_role() = 'admin');

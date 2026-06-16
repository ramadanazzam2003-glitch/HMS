-- ============================================
-- UTILITY: PROMOTE USER TO MANAGER
-- Run this after creating your first admin user
-- ============================================

-- Replace 'your-email@example.com' with your actual email
-- Replace 'manager' with the desired role name

-- Option 1: By email
DO $$
DECLARE
  target_user_id UUID;
  target_role_id INT;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';

  -- Get role ID
  SELECT id INTO target_role_id
  FROM roles
  WHERE name = 'manager';

  -- Update profile
  UPDATE profiles
  SET role_id = target_role_id
  WHERE user_id = target_user_id;

  -- Log the change
  INSERT INTO user_role_history (user_id, old_role_id, new_role_id, reason)
  VALUES (
    target_user_id,
    (SELECT role_id FROM profiles WHERE user_id = target_user_id),
    target_role_id,
    'Initial admin setup'
  );

  RAISE NOTICE 'User promoted to manager successfully';
END $$;

-- Option 2: Quick check - see all users and their roles
-- SELECT p.full_name, u.email, r.name as role_name, r.level
-- FROM profiles p
-- JOIN auth.users u ON p.user_id = u.id
-- JOIN roles r ON p.role_id = r.id
-- ORDER BY r.level DESC;

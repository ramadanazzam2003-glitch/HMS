-- =============================================
-- UTILITY: Make a user admin
-- Change the email below to your email
-- =============================================

-- First, check if the user exists
SELECT u.email, p.full_name, r.name as current_role
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN roles r ON r.id = p.role_id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- Then update to admin
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);

-- Verify the change
SELECT u.email, p.full_name, r.name as role
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
JOIN roles r ON r.id = p.role_id
WHERE u.email = 'YOUR_EMAIL_HERE';

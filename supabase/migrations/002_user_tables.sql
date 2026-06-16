-- ============================================
-- MIGRATION 002: USER TABLES
-- Creates: profiles, user_role_history
-- ============================================

-- 5. User Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role_id INT REFERENCES roles(id) DEFAULT 1,
  department_id INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Role Assignment History (audit trail)
CREATE TABLE user_role_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role_id INT REFERENCES roles(id),
  new_role_id INT REFERENCES roles(id),
  assigned_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_user_role_history_user_id ON user_role_history(user_id);

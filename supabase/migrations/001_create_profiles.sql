-- =============================================
-- 001: Create profiles table with RBAC roles
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create role enum type
CREATE TYPE user_role AS ENUM (
  'patient',
  'doctor',
  'receptionist',
  'nurse',
  'admin'
);

-- 2. Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'patient',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: create profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 6. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. Create a helper to get current user's role (used in RLS policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8. Create a helper to check if user is staff (admin, doctor, nurse, receptionist)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'doctor', 'nurse', 'receptionist')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- RLS POLICIES FOR PROFILES
-- =============================================

-- Everyone can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (get_user_role() = 'admin');

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (get_user_role() = 'admin')
WITH CHECK (get_user_role() = 'admin');

-- Admins can insert profiles manually
CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (get_user_role() = 'admin');

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (get_user_role() = 'admin');

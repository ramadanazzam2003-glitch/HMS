-- ============================================
-- MIGRATION 007: AUTH TRIGGER AND HELPER FUNCTIONS
-- Creates: handle_new_user trigger, audit logging function
-- ============================================

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    1 -- Default to patient role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- AUDIT LOGGING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_model TEXT,
  p_model_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, model, model_id, old_values, new_values)
  VALUES (auth.uid(), p_action, p_model, p_model_id, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GENERATE BOOKING REFERENCE
-- ============================================

CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := to_char(NOW(), 'YYYYMMDD');
  random_part := upper(substring(md5(random()::text) from 1 for 4));
  ref := 'MB-' || date_part || '-' || random_part;
  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CALCULATE QUEUE NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION calculate_queue_number(
  p_department_id INT,
  p_date DATE
)
RETURNS INT AS $$
DECLARE
  max_queue INT;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO max_queue
  FROM bookings
  WHERE department_id = p_department_id
    AND booking_date = p_date
    AND status = 'active';

  RETURN max_queue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

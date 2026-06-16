-- ============================================
-- MIGRATION 003: HOSPITAL TABLES
-- Creates: departments, doctors, bookings, triage_sessions
-- ============================================

-- 7. Departments
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  max_daily INT DEFAULT 50,
  is_open BOOLEAN DEFAULT true,
  image TEXT,
  head_doctor_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Doctors
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'doctor' CHECK (type IN ('doctor', 'consultant')),
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  working_days INT[] DEFAULT '{1,2,3,4,5}',
  slots JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for department head (after doctors table exists)
ALTER TABLE departments ADD CONSTRAINT fk_head_doctor
  FOREIGN KEY (head_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- 9. Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  queue_number INT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'no_show')),
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Triage Sessions
CREATE TABLE triage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]',
  recommendation JSONB,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'emergency')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_doctors_department_id ON doctors(department_id);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_doctor_id ON bookings(doctor_id);
CREATE INDEX idx_bookings_department_id ON bookings(department_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX idx_triage_sessions_user_id ON triage_sessions(user_id);

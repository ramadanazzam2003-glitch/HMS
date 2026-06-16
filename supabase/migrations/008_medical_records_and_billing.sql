-- ============================================
-- MIGRATION 008: MEDICAL RECORDS, PRESCRIPTIONS, BILLS
-- Creates: medical_records, prescriptions, bills tables
-- ============================================

-- 1. Medical Records
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INT,
  doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  vitals JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prescriptions
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded')),
  payment_method TEXT,
  paymob_order_id TEXT,
  paymob_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medical_records_booking_id ON medical_records(booking_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_patient_phone ON medical_records(patient_phone);
CREATE INDEX idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX idx_bills_invoice_number ON bills(invoice_number);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);
CREATE INDEX idx_bills_booking_id ON bills(booking_id);
CREATE INDEX idx_bills_patient_phone ON bills(patient_phone);

-- updated_at triggers
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Medical Records: staff read all, patients read own
CREATE POLICY "medical_records_staff_read" ON medical_records
  FOR SELECT USING (has_permission('bookings:view_all'));

CREATE POLICY "medical_records_patient_read" ON medical_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "medical_records_staff_insert" ON medical_records
  FOR INSERT WITH CHECK (has_permission('bookings:create') OR has_permission('bookings:update'));

CREATE POLICY "medical_records_staff_update" ON medical_records
  FOR UPDATE USING (has_permission('bookings:update'));

-- Prescriptions: linked to medical_records
CREATE POLICY "prescriptions_staff_read" ON prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM medical_records mr
      WHERE mr.id = prescriptions.medical_record_id
      AND (has_permission('bookings:view_all') OR mr.user_id = auth.uid())
    )
  );

CREATE POLICY "prescriptions_staff_insert" ON prescriptions
  FOR INSERT WITH CHECK (has_permission('bookings:create') OR has_permission('bookings:update'));

CREATE POLICY "prescriptions_staff_delete" ON prescriptions
  FOR DELETE USING (has_permission('bookings:update'));

-- Bills: staff read all, patients read own
CREATE POLICY "bills_staff_read" ON bills
  FOR SELECT USING (has_permission('bookings:view_all'));

CREATE POLICY "bills_patient_read" ON bills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = bills.booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "bills_staff_insert" ON bills
  FOR INSERT WITH CHECK (has_permission('bookings:create') OR has_permission('bookings:update'));

CREATE POLICY "bills_staff_update" ON bills
  FOR UPDATE USING (has_permission('bookings:update'));

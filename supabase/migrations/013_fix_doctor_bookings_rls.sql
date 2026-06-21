-- Fix doctors RLS policy: use user_id instead of fragile name matching
-- The old policy matched doctors.name with profiles.full_name, which fails
-- if the names differ (e.g. "د. أحمد" vs "أحمد محمد")

DROP POLICY IF EXISTS "Doctors can view own bookings" ON bookings;

CREATE POLICY "Doctors can view own bookings"
ON bookings FOR SELECT
USING (
  get_user_role() = 'doctor'
  AND doctor_id IN (
    SELECT id FROM doctors WHERE user_id = auth.uid()
  )
);

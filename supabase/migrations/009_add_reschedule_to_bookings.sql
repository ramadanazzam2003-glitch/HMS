-- ============================================
-- MIGRATION 009: ADD RESCHEDULE SUPPORT
-- Adds: rescheduled_from column to bookings
-- ============================================

ALTER TABLE bookings ADD COLUMN rescheduled_from UUID REFERENCES bookings(id) ON DELETE SET NULL;
CREATE INDEX idx_bookings_rescheduled_from ON bookings(rescheduled_from);

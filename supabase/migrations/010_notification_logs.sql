-- ============================================
-- MIGRATION 010: NOTIFICATION LOGS
-- Creates: notification_logs table
-- ============================================

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'booking_cancellation', 'booking_reschedule', 'appointment_reminder', 'payment_confirmation')),
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_booking_id ON notification_logs(booking_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- RLS: staff only
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_staff_read" ON notification_logs
  FOR SELECT USING (has_permission('bookings:view_all'));

CREATE POLICY "notification_logs_staff_insert" ON notification_logs
  FOR INSERT WITH CHECK (has_permission('bookings:create') OR has_permission('bookings:update'));

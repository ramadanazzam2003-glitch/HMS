import { supabase } from './supabase'

const RESEND_FROM = 'MediBook <noreply@medibook.app>'

export async function sendEmail({ to, subject, html }) {
  try {
    const res = await fetch('/api/resend/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Resend error:', err)
      return { success: false, error: err.message || 'Email send failed' }
    }

    const data = await res.json()
    return { success: true, id: data.id }
  } catch (err) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

export async function logNotification({ bookingId, recipientEmail, type, subject, status, errorMessage, metadata }) {
  await supabase.from('notification_logs').insert({
    booking_id: bookingId,
    recipient_email: recipientEmail,
    type,
    subject,
    status: status || 'sent',
    error_message: errorMessage || null,
    metadata: metadata || {},
  })
}

export function bookingConfirmationEmail({ patientName, doctorName, departmentName, date, time, queueNumber, bookingRef }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: #2563eb; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Booking Confirmed</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">MediBook Hospital Management</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">Your appointment has been confirmed. Here are the details:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Booking Ref</td><td style="font-weight: bold; color: #2563eb;">${bookingRef}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Doctor</td><td style="font-weight: bold;">${doctorName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Department</td><td style="font-weight: bold;">${departmentName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Date</td><td style="font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Time</td><td style="font-weight: bold;">${time}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Queue Number</td><td style="font-weight: bold;">#${queueNumber}</td></tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Please arrive 10 minutes before your appointment. You can cancel or reschedule from your dashboard.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${window.location.origin}/my-bookings" style="background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View My Bookings</a>
        </div>
      </div>
    </body>
    </html>
  `
}

export function bookingCancellationEmail({ patientName, doctorName, date, time, bookingRef }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: #dc2626; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">MediBook Hospital Management</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">Your appointment has been cancelled.</p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Booking Ref</td><td style="font-weight: bold;">${bookingRef}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Doctor</td><td style="font-weight: bold;">${doctorName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Date</td><td style="font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Time</td><td style="font-weight: bold;">${time}</td></tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px;">If this was a mistake, you can book a new appointment anytime.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${window.location.origin}/" style="background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Book New Appointment</a>
        </div>
      </div>
    </body>
    </html>
  `
}

export function bookingRescheduleEmail({ patientName, doctorName, oldDate, oldTime, newDate, newTime, bookingRef }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: #d97706; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Booking Rescheduled</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">MediBook Hospital Management</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">Your appointment has been rescheduled.</p>
        <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #92400e; font-weight: bold;">FROM</p>
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 2px 0; color: #6b7280;">Date</td><td>${oldDate}</td></tr>
            <tr><td style="padding: 2px 0; color: #6b7280;">Time</td><td>${oldTime}</td></tr>
          </table>
          <p style="margin: 12px 0 8px; font-size: 12px; color: #166534; font-weight: bold;">TO</p>
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 2px 0; color: #6b7280;">Date</td><td style="font-weight: bold;">${newDate}</td></tr>
            <tr><td style="padding: 2px 0; color: #6b7280;">Time</td><td style="font-weight: bold;">${newTime}</td></tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Booking Ref: <strong>${bookingRef}</strong></p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${window.location.origin}/my-bookings" style="background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View My Bookings</a>
        </div>
      </div>
    </body>
    </html>
  `
}

export function appointmentReminderEmail({ patientName, doctorName, departmentName, date, time, bookingRef }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: #7c3aed; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Appointment Reminder</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">MediBook Hospital Management</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">This is a reminder for your upcoming appointment tomorrow.</p>
        <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Booking Ref</td><td style="font-weight: bold; color: #7c3aed;">${bookingRef}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Doctor</td><td style="font-weight: bold;">${doctorName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Department</td><td style="font-weight: bold;">${departmentName}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Date</td><td style="font-weight: bold;">${date}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Time</td><td style="font-weight: bold;">${time}</td></tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Please arrive 10 minutes before your appointment. Don't forget to bring any relevant medical documents.</p>
      </div>
    </body>
    </html>
  `
}

export function paymentConfirmationEmail({ patientName, amount, invoiceNumber, bookingRef, doctorName }) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: #059669; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Payment Confirmed</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">MediBook Hospital Management</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">Hello <strong>${patientName}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px;">Your payment has been successfully processed.</p>
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <table style="width: 100%; font-size: 14px; color: #374151;">
            <tr><td style="padding: 4px 0; color: #6b7280;">Invoice Number</td><td style="font-weight: bold;">${invoiceNumber}</td></tr>
            <tr><td style="padding: 4px 0; color: #6b7280;">Booking Ref</td><td style="font-weight: bold;">${bookingRef}</td></tr>
            ${doctorName ? `<tr><td style="padding: 4px 0; color: #6b7280;">Doctor</td><td style="font-weight: bold;">${doctorName}</td></tr>` : ''}
            <tr><td style="padding: 4px 0; color: #6b7280;">Amount Paid</td><td style="font-weight: bold; color: #059669; font-size: 18px;">$${amount}</td></tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Thank you for your payment. This email serves as your receipt.</p>
      </div>
    </body>
    </html>
  `
}

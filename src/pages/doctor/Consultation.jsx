import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import PrescriptionBuilder from '../../components/medical/PrescriptionBuilder'
import { motion } from 'framer-motion'
import { User, Phone, CalendarDays, Clock, Building2, Heart, Thermometer, Weight, Activity } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function Consultation() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const { user } = useAuth()
  const { toast } = useUI()

  const [booking, setBooking] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', heartRate: '' })
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (ignore || !doctorData) { setLoading(false); return }
      setDoctor(doctorData)

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, departments(name_en)')
        .eq('id', bookingId)
        .single()

      if (!ignore) {
        setBooking(bookingData)
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [bookingId, user?.id])

  const handleSave = async () => {
    if (!diagnosis.trim()) {
      toast('Please enter a diagnosis', { type: 'error' })
      return
    }

    setSaving(true)

    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .insert({
        patient_name: booking.patient_name,
        patient_phone: booking.phone,
        patient_age: booking.age,
        doctor_id: doctor?.id,
        department_id: booking.department_id,
        booking_id: booking.id,
        user_id: booking.user_id,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || null,
        vitals: Object.fromEntries(Object.entries(vitals).filter(([, v]) => v.trim())),
      })
      .select()
      .single()

    if (recordError) {
      toast('Error saving record: ' + recordError.message, { type: 'error' })
      setSaving(false)
      return
    }

    if (prescriptions.length > 0) {
      const prescriptionData = prescriptions.map(p => ({
        medical_record_id: record.id,
        medication_name: p.medication_name,
        dosage: p.dosage || null,
        frequency: p.frequency || null,
        duration: p.duration || null,
        notes: p.notes || null,
      }))

      await supabase.from('prescriptions').insert(prescriptionData)
    }

    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId)

    toast('Medical record saved successfully', { type: 'success' })
    navigate('/doctor')
  }

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </DashboardLayout>
  )

  if (!booking) return (
    <DashboardLayout>
      <div className="rounded-2xl bg-surface border border-border p-10 text-center">
        <p className="text-txt-primary font-semibold mb-4">Booking not found</p>
        <Button variant="primary" onClick={() => navigate('/doctor')}>Back to Dashboard</Button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-txt-primary">Patient Consultation</h1>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Record'}
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <motion.div className="rounded-2xl bg-surface border border-border p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-txt-primary text-sm mb-3">Patient Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted flex items-center gap-1.5"><User size={14} /> Name</span>
                  <span className="font-semibold text-txt-primary">{booking.patient_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted flex items-center gap-1.5"><Phone size={14} /> Phone</span>
                  <span className="font-semibold text-txt-primary">{booking.phone}</span>
                </div>
                {booking.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-txt-muted flex items-center gap-1.5"><User size={14} /> Age</span>
                    <span className="font-semibold text-txt-primary">{booking.age}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted flex items-center gap-1.5"><Building2 size={14} /> Department</span>
                  <span className="font-semibold text-txt-primary">{booking.departments?.name_en}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted flex items-center gap-1.5"><CalendarDays size={14} /> Date</span>
                  <span className="font-semibold text-txt-primary">{booking.booking_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted flex items-center gap-1.5"><Clock size={14} /> Time</span>
                  <span className="font-semibold text-txt-primary">{booking.slot_time}</span>
                </div>
              </div>
            </motion.div>

            <motion.div className="rounded-2xl bg-surface border border-border p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-txt-primary text-sm mb-3">Vitals</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'bp', label: 'Blood Pressure', placeholder: '120/80', icon: <Activity size={14} /> },
                  { key: 'temp', label: 'Temperature', placeholder: '37.0 C', icon: <Thermometer size={14} /> },
                  { key: 'weight', label: 'Weight', placeholder: '70 kg', icon: <Weight size={14} /> },
                  { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm', icon: <Heart size={14} /> },
                ].map(({ key, label, placeholder, icon }) => (
                  <div key={key}>
                    <label className="text-xs text-txt-muted mb- flex items-center gap-1">{icon} {label}</label>
                    <Input
                      value={vitals[key]}
                      onChange={(e) => setVitals({ ...vitals, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div className="rounded-2xl bg-surface border border-border p-5 mb-4" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <h3 className="font-bold text-txt-primary text-sm mb-3">Diagnosis *</h3>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="flex h-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[100px] resize-y"
              placeholder="Enter diagnosis here..."
            />
          </motion.div>

          <motion.div className="rounded-2xl bg-surface border border-border p-5 mb-4" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <h3 className="font-bold text-txt-primary text-sm mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex h-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[80px] resize-y"
              placeholder="Additional clinical notes (optional)..."
            />
          </motion.div>

          <div className="rounded-2xl bg-surface border border-border p-5 mb-4">
            <PrescriptionBuilder
              prescriptions={prescriptions}
              onChange={setPrescriptions}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="primary" size="md" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save & Complete'}
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate('/doctor')}>
              Cancel
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

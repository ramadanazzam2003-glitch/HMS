import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { useUI } from '../../hooks/useUI'
import { generateBookingRef } from '../../utils/booking'
import { motion } from 'framer-motion'
import { User, Phone, Building2, Stethoscope, CalendarDays, Clock } from 'lucide-react'

export default function WalkInBooking() {
  const navigate = useNavigate()
  const { toast } = useUI()

  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    patient_name: '', phone: '', age: '',
    department_id: '', doctor_id: '', booking_date: '', slot_time: '',
  })

  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: depts } = await supabase.from('departments').select('*').eq('is_open', true).order('name_en')
      const { data: docs } = await supabase.from('doctors').select('*, departments(name_en)').eq('is_active', true).order('name')
      if (!ignore) { setDepartments(depts || []); setDoctors(docs || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!form.department_id) { setDoctors([]); return }
    let ignore = false
    const load = async () => {
      const { data: docs } = await supabase.from('doctors').select('*, departments(name_en)')
        .eq('department_id', form.department_id).eq('is_active', true).order('name')
      if (!ignore) setDoctors(docs || [])
    }
    load()
    return () => { ignore = true }
  }, [form.department_id])

  useEffect(() => {
    if (!form.doctor_id || !form.booking_date) return
    let ignore = false
    const load = async () => {
      const { data: bookings } = await supabase.from('bookings').select('slot_time')
        .eq('doctor_id', form.doctor_id).eq('booking_date', form.booking_date).eq('status', 'active')
      const doctor = doctors.find(d => d.id === form.doctor_id)
      if (!ignore) {
        setBookedSlots(bookings?.map(b => b.slot_time) || [])
        setAvailableSlots(doctor?.slots || [])
      }
    }
    load()
    return () => { ignore = true }
  }, [form.doctor_id, form.booking_date, doctors])

  const selectedDoctor = doctors.find(d => d.id === form.doctor_id)

  const handleBook = async () => {
    if (!form.patient_name || !form.phone || !form.doctor_id || !form.booking_date || !form.slot_time) {
      return toast('Please fill all required fields', { type: 'error' })
    }

    const { error } = await supabase.from('bookings').insert({
      booking_ref: generateBookingRef(),
      patient_name: form.patient_name,
      phone: form.phone,
      age: form.age || null,
      doctor_id: form.doctor_id,
      department_id: form.department_id,
      booking_date: form.booking_date,
      slot_time: form.slot_time,
      status: 'active',
    })

    if (error) {
      toast('Error creating booking: ' + error.message, { type: 'error' })
    } else {
      toast('Booking created successfully', { type: 'success' })
      navigate('/dashboard/bookings')
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center p-10">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>

          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-txt-primary text-sm mb-4 flex items-center gap-2"><User size={16} /> Patient Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><User size={12} /> Patient Name *</label>
                      <Input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })}
                        placeholder="Full name" />
                    </div>
                    <div>
                      <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><Phone size={12} /> Phone *</label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="01xxxxxxxxx" />
                    </div>
                    <div>
                      <label className="text-xs text-txt-muted mb-1 block">Age</label>
                      <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                        placeholder="Optional" />
                    </div>
                    <Button onClick={() => { if (form.patient_name && form.phone) setStep(2) }} className="w-full">Next →</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-txt-primary text-sm mb-4 flex items-center gap-2"><Building2 size={16} /> Select Department & Doctor</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><Building2 size={12} /> Department *</label>
                      <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, doctor_id: '' })}
                        className="flex h-10 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                      </select>
                    </div>
                    {form.department_id && (
                      <div>
                        <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><Stethoscope size={12} /> Doctor *</label>
                        <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                          className="flex h-10 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200">
                          <option value="">Select Doctor</option>
                          {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                      <Button onClick={() => { if (form.doctor_id) setStep(3) }} className="flex-1">Next →</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-txt-primary text-sm mb-4 flex items-center gap-2"><CalendarDays size={16} /> Select Date & Time</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><CalendarDays size={12} /> Date *</label>
                      <Input type="date" value={form.booking_date} min={new Date().toISOString().slice(0, 10)}
                        onChange={e => setForm({ ...form, booking_date: e.target.value, slot_time: '' })} />
                    </div>
                    {form.booking_date && (
                      <div>
                        <label className="text-xs text-txt-muted mb-1 block flex items-center gap-1"><Clock size={12} /> Available Slots *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {availableSlots.map(slot => {
                            const isBooked = bookedSlots.includes(slot)
                            const isSelected = form.slot_time === slot
                            return (
                              <motion.button key={slot} disabled={isBooked}
                                onClick={() => setForm({ ...form, slot_time: slot })}
                                whileHover={!isBooked ? { scale: 1.05 } : {}} whileTap={!isBooked ? { scale: 0.95 } : {}}
                                className={`rounded-xl p-2.5 text-sm font-semibold border-2 transition-all ${
                                  isBooked ? 'bg-surface-hover text-txt-muted border-border cursor-not-allowed line-through'
                                  : isSelected ? 'bg-primary text-white border-primary'
                                  : 'bg-surface text-txt-primary border-border cursor-pointer hover:border-primary'
                                }`}>
                                {slot}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                      <Button onClick={handleBook} disabled={!form.slot_time} className="flex-1">
                        Create Booking
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

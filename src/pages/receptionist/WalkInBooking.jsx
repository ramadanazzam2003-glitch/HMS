import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
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
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Walk-In Booking" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Walk-In Booking" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <motion.div className="card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><User size={16} /> Patient Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label flex items-center gap-1"><User size={12} /> Patient Name *</label>
                  <input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })}
                    className="input" placeholder="Full name" />
                </div>
                <div>
                  <label className="input-label flex items-center gap-1"><Phone size={12} /> Phone *</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="input" placeholder="01xxxxxxxxx" />
                </div>
                <div>
                  <label className="input-label">Age</label>
                  <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })}
                    className="input" placeholder="Optional" />
                </div>
                <motion.button onClick={() => { if (form.patient_name && form.phone) setStep(2) }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn btn-primary btn-md w-full">Next →</motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div className="card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Building2 size={16} /> Select Department & Doctor</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label flex items-center gap-1"><Building2 size={12} /> Department *</label>
                  <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, doctor_id: '' })} className="input">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                  </select>
                </div>
                {form.department_id && (
                  <div>
                    <label className="input-label flex items-center gap-1"><Stethoscope size={12} /> Doctor *</label>
                    <select value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} className="input">
                      <option value="">Select Doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn btn-secondary btn-md flex-1">← Back</button>
                  <motion.button onClick={() => { if (form.doctor_id) setStep(3) }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="btn btn-primary btn-md flex-1">Next →</motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div className="card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><CalendarDays size={16} /> Select Date & Time</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label flex items-center gap-1"><CalendarDays size={12} /> Date *</label>
                  <input type="date" value={form.booking_date} min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm({ ...form, booking_date: e.target.value, slot_time: '' })} className="input" />
                </div>
                {form.booking_date && (
                  <div>
                    <label className="input-label flex items-center gap-1"><Clock size={12} /> Available Slots *</label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot)
                        const isSelected = form.slot_time === slot
                        return (
                          <motion.button key={slot} disabled={isBooked}
                            onClick={() => setForm({ ...form, slot_time: slot })}
                            whileHover={!isBooked ? { scale: 1.05 } : {}} whileTap={!isBooked ? { scale: 0.95 } : {}}
                            className={`rounded-xl p-2.5 text-sm font-semibold border-2 transition-all ${
                              isBooked ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                              : isSelected ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-800 border-gray-100 cursor-pointer hover:border-blue-300'
                            }`}>
                            {slot}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn btn-secondary btn-md flex-1">← Back</button>
                  <motion.button onClick={handleBook} disabled={!form.slot_time}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="btn btn-primary btn-md flex-1">
                    Create Booking
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

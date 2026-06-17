import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, CalendarDays, Clock, Stethoscope, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { calcEndTime, generateBookingRef } from '../../utils/booking'
import { useUI } from '../../hooks/useUI'
import StepIndicator from '../../components/StepIndicator'

export default function PatientForm() {
  const navigate = useNavigate()
  const { state } = useLocation()

  const [loading, setLoading] = useState(false)
  const { toast } = useUI()
  const [form, setForm]       = useState({ patient_name: '', phone: '', age: '' })
  const [errors, setErrors]   = useState({})

  const phoneRef  = useRef(null)
  const ageRef    = useRef(null)
  const submitRef = useRef(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') { e.preventDefault(); nextRef.current?.focus() }
  }

  const validate = () => {
    const errs = {}
    if (!form.patient_name.trim()) errs.patient_name = 'Full name is required'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    if (form.phone && !/^[0-9]{10,15}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number'
    if (form.age && (parseInt(form.age) < 1 || parseInt(form.age) > 120)) errs.age = 'Invalid age'
    return errs
  }

const handleSubmit = async () => {
  const errs = validate()
  if (Object.keys(errs).length > 0) { setErrors(errs); return }

  setLoading(true)
  const bookingRef = generateBookingRef()

  // ✅ جيب الـ session
  const { data: { session } } = await supabase.auth.getSession()

  const { data: existing } = await supabase
    .from('bookings').select('queue_number')
    .eq('doctor_id', state.doctor?.id)
    .neq('status', 'cancelled')
    .order('queue_number', { ascending: false })
    .limit(1)

  const nextQueue = (existing?.[0]?.queue_number || 0) + 1
  const slotTime  = state.selectedSlot

  const { error } = await supabase.from('bookings').insert({
    booking_ref:   bookingRef,
    department_id: state.deptId,
    doctor_id:     state.doctor?.id,
    patient_name:  form.patient_name,
    phone:         form.phone,
    age:           form.age ? parseInt(form.age) : null,
    queue_number:  nextQueue,
    booking_date:  state.selectedDate,
    slot_time:     slotTime,
    status:        'active',
    user_id:       session?.user?.id || null, // ✅ أضف السطر ده
  })

    if (error) {
      toast('Error creating booking: ' + error.message, { type: 'error' })
      setLoading(false)
      return
    }

    navigate('/confirmation', {
      state: {
        bookingRef, doctorName: state.doctor?.name,
        slotTime, endTime: calcEndTime(slotTime), date: state.selectedDate,
        patientName: form.patient_name, queueNumber: nextQueue,
        deptId: state.deptId, doctorId: state.doctor?.id,
      }
    })
  }

  const endTime = calcEndTime(state?.selectedSlot)

  return (
    <div className="page">
      <Navbar
        back={-1}
        subtitle="Patient Information"
        breadcrumbs={[
          { label: 'Departments', path: '/'  },
          { label: 'Type',        path: -3   },
          { label: 'Doctor',      path: -2   },
          { label: 'Slot',        path: -1   },
          { label: 'Confirm'                 },
        ]}
      />

      <div className="hero-gradient">
        <div className="absolute -top-10 -right-10 w-50 h-50 rounded-full bg-white/5 pointer-events-none" />
        <div className="hero-inner text-center relative">
          <span className="hero-chip">Almost Done!</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">Patient Information</h1>
          <p className="text-white/70 text-sm">Fill in your details to confirm the booking</p>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={4} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            className="card animate-fadeIn p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2"><User size={18} /> Your Details</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="input-label">Full Name *</label>
                <input name="patient_name" value={form.patient_name} onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, phoneRef)} autoFocus className="input"
                  placeholder="Ahmed Mohamed"
                  style={{ borderColor: errors.patient_name ? 'var(--danger)' : undefined }} />
                {errors.patient_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.patient_name}</p>}
              </div>

              <div>
                <label className="input-label">Phone Number *</label>
                <input ref={phoneRef} name="phone" value={form.phone} onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, ageRef)} className="input"
                  placeholder="01012345678"
                  style={{ borderColor: errors.phone ? 'var(--danger)' : undefined }} />
                {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.phone}</p>}
              </div>

              <div>
                <label className="input-label">Age <span className="text-gray-400 font-normal">(optional)</span></label>
                <input ref={ageRef} name="age" type="number" value={form.age} onChange={handleChange}
                  onKeyDown={e => handleKeyDown(e, submitRef)} className="input"
                  placeholder="30" min="1" max="120"
                  style={{ borderColor: errors.age ? 'var(--danger)' : undefined }} />
                {errors.age && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.age}</p>}
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <motion.div
              className="card animate-fadeIn p-6"
              style={{ animationDelay: '60ms' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 }}
            >
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2"><CheckCircle size={18} /> Booking Summary</h2>

              <div className="flex flex-col gap-3">
                {[
                  { icon: <Stethoscope size={14} />, label: 'Doctor',   value: state?.doctor?.name },
                  { icon: <Building2 size={14} />, label: 'Type',     value: state?.bookingType, capitalize: true },
                  { icon: <CalendarDays size={14} />, label: 'Date',     value: state?.selectedDate },
                  { icon: <Clock size={14} />, label: 'Time',     value: state?.selectedSlot ? `${state.selectedSlot} → ${endTime}` : '' },
                  { icon: <Clock size={14} />, label: 'Duration', value: '15 minutes' },
                ].map(({ icon, label, value, capitalize }) => (
                  <div key={label} className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">{icon} {label}</span>
                    <span className={`text-xs font-semibold text-gray-800 ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="card animate-fadeIn p-4 bg-blue-50 border-blue-200"
              style={{ animationDelay: '120ms' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <p className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1.5"><AlertCircle size={16} /> Tips</p>
              <ul className="text-xs text-gray-500 pl-4 leading-relaxed">
                <li>Save your booking reference after confirming</li>
                <li>Arrive 10 minutes before your slot</li>
                <li>You can cancel using your reference number</li>
              </ul>
            </motion.div>
          </div>
        </div>

        <div className="mt-5">
          <button ref={submitRef} onClick={handleSubmit} disabled={loading}
            className="btn btn-primary btn-lg btn-full">
            {loading ? '⏳ Creating booking...' : '✓ Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

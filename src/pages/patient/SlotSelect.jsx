import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Stethoscope, UserRound, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUI } from '../../hooks/useUI'
import Navbar from '../../components/Navbar'
import SlotPicker from '../../components/SlotPicker'
import StepIndicator from '../../components/StepIndicator'
import { calcEndTime } from '../../utils/booking'  

const isDateAllowed = (dateStr, workingDays) => {
  if (!workingDays || workingDays.length === 0) return true
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return workingDays.includes(date.toLocaleDateString('en-US', { weekday: 'long' }))
}

export default function SlotSelect() {
  const { doctorId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const doctor      = state?.doctor
  const bookingType = state?.bookingType
  const deptId      = state?.deptId

  const [currentDate, setCurrentDate]   = useState(() => new Date().toISOString().split('T')[0])
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots]   = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading]           = useState(false)
  const { toast } = useUI()

  useEffect(() => {
    if (!currentDate) return
    let ignore = false
    const fetchBooked = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('bookings')
        .select('slot_time')
        .eq('doctor_id', doctorId)
        .eq('booking_date', currentDate)
        .eq('status', 'active')

      if (!ignore) {
        setBookedSlots(data?.map(b => b.slot_time) || [])
        const [year, month, day] = currentDate.split('-').map(Number)
        const dayName = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' })
        const workingDays = doctor?.working_days || []
        setAvailableSlots(workingDays.length > 0 && !workingDays.includes(dayName) ? [] : (doctor?.slots || []))
        setLoading(false)
      }
    }
    fetchBooked()
    return () => { ignore = true }
  }, [currentDate, doctorId, doctor?.working_days, doctor?.slots])

  const handleContinue = () => {
    if (!selectedSlot) return toast('Please select a time slot', { type: 'error' })
    navigate('/patient-form', { state: { doctor, bookingType, deptId, selectedDate: currentDate, selectedSlot } })
  }

  if (!doctor) return (
    <div className="page">
      <Navbar back="/" subtitle="Slot Selection" />
      <div className="page-content">
        <div className="card empty-state">
          <div className="empty-state-icon"><AlertTriangle size={48} className="text-gray-300" /></div>
          <p className="empty-state-title">No Doctor Selected</p>
          <p className="empty-state-desc">Please go back and select a doctor first.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary btn-md">Go Home</button>
        </div>
      </div>
    </div>
  )

  const today          = new Date().toISOString().split('T')[0]
  const dateAllowed    = isDateAllowed(currentDate, doctor?.working_days)

  return (
    <div className="page">
      <Navbar
        back={-1}
        subtitle={doctor.name}
        breadcrumbs={[
          { label: 'Departments', path: '/' },
          { label: 'Type',       path: -2 },
          { label: 'Doctor',     path: -1 },
          { label: 'Slot' },
        ]}
      />

      <div className="hero-gradient">
        <div className="hero-inner">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl shrink-0 bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              {bookingType === 'consultant' ? <Stethoscope size={28} className="text-white" /> : <UserRound size={28} className="text-white" />}
            </div>
            <div>
              <span className="hero-chip mb-1.5">{bookingType}</span>
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-1">{doctor.name}</h1>
              {doctor.working_days?.length > 0 && (
                <p className="text-white/70 text-xs flex items-center gap-1"><CalendarDays size={12} /> Available: {doctor.working_days.map(d => d.slice(0, 3)).join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={3} />

        <motion.div
          className="card p-5 mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label className="input-label flex items-center gap-1.5"><CalendarDays size={14} /> Select Date</label>
          <input type="date" value={currentDate} min={today}
            onChange={e => { setCurrentDate(e.target.value); setSelectedSlot('') }}
            className="input" />
          {!dateAllowed && (
            <div className="alert-warning mt-3">
              <AlertTriangle size={16} />
              <div>
                <p className="font-semibold mb-0.5">Not available on this day</p>
                <p className="text-xs">Available: {doctor.working_days?.map(d => d.slice(0, 3)).join(', ')}</p>
              </div>
            </div>
          )}
        </motion.div>

        <SlotPicker
          slots={availableSlots}
          bookedSlots={bookedSlots}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
          loading={loading}
          dateAllowed={dateAllowed}
          workingDays={doctor.working_days}
        />

        {selectedSlot && (
          <motion.div
            className="card p-4 mb-4 bg-blue-50 border-blue-200"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-600 font-semibold mb-0.5">Selected Slot</p>
                <p className="text-lg font-extrabold text-blue-600">{selectedSlot} → {calcEndTime(selectedSlot)}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><CalendarDays size={12} /> {currentDate} · <Clock size={12} /> 15 min session</p>
              </div>
              <button onClick={() => setSelectedSlot('')}
                className="w-7 h-7 rounded-full bg-blue-200 border-none cursor-pointer text-sm text-blue-600 font-bold">
                ×
              </button>
            </div>
          </motion.div>
        )}

        <button onClick={handleContinue} disabled={!selectedSlot}
          className="btn btn-primary btn-lg btn-full"
          style={{ opacity: selectedSlot ? 1 : 0.4 }}>
          Continue → {selectedSlot || 'Select a slot first'}
        </button>
      </div>
    </div>
  )
}

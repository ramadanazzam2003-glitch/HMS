import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Stethoscope, UserRound, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUI } from '../../hooks/useUI'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
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

  const [doctor, setDoctor]           = useState(state?.doctor || null)
  const bookingType = state?.bookingType
  const deptId      = state?.deptId

  const [currentDate, setCurrentDate]   = useState(() => new Date().toISOString().split('T')[0])
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots]   = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loading, setLoading]           = useState(false)
  const [fetchingDoctor, setFetchingDoctor] = useState(!state?.doctor)
  const { toast } = useUI()

  useEffect(() => {
    if (state?.doctor) return
    const fetchDoctor = async () => {
      const { data } = await supabase.from('doctors').select('*').eq('id', doctorId).single()
      if (data) setDoctor(data)
      setFetchingDoctor(false)
    }
    fetchDoctor()
  }, [doctorId, state?.doctor])

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

  if (fetchingDoctor) return (
    <div className="page pt-[72px]">
      <PublicNavbar back={`/doctor-select/${doctorId}`} />
      <div className="flex-1 flex items-center justify-center p-10">
        <Skeleton className="w-12 h-12 rounded-full mx-auto" />
      </div>
    </div>
  )

  if (!doctor) return (
    <div className="page pt-[72px]">
      <PublicNavbar back={`/doctor-select/${doctorId}`} />
      <div className="page-content">
        <Card className="text-center p-8">
          <div className="mb-4"><AlertTriangle size={48} className="text-txt-muted mx-auto" /></div>
          <h3 className="text-lg font-bold text-txt-primary mb-2">No Doctor Selected</h3>
          <p className="text-sm text-txt-muted mb-6">Please go back and select a doctor first.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    </div>
  )

  const today          = new Date().toISOString().split('T')[0]
  const dateAllowed    = isDateAllowed(currentDate, doctor?.working_days)

  return (
    <div className="page pt-[72px]">
      <PublicNavbar back={`/doctor-select/${doctorId}`} />

      <div className="hero-gradient">
        <div className="hero-inner">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 bg-surface/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              {bookingType === 'consultant' ? <Stethoscope size={24} className="text-white" /> : <UserRound size={24} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 mb-4">
            <label className="input-label flex items-center gap-1.5"><CalendarDays size={14} /> Select Date</label>
            <Input type="date" value={currentDate} min={today}
              onChange={e => { setCurrentDate(e.target.value); setSelectedSlot('') }} />
            {!dateAllowed && (
              <div className="alert-warning mt-3">
                <AlertTriangle size={16} />
                <div>
                  <p className="font-semibold mb-0.5">Not available on this day</p>
                  <p className="text-xs">Available: {doctor.working_days?.map(d => d.slice(0, 3)).join(', ')}</p>
                </div>
              </div>
            )}
          </Card>
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-600 font-semibold mb-0.5">Selected Slot</p>
                  <p className="text-lg font-extrabold text-blue-600">{selectedSlot} → {calcEndTime(selectedSlot)}</p>
                  <p className="text-xs text-txt-muted mt-0.5 flex items-center gap-1"><CalendarDays size={12} /> {currentDate} · <Clock size={12} /> 15 min session</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelectedSlot('')} className="rounded-full bg-blue-200 text-blue-600 font-bold text-sm">
                  ×
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <Button onClick={handleContinue} disabled={!selectedSlot} size="lg" className="w-full" style={{ opacity: selectedSlot ? 1 : 0.4 }}>
          Continue → {selectedSlot || 'Select a slot first'}
        </Button>
      </div>
    </div>
  )
}

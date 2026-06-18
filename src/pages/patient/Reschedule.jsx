import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Stethoscope } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { useUI } from '../../hooks/useUI'
import { calcEndTime } from '../../utils/booking'

export default function Reschedule() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const { toast } = useUI()

  const [booking, setBooking] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*, doctors(*), departments(name_en)')
        .eq('id', bookingId)
        .single()

      if (ignore || !bookingData) { setLoading(false); return }
      setBooking(bookingData)

      if (bookingData.doctor_id) {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', bookingData.doctor_id)
          .single()

        if (!ignore) setDoctor(doctorData)
      }

      if (!ignore) setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [bookingId])

  useEffect(() => {
    if (!doctor || !selectedDate) return

    const loadSlots = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('slot_time')
        .eq('doctor_id', doctor.id)
        .eq('booking_date', selectedDate)
        .neq('status', 'cancelled')
        .neq('id', bookingId)

      const booked = (bookings || []).map(b => b.slot_time)

      const allSlots = (doctor.slots || []).map(s => typeof s === 'string' ? s : s.time)
      setAvailableSlots(allSlots.filter(s => !booked.includes(s)))
    }
    loadSlots()
  }, [doctor, selectedDate, bookingId])

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      toast('Please select a date and time slot', { type: 'error' })
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('bookings')
      .update({
        booking_date: selectedDate,
        slot_time: selectedSlot,
        rescheduled_from: booking.id,
      })
      .eq('id', booking.id)

    if (error) {
      toast('Error rescheduling: ' + error.message, { type: 'error' })
      setSaving(false)
      return
    }

    toast('Appointment rescheduled successfully', { type: 'success' })

    navigate(-1)
  }

  const getDayName = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' })
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().slice(0, 10)
      const dayName = daysOfWeek[date.getDay()]
      const isWorking = (doctor?.working_days || []).includes(dayName)
      dates.push({ dateStr, dayName, isWorking, isToday: i === 0 })
    }
    return dates
  }

  if (loading) return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/my-bookings" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <p className="text-txt-muted font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )

  if (!booking) return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/my-bookings" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Card className="text-center p-8">
          <h3 className="text-lg font-bold text-txt-primary mb-2">Booking not found</h3>
          <Button className="mt-4" onClick={() => navigate('/my-bookings')}>Back to Bookings</Button>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/my-bookings" />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Card className="p-5 mb-4">
          <h3 className="font-bold text-txt-primary text-sm mb-3 flex items-center gap-2"><Stethoscope size={16} /> Current Booking</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-txt-muted">Doctor</p>
              <p className="font-semibold text-txt-primary">{booking.doctors?.name}</p>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Department</p>
              <p className="font-semibold text-txt-primary">{booking.departments?.name_en}</p>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Current Date</p>
              <p className="font-semibold text-txt-primary">{booking.booking_date}</p>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Current Time</p>
              <p className="font-semibold text-txt-primary">{booking.slot_time}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 mb-4">
          <h3 className="font-bold text-txt-primary text-sm mb-3 flex items-center gap-2"><CalendarDays size={16} /> Select New Date</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {generateDates().map(({ dateStr, dayName, isWorking, isToday }) => (
              <motion.button
                key={dateStr}
                onClick={() => { if (isWorking) { setSelectedDate(dateStr); setSelectedSlot('') } }}
                disabled={!isWorking}
                whileHover={isWorking ? { scale: 1.05 } : {}}
                whileTap={isWorking ? { scale: 0.95 } : {}}
                className={`min-w-[80px] p-3 rounded-xl border text-center transition-all shrink-0 ${
                  selectedDate === dateStr
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : isWorking
                      ? 'border-border hover:border-blue-300 cursor-pointer'
                      : 'border-border bg-gray-50 text-txt-muted cursor-not-allowed'
                }`}
              >
                <p className="text-xs text-txt-muted">{dayName.slice(0, 3)}</p>
                <p className="font-bold text-sm">{dateStr.slice(8, 10)}</p>
                <p className="text-xs text-txt-muted">{dateStr.slice(5, 7)}</p>
                {isToday && <span className="text-[10px] text-blue-500 font-bold">Today</span>}
              </motion.button>
            ))}
          </div>
        </Card>

        {selectedDate && (
          <Card className="p-5 mb-4">
            <h3 className="font-bold text-txt-primary text-sm mb-3 flex items-center gap-2">
              <Clock size={16} /> Available Slots — {getDayName(selectedDate)}, {selectedDate}
            </h3>
            {availableSlots.length === 0 ? (
              <p className="text-txt-muted text-center py-4">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map(slot => (
                  <motion.button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedSlot === slot
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <p className="text-sm font-bold">{slot}</p>
                    <p className="text-xs opacity-70">{calcEndTime(slot)}</p>
                  </motion.button>
                ))}
              </div>
            )}
          </Card>
        )}

        {selectedDate && selectedSlot && (
          <Card className="p-5 bg-green-50 border-green-200 mb-4">
            <h3 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2"><CalendarDays size={16} /> New Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-green-600">Date</p>
                <p className="font-semibold text-green-800">{getDayName(selectedDate)}, {selectedDate}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Time</p>
                <p className="font-semibold text-green-800">{selectedSlot} — {calcEndTime(selectedSlot)}</p>
              </div>
            </div>
          </Card>
        )}

        <Button onClick={handleReschedule} disabled={saving || !selectedDate || !selectedSlot} size="lg" className="w-full">
          {saving ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
      </div>
    </div>
  )
}

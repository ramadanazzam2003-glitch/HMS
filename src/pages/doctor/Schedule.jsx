import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'
import { CalendarDays, Clock } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

const DAYS = [
  { name: 'Sunday', num: 0 },
  { name: 'Monday', num: 1 },
  { name: 'Tuesday', num: 2 },
  { name: 'Wednesday', num: 3 },
  { name: 'Thursday', num: 4 },
  { name: 'Friday', num: 5 },
  { name: 'Saturday', num: 6 },
]

export default function DoctorSchedule() {

  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [weekBookings, setWeekBookings] = useState([])
  const [selectedDay, setSelectedDay] = useState(() => {
    return new Date().getDay()
  })
  const [loading, setLoading] = useState(true)

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

      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const startDate = weekStart.toISOString().slice(0, 10)
      const endDate = weekEnd.toISOString().slice(0, 10)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, departments(name_en)')
        .eq('doctor_id', doctorData.id)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .order('booking_date')
        .order('slot_time')

      if (!ignore) { setWeekBookings(bookings || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const getDayDate = (dayNum) => {
    const today = new Date()
    const diff = dayNum - today.getDay()
    const date = new Date(today)
    date.setDate(today.getDate() + diff)
    return date.toISOString().slice(0, 10)
  }

  const dayDate = getDayDate(selectedDay)
  const dayBookings = weekBookings.filter(b => b.booking_date === dayDate)
  const isWorkingDay = doctor?.working_days?.includes(selectedDay)

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-display text-lg font-bold text-txt-primary mb-4">Weekly Schedule</h1>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {DAYS.map(day => {
            const date = getDayDate(day.num)
            const count = weekBookings.filter(b => b.booking_date === date).length
            const isToday = date === new Date().toISOString().slice(0, 10)
            const isSelected = selectedDay === day.num
            return (
              <motion.button key={day.num} onClick={() => setSelectedDay(day.num)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center min-w-[70px] py-3 px-2 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-txt-secondary border-border hover:border-primary/50'
                }`}>
                <span className="text-xs font-medium">{day.name.slice(0, 3)}</span>
                <span className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>{new Date(date).getDate()}</span>
                {count > 0 && <span className="text-[10px] mt-0.5">{count} appts</span>}
              </motion.button>
            )
          })}
        </div>

        {!isWorkingDay && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 mb-4">
            <p className="text-sm text-yellow-700 font-medium flex items-center gap-2"><CalendarDays size={16} /> Not a working day</p>
            <p className="text-xs text-yellow-600 mt-1">Your working days: {doctor?.working_days?.map(d => DAYS[d]?.name?.slice(0, 3)).filter(Boolean).join(', ')}</p>
          </div>
        )}

        <div className="rounded-2xl bg-surface border border-border p-6">
          <h2 className="font-display text-base font-bold text-txt-primary mb-4">
            {DAYS[selectedDay]?.name} — {dayBookings.length} appointments
          </h2>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : dayBookings.length === 0 ? (
            <p className="text-txt-muted text-center py-6">No appointments scheduled</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {dayBookings.map(b => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-hover border border-border">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[55px]">
                      <p className="text-sm font-bold text-primary flex items-center gap-1"><Clock size={12} />{b.slot_time}</p>
                    </div>
                    <div className="border-s border-border ps-3">
                      <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                      <p className="text-xs text-txt-muted">{b.phone} · {b.departments?.name_en}</p>
                    </div>
                  </div>
                  <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                    {b.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  )
}

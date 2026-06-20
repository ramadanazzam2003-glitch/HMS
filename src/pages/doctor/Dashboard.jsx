import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { calcEndTime } from '../../utils/booking'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle, Stethoscope } from 'lucide-react' // ✅ حذف Clock
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth() // ✅ حذف profile من هنا لأنه غير مستخدم
  const { t, isRTL } = useLanguage()

  const [doctor, setDoctor] = useState(null)
  const [todayBookings, setTodayBookings] = useState([])
  const [stats, setStats] = useState({ today: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {

      // ✅ التعديل الأول: جلب profile عبر auth user id أولاً
    const { data: doctorData } = await supabase
  .from('doctors')
  .select('*')
  .eq('user_id', user?.id)
  .single()
  
      if (ignore || !doctorData) { setLoading(false); return }
      setDoctor(doctorData)

      const today = new Date().toISOString().slice(0, 10)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, departments(name_en, name_ar)')
        .eq('doctor_id', doctorData.id)
        .eq('booking_date', today)
        .order('slot_time', { ascending: true })

      if (!ignore) {
        const all = bookings || []
        setTodayBookings(all)
        setStats({
          today: all.length,
          active: all.filter(b => b.status === 'active').length,
          completed: all.filter(b => b.status === 'completed').length,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const handleComplete = async (id) => {
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id)
    setTodayBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b))
    setStats(prev => ({ ...prev, active: prev.active - 1, completed: prev.completed + 1 }))
  }

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-surface border border-border p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-surface border border-border p-6">
          <Skeleton className="h-5 w-40 mb-5" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
        {/* ✅ هنا — قبل motion.div مباشرة */}
      <div className="mb-4">
        <h1 className="font-display text-xl font-bold text-txt-primary">
          {t.welcome}, {doctor?.name}
        </h1>
      </div>
    
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl bg-surface border border-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={18} className="text-txt-muted" />
              <p className="text-xs font-medium text-txt-muted">{t.todaysAppointments}</p>
            </div>
            <p className="font-display text-3xl font-extrabold text-txt-primary">{stats.today}</p>
          </div>
          <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope size={18} className="text-success" />
              <p className="text-xs font-medium text-success">{t.active}</p>
            </div>
            <p className="font-display text-3xl font-extrabold text-success">{stats.active}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-primary" />
              <p className="text-xs font-medium text-primary">{t.completed}</p>
            </div>
            <p className="font-display text-3xl font-extrabold text-primary">{stats.completed}</p>
          </div>
        </div>
      </motion.div>

      <div className="rounded-2xl bg-surface border border-border p-6 mb-6">
        <h2 className="font-display text-base font-bold text-txt-primary mb-5">{t.todaySchedule}</h2>

        {todayBookings.length === 0 ? (
          <p className="text-txt-muted text-center py-8">{t.noAppointments}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayBookings.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-hover border border-border">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-center min-w-[50px] sm:min-w-[56px]">
                    <p className="text-sm font-bold text-primary">{b.slot_time}</p>
                    <p className="text-xs text-txt-muted">{calcEndTime(b.slot_time)}</p>
                  </div>
                  <div className="border-s border-border ps-3 sm:ps-4 min-w-0 flex-1">
                    <p className="font-bold text-txt-primary text-sm truncate">{b.patient_name}</p>
                    <p className="text-xs text-txt-muted">{b.phone} · #{b.queue_number}</p>
                    <p className="text-xs text-txt-muted truncate">{isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                    {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                  </Badge>
                  {b.status === 'active' && (
                    <Button variant="primary" size="sm" onClick={() => navigate(`/doctor/consultation/${b.id}`)}>
                      {t.consult}
                    </Button>
                  )}
                  {b.status === 'active' && (
                    <Button variant="ghost" size="sm" className="text-success text-xs" onClick={() => handleComplete(b.id)}>
                      {t.done}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
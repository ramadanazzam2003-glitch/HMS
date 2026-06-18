import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, ClipboardCheck, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function ReceptionistDashboard() {
  const navigate = useNavigate()
  const { t, isRTL } = useLanguage()

  const [stats, setStats] = useState({ today: 0, waiting: 0, completed: 0 })
  const [todayBookings, setTodayBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en, name_ar)')
        .eq('booking_date', today)
        .order('slot_time')

      if (!ignore) {
        const all = data || []
        setTodayBookings(all)
        setStats({
          today: all.length,
          waiting: all.filter(b => b.status === 'active').length,
          completed: all.filter(b => b.status === 'completed').length,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.receptionDesk}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'إدارة مواعيد الاستقبال' : 'Manage reception appointments'}</p>
          </div>
          <Button size="sm" onClick={() => navigate('/receptionist/walk-in')}>
            <UserPlus size={14} /> {t.walkInBooking}
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t.todaysAppointments, value: stats.today, color: 'bg-surface', textColor: 'text-txt-primary', labelColor: 'text-txt-muted' },
                { label: t.waiting, value: stats.waiting, color: 'bg-amber-50', textColor: 'text-amber-600', labelColor: 'text-amber-600' },
                { label: t.completed, value: stats.completed, color: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600' },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-border/50`}>
                  <p className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.textColor}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <UserPlus size={24} className="text-primary" />, label: t.walkInBooking, sub: t.bookForPatient, path: '/receptionist/walk-in' },
                { icon: <Users size={24} className="text-secondary" />, label: t.patientDirectory, sub: t.searchPatients, path: '/receptionist/patients' },
                { icon: <ClipboardCheck size={24} className="text-green-500" />, label: t.checkInOut, sub: t.manageArrivals, path: '/receptionist/check-in-out' },
                { icon: <CalendarDays size={24} className="text-blue-500" />, label: t.allBookings, sub: t.viewAllAppointments, path: '/dashboard/bookings' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="rounded-2xl p-5 bg-surface border border-border hover:border-primary-border hover:shadow-md transition-all duration-200 text-center flex flex-col items-center cursor-pointer"
                >
                  {item.icon}
                  <p className="font-semibold text-txt-primary text-sm mt-2">{item.label}</p>
                  <p className="text-xs text-txt-muted mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>

            {/* Today's Queue */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-txt-primary">{t.todaysQueue} ({todayBookings.length})</h2>
                  <button onClick={() => navigate('/receptionist/check-in-out')} className="text-xs font-semibold text-primary hover:underline">
                    {t.manage} &rarr;
                  </button>
                </div>
                {todayBookings.length === 0 ? (
                  <p className="text-txt-muted text-center py-8">{t.noAppointmentsToday}</p>
                ) : (
                  <div className="space-y-2">
                    {todayBookings.slice(0, 8).map((b, i) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 bg-surface-hover rounded-xl animate-fadeIn"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-sm font-bold text-primary">{b.slot_time}</p>
                          </div>
                          <div className="border-s border-border ps-3">
                            <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                            <p className="text-xs text-txt-muted">
                              {b.doctors?.name} &middot; {isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}
                            </p>
                          </div>
                        </div>
                        <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                          {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                        </Badge>
                      </div>
                    ))}
                    {todayBookings.length > 8 && (
                      <p className="text-xs text-txt-muted text-center">+{todayBookings.length - 8} {t.more}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

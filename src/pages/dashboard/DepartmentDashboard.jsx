import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Users, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function DepartmentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t, isRTL } = useLanguage()
  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const { data: depts } = await supabase.from('departments').select('*').order('name_en')
      const dept = depts?.[0]
      if (!dept || ignore) { setLoading(false); return }
      setDepartment(dept)

      const { data: docs } = await supabase.from('doctors').select('*, departments(name_en, name_ar)')
        .eq('department_id', dept.id).order('name')

      const { data: bks } = await supabase.from('bookings').select('*, doctors(name), departments(name_en, name_ar)')
        .eq('department_id', dept.id)
        .gte('booking_date', today)
        .order('slot_time')

      if (!ignore) {
        setDoctors(docs || [])
        setBookings(bks || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const stats = {
    todayBookings: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    doctors: doctors.length,
    activeDoctors: doctors.filter(d => d.is_active).length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">
              {isRTL ? (department?.name_ar || department?.name_en || t.departmentDashboard) : (department?.name_en || t.departmentDashboard)}
            </h1>
            <p className="text-txt-muted text-sm mt-1">{t.departmentDashboard}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t.todaysBookings, value: stats.todayBookings, color: 'bg-surface', textColor: 'text-txt-primary', labelColor: 'text-txt-muted' },
                { label: t.active, value: stats.active, color: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600' },
                { label: t.completed, value: stats.completed, color: 'bg-blue-50', textColor: 'text-blue-600', labelColor: 'text-blue-600' },
                { label: t.doctors, value: `${stats.activeDoctors}/${stats.doctors}`, color: 'bg-purple-50', textColor: 'text-purple-600', labelColor: 'text-purple-600' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className={`${s.color} rounded-2xl p-5 border border-border/50`}
                >
                  <p className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.textColor}`}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4 flex items-center gap-2">
                    <Users size={16} /> {t.departmentStaff}
                  </h2>
                  {doctors.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">{t.noDoctorsAssigned}</p>
                  ) : (
                    <div className="space-y-2">
                      {doctors.map((doc, i) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-hover rounded-xl"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-txt-primary text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-txt-muted capitalize truncate">{doc.type} &middot; {doc.working_days?.length || 0} {t.daysPerWeek}</p>
                          </div>
                          <Badge variant={doc.is_active ? 'success' : 'danger'} className="shrink-0">
                            {doc.is_active ? t.active : t.inactive}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4 flex items-center gap-2">
                    <CalendarDays size={16} /> {t.todaySchedule}
                  </h2>
                  {bookings.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">{t.noBookingsToday}</p>
                  ) : (
                    <div className="space-y-2">
                      {bookings.map((b, i) => (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-hover rounded-xl"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-txt-primary text-sm truncate">{b.patient_name}</p>
                            <p className="text-xs text-txt-muted truncate">{b.slot_time} &middot; {b.doctors?.name}</p>
                          </div>
                          <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'} className="shrink-0">
                            {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

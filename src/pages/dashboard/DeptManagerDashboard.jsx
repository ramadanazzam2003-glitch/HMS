import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function DeptManagerDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t, isRTL } = useLanguage()

  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [todayBookings, setTodayBookings] = useState([])
  const [stats, setStats] = useState({ today: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const { data: depts } = await supabase.from('departments').select('*').order('name_en')
      const dept = depts?.[0]
      if (!dept || ignore) { setLoading(false); return }
      setDepartment(dept)

      const [docsRes, bksRes] = await Promise.all([
        supabase.from('doctors').select('*, departments(name_en, name_ar)').eq('department_id', dept.id).order('name'),
        supabase.from('bookings').select('*, doctors(name), departments(name_en, name_ar)').eq('department_id', dept.id).eq('booking_date', today).order('slot_time'),
      ])

      if (ignore) return

      const allDocs = docsRes.data || []
      const allBks = bksRes.data || []

      setDoctors(allDocs)
      setTodayBookings(allBks)
      setStats({
        today: allBks.length,
        active: allBks.filter(b => b.status === 'active').length,
        completed: allBks.filter(b => b.status === 'completed').length,
      })
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">
              {isRTL ? (department?.name_ar || department?.name_en || t.deptManagerDashboard) : (department?.name_en || t.deptManagerDashboard)}
            </h1>
            <p className="text-txt-muted text-sm mt-1">{t.deptManagerDashboard}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/bookings')}>{t.allBookings}</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/medical-records')}>{t.records}</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t.todaysBookings, value: stats.today, color: 'bg-surface', textColor: 'text-txt-primary', labelColor: 'text-txt-muted' },
                { label: t.active, value: stats.active, color: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600' },
                { label: t.completed, value: stats.completed, color: 'bg-blue-50', textColor: 'text-blue-600', labelColor: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-border/50`}>
                  <p className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.textColor}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4">{t.departmentStaff} ({doctors.length})</h2>
                  {doctors.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">{t.noDoctorsAssigned}</p>
                  ) : (
                    <div className="space-y-2">
                      {doctors.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl">
                          <div>
                            <p className="font-semibold text-txt-primary text-sm">{doc.name}</p>
                            <p className="text-xs text-txt-muted capitalize">{doc.type} &middot; {doc.working_days?.length || 0} {t.daysPerWeek}</p>
                          </div>
                          <Badge variant={doc.is_active ? 'success' : 'danger'}>
                            {doc.is_active ? t.active : t.inactive}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4">{t.todaySchedule}</h2>
                  {todayBookings.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">{t.noBookingsToday}</p>
                  ) : (
                    <div className="space-y-2">
                      {todayBookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl">
                          <div>
                            <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                            <p className="text-xs text-txt-muted">{b.slot_time} &middot; {b.doctors?.name}</p>
                          </div>
                          <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                            {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/dashboard/bookings')}>{t.allBookingsAction}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/medical-records')}>{t.medicalRecords}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/analytics')}>{t.analytics}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/billing')}>{t.billing}</Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

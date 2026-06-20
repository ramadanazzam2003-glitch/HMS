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

export default function DirectorDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t, isRTL } = useLanguage()

  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0, unpaid: 0 })
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const [bookingsRes, billsRes, deptsRes, docsRes] = await Promise.all([
        supabase.from('bookings').select('*, departments(name_en, name_ar)'),
        supabase.from('bills').select('total, payment_status'),
        supabase.from('departments').select('*'),
        supabase.from('doctors').select('*, departments(name_en, name_ar)'),
      ])

      if (ignore) return

      const allBookings = bookingsRes.data || []
      const allBills = billsRes.data || []
      const allDepts = deptsRes.data || []
      const allDocs = docsRes.data || []

      const deptMap = {}
      allBookings.forEach(b => {
        const name = isRTL ? (b.departments?.name_ar || b.departments?.name_en || 'Unknown') : (b.departments?.name_en || 'Unknown')
        if (!deptMap[name]) deptMap[name] = { name, total: 0, active: 0, completed: 0 }
        deptMap[name].total++
        if (b.status === 'active') deptMap[name].active++
        if (b.status === 'completed') deptMap[name].completed++
      })

      setStats({
        total: allBookings.length,
        active: allBookings.filter(b => b.status === 'active').length,
        completed: allBookings.filter(b => b.status === 'completed').length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length,
        revenue: allBills.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
        unpaid: allBills.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0),
      })
      setDepartments(Object.values(deptMap))
      setDoctors(allDocs)
      setRecentBookings(allBookings.slice(0, 10))
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [isRTL])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.directorDashboard}</h1>
            {profile?.full_name && <p className="text-txt-muted text-sm mt-1">{profile.full_name}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/analytics')}>{t.analytics}</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/admin')}>{t.users}</Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t.totalBookings, value: stats.total, color: 'bg-surface', textColor: 'text-txt-primary', labelColor: 'text-txt-muted' },
                { label: t.revenue, value: `EGP ${stats.revenue.toFixed(0)}`, color: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600' },
                { label: t.unpaid, value: `EGP ${stats.unpaid.toFixed(0)}`, color: 'bg-red-50', textColor: 'text-red-600', labelColor: 'text-red-600' },
                { label: t.doctors, value: `${doctors.filter(d => d.is_active).length}/${doctors.length}`, color: 'bg-blue-50', textColor: 'text-blue-600', labelColor: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-2xl p-5 border border-border/50`}>
                  <p className={`text-xs font-semibold ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.textColor}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Department Performance */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4">{t.departmentPerformance}</h2>
                  {departments.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">{t.noData}</p>
                  ) : (
                    <div className="space-y-4">
                      {departments.map(dept => (
                        <div key={dept.name}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium text-txt-primary">{dept.name}</span>
                            <span className="text-txt-muted">{dept.completed}/{dept.total}</span>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staff Overview */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-4">{t.staffOverview}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {['doctor', 'consultant'].map(type => {
                      const count = doctors.filter(d => d.type === type).length
                      const active = doctors.filter(d => d.type === type && d.is_active).length
                      return (
                        <div key={type} className="bg-surface-hover rounded-xl p-4 text-center">
                          <p className="text-2xl font-extrabold text-txt-primary">{active}/{count}</p>
                          <p className="text-xs text-txt-muted capitalize">{type === 'doctor' ? t.doctors : t.consultants}</p>
                        </div>
                      )
                    })}
                    {departments.map(dept => (
                      <div key={dept.name} className="bg-surface-hover rounded-xl p-4 text-center">
                        <p className="text-2xl font-extrabold text-txt-primary">{dept.total}</p>
                        <p className="text-xs text-txt-muted truncate">{dept.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-txt-primary">{t.recentBookings}</h2>
                  <button onClick={() => navigate('/dashboard/bookings')} className="text-xs font-semibold text-primary hover:underline">{t.viewAllAction}</button>
                </div>
                {recentBookings.length === 0 ? (
                  <p className="text-txt-muted text-center py-6 text-sm">{t.noData}</p>
                ) : (
                  <div className="space-y-2">
                    {recentBookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-2 p-3 bg-surface-hover rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-txt-primary text-sm truncate">{b.patient_name}</p>
                          <p className="text-xs text-txt-muted truncate">
                            {isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en} &middot; {b.booking_date} &middot; {b.slot_time}
                          </p>
                        </div>
                        <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'} className="shrink-0">
                          {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/dashboard/analytics')}>{t.analytics}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/admin')}>{t.usersAndRoles}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/audit-log')}>{t.auditLog}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/billing')}>{t.billing}</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard/settings')}>{t.settings}</Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'

export default function Analytics() {
  const { t, isRTL } = useLanguage()
  const [stats, setStats] = useState({
    total: 0, active: 0, completed: 0, cancelled: 0,
    todayTotal: 0, todayActive: 0,
    revenue: 0, unpaid: 0,
    departments: [],
    dailyTrend: [],
  })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: bookings } = await supabase.from('bookings').select('*, departments(name_en, name_ar)')
      const { data: bills } = await supabase.from('bills').select('total, payment_status')

      if (ignore) return

      const today = new Date().toISOString().slice(0, 10)
      const allBookings = bookings || []

      let filteredBookings = allBookings
      if (period === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        filteredBookings = allBookings.filter(b => new Date(b.created_at) >= weekAgo)
      } else if (period === 'month') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1)
        filteredBookings = allBookings.filter(b => new Date(b.created_at) >= monthAgo)
      }

      const todayBookings = allBookings.filter(b => b.booking_date === today)

      const deptMap = {}
      filteredBookings.forEach(b => {
        const name = isRTL ? (b.departments?.name_ar || b.departments?.name_en || 'Unknown') : (b.departments?.name_en || 'Unknown')
        if (!deptMap[name]) deptMap[name] = { total: 0, active: 0, completed: 0 }
        deptMap[name].total++
        if (b.status === 'active') deptMap[name].active++
        if (b.status === 'completed') deptMap[name].completed++
      })

      const dailyMap = {}
      filteredBookings.forEach(b => {
        const date = b.booking_date
        if (!dailyMap[date]) dailyMap[date] = { date, total: 0, completed: 0 }
        dailyMap[date].total++
        if (b.status === 'completed') dailyMap[date].completed++
      })

      const allBills = bills || []
      const revenue = allBills.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
      const unpaid = allBills.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0)

      setStats({
        total: filteredBookings.length,
        active: filteredBookings.filter(b => b.status === 'active').length,
        completed: filteredBookings.filter(b => b.status === 'completed').length,
        cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
        todayTotal: todayBookings.length,
        todayActive: todayBookings.filter(b => b.status === 'active').length,
        revenue, unpaid,
        departments: Object.entries(deptMap).map(([name, data]) => ({ name, ...data })),
        dailyTrend: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-7),
      })
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [period, isRTL])

  const periodLabels = { all: t.allTimePeriod, week: t.thisWeek, month: t.thisMonth }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{isRTL ? 'التحليلات والتقارير' : 'Analytics & Reports'}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'إحصائيات شاملة للأداء' : 'Comprehensive performance statistics'}</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {['all', 'week', 'month'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-9 px-5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                period === p
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
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
                { label: t.totalBookings, value: stats.total, color: 'bg-surface', textColor: 'text-txt-primary', labelColor: 'text-txt-muted', icon: <BarChart3 size={18} className="text-txt-muted" /> },
                { label: t.completed, value: stats.completed, color: 'bg-green-50', textColor: 'text-green-600', labelColor: 'text-green-600', icon: <TrendingUp size={18} className="text-green-500" /> },
                { label: t.todaysBookings, value: stats.todayTotal, color: 'bg-blue-50', textColor: 'text-blue-600', labelColor: 'text-blue-600', icon: <CalendarDays size={18} className="text-blue-500" /> },
                { label: t.cancelledBookings, value: stats.cancelled, color: 'bg-red-50', textColor: 'text-red-600', labelColor: 'text-red-600', icon: <BarChart3 size={18} className="text-red-500" /> },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className={`${s.color} rounded-2xl p-5 border border-border/50`}
                >
                  {s.icon}
                  <p className={`text-xs font-semibold mt-3 ${s.labelColor}`}>{s.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${s.textColor}`}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-green-50 rounded-2xl p-5 border border-green-200/50"
              >
                <p className="text-xs font-semibold text-green-600 flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} /> {t.totalRevenue}
                </p>
                <p className="text-3xl font-extrabold text-green-600">EGP {stats.revenue.toFixed(2)}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="bg-red-50 rounded-2xl p-5 border border-red-200/50"
              >
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} /> {t.totalUnpaid}
                </p>
                <p className="text-3xl font-extrabold text-red-600">EGP {stats.unpaid.toFixed(2)}</p>
              </motion.div>
            </div>

            {/* Department Performance */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-base font-bold text-txt-primary mb-5">{t.departmentPerformanceSection}</h2>
                {stats.departments.length === 0 ? (
                  <p className="text-txt-muted text-center py-6">{t.noData}</p>
                ) : (
                  <div className="space-y-4">
                    {stats.departments.map(dept => (
                      <div key={dept.name}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-txt-primary">{dept.name}</span>
                          <span className="text-txt-muted">{dept.completed} {t.completedSmall} / {dept.total} {t.totalSmall}</span>
                        </div>
                        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Trend */}
            {stats.dailyTrend.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-bold text-txt-primary mb-5">{t.dailyTrendLast7}</h2>
                  <div className="flex items-end gap-2 h-32">
                    {stats.dailyTrend.map((d, i) => {
                      const maxVal = Math.max(...stats.dailyTrend.map(x => x.total), 1)
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[10px] text-txt-muted font-medium">{d.total}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(d.total / maxVal) * 100}%`, minHeight: 6 }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="w-full bg-primary rounded-t-md"
                          />
                          <span className="text-[10px] text-txt-muted">{d.date.slice(5)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Analytics() {
  const navigate = useNavigate()
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

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.analyticsReports} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  const periodLabels = { all: t.allTimePeriod, week: t.thisWeek, month: t.thisMonth }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.analyticsReports} />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['all', 'week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`btn btn-md`}
                style={{
                  background: period === p ? 'var(--primary)' : 'var(--surface)',
                  color: period === p ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${period === p ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: t.totalBookings, value: stats.total, icon: <BarChart3 size={16} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
              { label: t.completed, value: stats.completed, icon: <TrendingUp size={16} style={{ color: 'var(--success)', marginBottom: 4 }} />, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
              { label: t.todaysBookings, value: stats.todayTotal, icon: <CalendarDays size={16} style={{ color: 'var(--primary)', marginBottom: 4 }} />, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--primary)', labelColor: 'var(--primary)' },
              { label: t.cancelledBookings, value: stats.cancelled, icon: <BarChart3 size={16} style={{ color: 'var(--danger)', marginBottom: 4 }} />, color: 'var(--danger-light)', borderColor: 'var(--danger-border)', textColor: 'var(--danger)', labelColor: 'var(--danger)' },
            ].map((s, i) => (
              <motion.div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
                {s.icon}
                <p style={{ fontSize: 12, color: s.labelColor, marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.textColor }}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <motion.div className="stat-card" style={{ background: 'var(--success-light)', borderColor: 'var(--success-border)' }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <p style={{ fontSize: 12, color: 'var(--success)', marginBottom: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} /> {t.totalRevenue}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>EGP {stats.revenue.toFixed(2)}</p>
            </motion.div>
            <motion.div className="stat-card" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
              <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} /> {t.totalUnpaid}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>EGP {stats.unpaid.toFixed(2)}</p>
            </motion.div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{t.departmentPerformanceSection}</h2>
            {stats.departments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>{t.noData}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stats.departments.map(dept => (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{dept.completed} {t.completedSmall} / {dept.total} {t.totalSmall}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 999, width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.dailyTrend.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{t.dailyTrendLast7}</h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 128 }}>
                {stats.dailyTrend.map((d, i) => {
                  const maxVal = Math.max(...stats.dailyTrend.map(x => x.total), 1)
                  return (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.total}</span>
                      <motion.div
                        style={{ width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.total / maxVal) * 100}%`, minHeight: 4 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

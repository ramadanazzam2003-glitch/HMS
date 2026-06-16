import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function Analytics() {
  const navigate = useNavigate()
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
      const { data: bookings } = await supabase.from('bookings').select('*, departments(name_en)')
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
        const name = b.departments?.name_en || 'Unknown'
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
  }, [period])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Analytics" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Analytics & Reports" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-2 mb-6">
            {['all', 'week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`btn btn-md capitalize ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Bookings', value: stats.total, cardClass: 'card p-5', labelClass: 'text-gray-400', valueClass: 'text-gray-800', icon: <BarChart3 size={16} className="text-gray-400 mb-1" /> },
              { label: 'Completed', value: stats.completed, cardClass: 'card p-5 bg-green-50 border-green-200', labelClass: 'text-green-600', valueClass: 'text-green-600', icon: <TrendingUp size={16} className="text-green-600 mb-1" /> },
              { label: 'Today', value: stats.todayTotal, cardClass: 'card p-5 bg-blue-50 border-blue-200', labelClass: 'text-blue-600', valueClass: 'text-blue-600', icon: <CalendarDays size={16} className="text-blue-600 mb-1" /> },
              { label: 'Cancelled', value: stats.cancelled, cardClass: 'card p-5 bg-red-50 border-red-200', labelClass: 'text-red-500', valueClass: 'text-red-500', icon: <BarChart3 size={16} className="text-red-500 mb-1" /> },
            ].map((s, i) => (
              <motion.div key={s.label} className={s.cardClass} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} whileHover={{ scale: 1.02 }}>
                {s.icon}
                <p className={`text-xs ${s.labelClass} mb-1`}>{s.label}</p>
                <p className={`font-display text-3xl font-extrabold ${s.valueClass}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <motion.div className="card p-5 bg-green-50 border-green-200" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} whileHover={{ scale: 1.02 }}>
              <p className="text-xs text-green-600 mb-1 flex items-center gap-1"><DollarSign size={14} /> Total Revenue</p>
              <p className="font-display text-3xl font-extrabold text-green-600">EGP {stats.revenue.toFixed(2)}</p>
            </motion.div>
            <motion.div className="card p-5 bg-red-50 border-red-200" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} whileHover={{ scale: 1.02 }}>
              <p className="text-xs text-red-500 mb-1 flex items-center gap-1"><DollarSign size={14} /> Total Unpaid</p>
              <p className="font-display text-3xl font-extrabold text-red-500">EGP {stats.unpaid.toFixed(2)}</p>
            </motion.div>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-5">Department Performance</h2>
            {stats.departments.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No data</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.departments.map(dept => (
                  <div key={dept.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-700 font-medium">{dept.name}</span>
                      <span className="text-gray-400">{dept.completed} completed / {dept.total} total</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.dailyTrend.length > 0 && (
            <div className="card p-6">
              <h2 className="font-display text-base font-bold text-gray-900 mb-5">Daily Trend (Last 7 Days)</h2>
              <div className="flex items-end gap-2 h-32">
                {stats.dailyTrend.map((d, i) => {
                  const maxVal = Math.max(...stats.dailyTrend.map(x => x.total), 1)
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400">{d.total}</span>
                      <motion.div
                        className="w-full bg-blue-600 rounded-t"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.total / maxVal) * 100}%`, minHeight: 4 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                      <span className="text-[10px] text-gray-400">{d.date.slice(5)}</span>
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

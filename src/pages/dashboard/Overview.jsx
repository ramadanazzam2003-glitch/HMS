import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, Building2, Users, FileText, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'

export default function Overview() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [stats, setStats]   = useState({ total: 0, active: 0, cancelled: 0, departments: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, department_id, departments(name_en)')

      const total     = bookings?.length || 0
      const active    = bookings?.filter(b => b.status === 'active').length || 0
      const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0

      const deptMap = {}
      bookings?.forEach(b => {
        const name = b.departments?.name_en || 'Unknown'
        if (!deptMap[name]) deptMap[name] = { total: 0, active: 0 }
        deptMap[name].total++
        if (b.status === 'active') deptMap[name].active++
      })

      setStats({
        total, active, cancelled,
        departments: Object.entries(deptMap).map(([name, data]) => ({ name, ...data }))
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle="Hospital Dashboard" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading…</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={`Hospital Dashboard${profile?.full_name ? ` — ${profile.full_name}` : ''}`}
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Bookings', value: stats.total, sub: 'All time', cardClass: 'card p-6', textClass: 'text-gray-800', subClass: 'text-gray-400' },
              { label: 'Active Bookings', value: stats.active, sub: 'Currently active', cardClass: 'card p-6 bg-green-50 border-green-200', textClass: 'text-green-600', subClass: 'text-green-600' },
              { label: 'Cancelled', value: stats.cancelled, sub: 'Total cancelled', cardClass: 'card p-6 bg-red-50 border-red-200', textClass: 'text-red-500', subClass: 'text-red-500' },
            ].map((s, i) => (
              <motion.div key={s.label} className={s.cardClass} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} whileHover={{ scale: 1.02 }}>
                <p className={`text-xs ${s.subClass} mb-2`}>{s.label}</p>
                <p className={`font-display text-5xl font-extrabold ${s.textClass} leading-none`}>{s.value}</p>
                <p className={`text-xs ${s.subClass} mt-1.5 opacity-70`}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="card p-6 mb-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-5">Bookings by Department</h2>
            {stats.departments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No bookings yet</p>
            ) : (
              <div className="flex flex-col gap-4">
                {stats.departments.map((dept, i) => (
                  <motion.div key={dept.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-700 font-medium">{dept.name}</span>
                      <span className="text-gray-400">{dept.active} active / {dept.total} total</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((dept.active / Math.max(dept.total, 1)) * 100, 100)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-primary btn-md"><CalendarDays size={16} className="mr-1.5" /> View All Bookings</button>
            <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-secondary btn-md"><FileText size={16} className="mr-1.5" /> Medical Records</button>
            <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md"><CreditCard size={16} className="mr-1.5" /> Billing</button>
            <button onClick={() => navigate('/')} className="btn btn-secondary btn-md"><Building2 size={16} className="mr-1.5" /> Patient Portal</button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

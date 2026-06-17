import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, Building2, Users, FileText, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Overview() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { t, isRTL } = useLanguage()

  const [stats, setStats]   = useState({ total: 0, active: 0, cancelled: 0, departments: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('status, department_id, departments(name_en, name_ar)')

      const total     = bookings?.length || 0
      const active    = bookings?.filter(b => b.status === 'active').length || 0
      const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0

      const deptMap = {}
      bookings?.forEach(b => {
        const name = isRTL ? (b.departments?.name_ar || b.departments?.name_en || 'Unknown') : (b.departments?.name_en || 'Unknown')
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
  }, [isRTL])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle={t.hospitalDashboard} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t.loading}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={`${t.hospitalDashboard}${profile?.full_name ? ` — ${profile.full_name}` : ''}`}
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: t.totalBookings, value: stats.total, sub: t.allTime, icon: <BarChart3 size={18} style={{ color: 'var(--primary)' }} />, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--text-primary)' },
              { label: t.activeBookings, value: stats.active, sub: t.currentlyActive, icon: <CalendarDays size={18} style={{ color: 'var(--success)' }} />, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)' },
              { label: t.cancelledBookings, value: stats.cancelled, sub: t.totalCancelled, icon: <BarChart3 size={18} style={{ color: 'var(--danger)' }} />, color: 'var(--danger-light)', borderColor: 'var(--danger-border)', textColor: 'var(--danger)' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                style={{ background: s.color, borderColor: s.borderColor }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                  {s.icon}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: s.textColor, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{t.bookingsByDepartment}</h2>
            {stats.departments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>{t.noBookingsYet}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stats.departments.map((dept, i) => (
                  <motion.div key={dept.name} initial={{ opacity: 0, x: isRTL ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{dept.active} {t.activeSmall} / {dept.total} {t.totalSmall}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', background: 'var(--primary)', borderRadius: 999 }}
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

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-primary btn-md">
              <CalendarDays size={16} className={isRTL ? 'flip-rtl' : ''} /> {t.viewAllBookings}
            </button>
            <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-secondary btn-md">
              <FileText size={16} className={isRTL ? 'flip-rtl' : ''} /> {t.medicalRecords}
            </button>
            <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md">
              <CreditCard size={16} className={isRTL ? 'flip-rtl' : ''} /> {t.billing}
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary btn-md">
              <Building2 size={16} className={isRTL ? 'flip-rtl' : ''} /> {t.patientPortal}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

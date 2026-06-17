import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { calcEndTime } from '../../utils/booking'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, CheckCircle, Stethoscope } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { t, isRTL } = useLanguage()

  const [doctor, setDoctor] = useState(null)
  const [todayBookings, setTodayBookings] = useState([])
  const [stats, setStats] = useState({ today: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
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
    <div className="page">
      <Navbar variant="dashboard" subtitle={t.doctorDashboard} />
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
        subtitle={`Dr. ${doctor?.name || profile?.full_name || ''}`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm">{t.back}</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: t.todaysAppointments, value: stats.today, icon: <CalendarDays size={18} style={{ color: 'var(--text-muted)' }} />, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
              { label: t.active, value: stats.active, icon: <Stethoscope size={18} style={{ color: 'var(--success)' }} />, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
              { label: t.completed, value: stats.completed, icon: <CheckCircle size={18} style={{ color: 'var(--primary)' }} />, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--primary)', labelColor: 'var(--primary)' },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {s.icon}
                  <p style={{ fontSize: 12, color: s.labelColor, fontWeight: 500 }}>{s.label}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: s.textColor }}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>{t.todaySchedule}</h2>

          {todayBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>{t.noAppointments}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayBookings.map(b => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--surface-hover)', borderRadius: 12, border: '1px solid var(--border)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'center', minWidth: 56 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{b.slot_time}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{calcEndTime(b.slot_time)}</p>
                    </div>
                    <div style={{ borderInlineStart: '1px solid var(--border)', paddingInlineStart: 16 }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{b.patient_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.phone} · #{b.queue_number}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                      {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                    </span>
                    {b.status === 'active' && (
                      <button onClick={() => navigate(`/doctor/consultation/${b.id}`)} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
                        {t.consult}
                      </button>
                    )}
                    {b.status === 'active' && (
                      <button onClick={() => handleComplete(b.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--success)', fontSize: 12 }}>
                        {t.done}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

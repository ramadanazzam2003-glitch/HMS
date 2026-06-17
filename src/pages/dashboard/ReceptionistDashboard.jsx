import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, ClipboardCheck, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useLanguage } from '../../contexts/LanguageContext'

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

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle={t.receptionDesk} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={t.receptionDesk}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/receptionist/walk-in')} className="btn btn-primary btn-sm">
              <UserPlus size={14} /> {t.walkInBooking}
            </button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: t.todaysAppointments, value: stats.today, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
            { label: t.waiting, value: stats.waiting, color: 'var(--warning-light)', borderColor: 'var(--warning-border)', textColor: 'var(--warning)', labelColor: 'var(--warning)' },
            { label: t.completed, value: stats.completed, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}>
              <p style={{ fontSize: 12, color: s.labelColor, marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.textColor }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <UserPlus size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />, label: t.walkInBooking, sub: t.bookForPatient, path: '/receptionist/walk-in' },
            { icon: <Users size={24} style={{ color: 'var(--secondary)', marginBottom: 8 }} />, label: t.patientDirectory, sub: t.searchPatients, path: '/receptionist/patients' },
            { icon: <ClipboardCheck size={24} style={{ color: 'var(--success)', marginBottom: 8 }} />, label: t.checkInOut, sub: t.manageArrivals, path: '/receptionist/check-in-out' },
            { icon: <CalendarDays size={24} style={{ color: 'var(--info)', marginBottom: 8 }} />, label: t.allBookings, sub: t.viewAllAppointments, path: '/dashboard/bookings' },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 150ms ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-border)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
            >
              {item.icon}
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{item.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</p>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {t.todaysQueue} ({todayBookings.length})
            </h2>
            <button onClick={() => navigate('/receptionist/check-in-out')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              {t.manage} →
            </button>
          </div>
          {todayBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>{t.noAppointmentsToday}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayBookings.slice(0, 8).map((b, i) => (
                <div key={b.id} className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12, animationDelay: `${i * 30}ms` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'center', minWidth: 50 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{b.slot_time}</p>
                    </div>
                    <div style={{ borderInlineStart: '1px solid var(--border)', paddingInlineStart: 12 }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{b.patient_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {b.doctors?.name} · {isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                    {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                  </span>
                </div>
              ))}
              {todayBookings.length > 8 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>+{todayBookings.length - 8} {t.more}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

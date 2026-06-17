import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Users, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'

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

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.departmentDashboard} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={isRTL ? (department?.name_ar || department?.name_en || t.departmentDashboard) : (department?.name_en || t.departmentDashboard)} />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: t.todaysBookings, value: stats.todayBookings, icon: <CalendarDays size={16} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
              { label: t.active, value: stats.active, icon: <Stethoscope size={16} style={{ color: 'var(--success)', marginBottom: 4 }} />, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
              { label: t.completed, value: stats.completed, icon: <Building2 size={16} style={{ color: 'var(--primary)', marginBottom: 4 }} />, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--primary)', labelColor: 'var(--primary)' },
              { label: t.doctors, value: `${stats.activeDoctors}/${stats.doctors}`, icon: <Users size={16} style={{ color: 'var(--secondary)', marginBottom: 4 }} />, color: 'var(--secondary-light)', borderColor: 'var(--secondary-border)', textColor: 'var(--secondary)', labelColor: 'var(--secondary)' },
            ].map((s, i) => (
              <motion.div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
                {s.icon}
                <p style={{ fontSize: 12, color: s.labelColor, marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.textColor }}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} /> {t.departmentStaff}
              </h2>
              {doctors.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noDoctorsAssigned}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doctors.map((doc, i) => (
                    <motion.div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12 }}
                      initial={{ opacity: 0, x: isRTL ? 8 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{doc.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{doc.type} · {doc.working_days?.length || 0} {t.daysPerWeek}</p>
                      </div>
                      <span className={`badge ${doc.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {doc.is_active ? t.active : t.inactive}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={16} /> {t.todaySchedule}
              </h2>
              {bookings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noBookingsToday}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bookings.map((b, i) => (
                    <motion.div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12 }}
                      initial={{ opacity: 0, x: isRTL ? 8 : -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{b.patient_name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.slot_time} · {b.doctors?.name}</p>
                      </div>
                      <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                        {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

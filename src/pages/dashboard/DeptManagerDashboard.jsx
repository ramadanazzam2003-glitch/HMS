import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'

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

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle={t.deptManagerDashboard} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={isRTL ? (department?.name_ar || department?.name_en || t.deptManagerDashboard) : (department?.name_en || t.deptManagerDashboard)}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-ghost btn-sm">{t.allBookings}</button>
            <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-ghost btn-sm">{t.records}</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: t.todaysBookings, value: stats.today, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
            { label: t.active, value: stats.active, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
            { label: t.completed, value: stats.completed, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--primary)', labelColor: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}>
              <p style={{ fontSize: 12, color: s.labelColor, marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.textColor }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              {t.departmentStaff} ({doctors.length})
            </h2>
            {doctors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noDoctorsAssigned}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {doctors.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{doc.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{doc.type} · {doc.working_days?.length || 0} {t.daysPerWeek}</p>
                    </div>
                    <span className={`badge ${doc.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {doc.is_active ? t.active : t.inactive}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{t.todaySchedule}</h2>
            {todayBookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noBookingsToday}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayBookings.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{b.patient_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.slot_time} · {b.doctors?.name}</p>
                    </div>
                    <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                      {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-primary btn-md">{t.allBookingsAction}</button>
          <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-secondary btn-md">{t.medicalRecords}</button>
          <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-secondary btn-md">{t.analytics}</button>
          <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md">{t.billing}</button>
        </div>
      </div>
    </div>
  )
}

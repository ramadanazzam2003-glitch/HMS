import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'

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

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle={t.directorDashboard} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={`${t.directorDashboard}${profile?.full_name ? ` — ${profile.full_name}` : ''}`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-ghost btn-sm">{t.analytics}</button>
            <button onClick={() => navigate('/dashboard/admin')} className="btn btn-ghost btn-sm">{t.users}</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t.totalBookings, value: stats.total, color: 'var(--surface)', borderColor: 'var(--border)', textColor: 'var(--text-primary)', labelColor: 'var(--text-muted)' },
            { label: t.revenue, value: `EGP ${stats.revenue.toFixed(0)}`, color: 'var(--success-light)', borderColor: 'var(--success-border)', textColor: 'var(--success)', labelColor: 'var(--success)' },
            { label: t.unpaid, value: `EGP ${stats.unpaid.toFixed(0)}`, color: 'var(--danger-light)', borderColor: 'var(--danger-border)', textColor: 'var(--danger)', labelColor: 'var(--danger)' },
            { label: t.doctors, value: `${doctors.filter(d => d.is_active).length}/${doctors.length}`, color: 'var(--primary-light)', borderColor: 'var(--primary-border)', textColor: 'var(--primary)', labelColor: 'var(--primary)' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ background: s.color, borderColor: s.borderColor }}>
              <p style={{ fontSize: 12, color: s.labelColor, marginBottom: 4, fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: s.textColor }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{t.departmentPerformance}</h2>
            {departments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noData}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {departments.map(dept => (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{dept.completed}/{dept.total}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 999, width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{t.staffOverview}</h2>
            <div className="grid grid-cols-2 gap-3">
              {['doctor', 'consultant'].map(type => {
                const count = doctors.filter(d => d.type === type).length
                const active = doctors.filter(d => d.type === type && d.is_active).length
                return (
                  <div key={type} style={{ background: 'var(--surface-hover)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{active}/{count}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{type === 'doctor' ? t.doctors : t.consultants}</p>
                  </div>
                )
              })}
              {departments.map(dept => (
                <div key={dept.name} style={{ background: 'var(--surface-hover)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{dept.total}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t.recentBookings}</h2>
            <button onClick={() => navigate('/dashboard/bookings')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>{t.viewAllAction}</button>
          </div>
          {recentBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>{t.noData}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentBookings.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--surface-hover)', borderRadius: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{b.patient_name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en} · {b.booking_date} · {b.slot_time}
                    </p>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                    {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-primary btn-md">{t.analytics}</button>
          <button onClick={() => navigate('/dashboard/admin')} className="btn btn-secondary btn-md">{t.usersAndRoles}</button>
          <button onClick={() => navigate('/dashboard/audit-log')} className="btn btn-secondary btn-md">{t.auditLog}</button>
          <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md">{t.billing}</button>
          <button onClick={() => navigate('/dashboard/settings')} className="btn btn-secondary btn-md">{t.settings}</button>
        </div>
      </div>
    </div>
  )
}

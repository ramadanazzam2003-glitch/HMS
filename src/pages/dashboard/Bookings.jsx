import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'

export default function Bookings() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const { confirm } = useUI()
  const { t, isRTL } = useLanguage()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, doctors(name), departments(name_en, name_ar)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en, name_ar)')
        .order('created_at', { ascending: false })
      if (!ignore) { setBookings(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleCancel = async (id) => {
    if (!await confirm(t.cancel + '?')) return
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: user?.id }).eq('id', id)
    fetchBookings()
  }

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search)
    return matchStatus && matchSearch
  })

  const filterLabels = { all: t.all, active: t.statusActive, cancelled: t.statusCancelled }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.allBookings} />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Search size={16} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input" style={{ paddingInlineStart: 36 }}
                placeholder={t.searchRefPatientDoctor} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'active', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="btn btn-md"
                  style={{
                    background: filter === f ? 'var(--primary)' : 'var(--surface)',
                    color: filter === f ? '#fff' : 'var(--text-secondary)',
                    border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                  }}>
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div className="spinner spinner-lg mx-auto mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><CalendarDays size={48} style={{ color: 'var(--text-disabled)' }} /></div>
              <p className="empty-state-title">{t.noData}</p>
              <p className="empty-state-desc">{t.searchRefPatientDoctor}</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[t.ref, t.patient, t.phone, t.doctor, t.department, t.queue, t.status, t.actions].map(col => (
                        <th key={col} style={{ padding: '10px 14px', textAlign: 'start', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => (
                      <motion.tr key={b.id}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>{b.booking_ref}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.patient_name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{b.phone}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{b.doctors?.name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}</td>
                        <td style={{ padding: '10px 14px' }}><span className="badge badge-primary">#{b.queue_number}</span></td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {b.status === 'active' && hasPermission('bookings:update') && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => navigate(`/reschedule/${b.id}`)} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontSize: 12 }}>{t.reschedule}</button>
                              <button onClick={() => handleCancel(b.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 12 }}>{t.cancel}</button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                {t.showing} {filtered.length} {t.of} {bookings.length}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

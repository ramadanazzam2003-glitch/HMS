import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CalendarDays, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useLanguage } from '../../contexts/LanguageContext'

export default function AuditLog() {
  const { t, isRTL } = useLanguage()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, patient_name, phone, status, created_at, updated_at, doctor_id, departments(name_en, name_ar), doctors(name)')
        .order('updated_at', { ascending: false })
        .limit(100)

      const { data: bills } = await supabase
        .from('bills')
        .select('id, patient_name, invoice_number, payment_status, total, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50)

      if (ignore) return

      const allLogs = []

      bookings?.forEach(b => {
        allLogs.push({
          type: 'booking',
          action: b.status,
          subject: b.patient_name,
          detail: `${b.doctors?.name} · ${isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}`,
          timestamp: b.updated_at || b.created_at,
        })
      })

      bills?.forEach(b => {
        allLogs.push({
          type: 'invoice',
          action: b.payment_status,
          subject: b.patient_name,
          detail: `#${b.invoice_number} · EGP ${b.total}`,
          timestamp: b.updated_at || b.created_at,
        })
      })

      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setLogs(allLogs)
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [isRTL])

  const filtered = logs.filter(l => filter === 'all' || l.type === filter)

  const filterLabels = { all: t.allTypes, booking: t.bookingsType, invoice: t.invoicesType }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.auditLogPage} />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['all', 'booking', 'invoice'].map(f => (
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

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div className="spinner spinner-lg mx-auto mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><FileText size={48} style={{ color: 'var(--text-disabled)' }} /></div>
              <p className="empty-state-title">{t.noActivityYet}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((log, i) => (
                <motion.div key={i} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, background: log.type === 'booking' ? 'var(--primary-light)' : 'var(--success-light)', color: log.type === 'booking' ? 'var(--primary)' : 'var(--success)' }}>
                    {log.type === 'booking' ? <CalendarDays size={14} /> : <CreditCard size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      <span style={{ fontWeight: 600 }}>{log.subject}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
                      <span className={`badge text-[10px] ${
                        log.action === 'active' || log.action === 'paid' ? 'badge-success'
                        : log.action === 'cancelled' || log.action === 'unpaid' ? 'badge-danger'
                        : 'badge-primary'
                      }`}>{log.action}</span>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{log.timestamp?.slice(0, 16).replace('T', ' ')}</span>
                </motion.div>
              ))}
            </div>
          )}

          <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            {t.showing} {filtered.length} {t.of} {logs.length}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

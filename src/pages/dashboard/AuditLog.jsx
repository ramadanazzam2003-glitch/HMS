import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, CalendarDays, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function AuditLog() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, patient_name, phone, status, created_at, updated_at, doctor_id, departments(name_en), doctors(name)')
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
          detail: `${b.doctors?.name} · ${b.departments?.name_en}`,
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
  }, [])

  const filtered = logs.filter(l => filter === 'all' || l.type === filter)

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Audit Log" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-2 mb-5">
            {['all', 'booking', 'invoice'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`btn btn-md capitalize ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                {f === 'all' ? 'All' : f === 'booking' ? 'Bookings' : 'Invoices'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner spinner-lg mx-auto mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><FileText size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Activity</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((log, i) => (
                <motion.div key={i} className="card p-4 flex items-center gap-3"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}
                  whileHover={{ scale: 1.005 }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    log.type === 'booking' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {log.type === 'booking' ? <CalendarDays size={14} /> : <CreditCard size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{log.subject}</span>
                      <span className="text-gray-400 mx-1">·</span>
                      <span className={`badge text-[10px] ${
                        log.action === 'active' || log.action === 'paid' ? 'badge-success'
                        : log.action === 'cancelled' || log.action === 'unpaid' ? 'badge-danger'
                        : 'badge-primary'
                      }`}>{log.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{log.detail}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{log.timestamp?.slice(0, 16).replace('T', ' ')}</span>
                </motion.div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 text-xs text-gray-400 mt-4">
            Showing {filtered.length} of {logs.length} entries
          </div>
        </motion.div>
      </div>
    </div>
  )
}

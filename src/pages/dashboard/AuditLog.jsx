import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CalendarDays, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.auditLogPage}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'سجل النشاطات والتغييرات' : 'Activity and change log'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {['all', 'booking', 'invoice'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === f
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText size={48} className="text-txt-disabled mb-4" />
              <p className="text-txt-primary font-semibold">{t.noActivityYet}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-2">
              {filtered.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border hover:shadow-sm transition-shadow"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    log.type === 'booking' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {log.type === 'booking' ? <CalendarDays size={14} /> : <CreditCard size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-txt-primary">
                      <span className="font-semibold">{log.subject}</span>
                      <span className="text-txt-muted mx-1.5">&middot;</span>
                      <Badge variant={
                        log.action === 'active' || log.action === 'paid' ? 'success' :
                        log.action === 'cancelled' || log.action === 'unpaid' ? 'danger' : 'primary'
                      } className="text-[10px]">{log.action}</Badge>
                    </p>
                    <p className="text-xs text-txt-muted truncate mt-0.5">{log.detail}</p>
                  </div>
                  <span className="text-[10px] text-txt-muted shrink-0">{log.timestamp?.slice(0, 16).replace('T', ' ')}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-txt-muted">{t.showing} {filtered.length} {t.of} {logs.length}</p>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

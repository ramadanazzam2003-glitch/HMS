import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import InvoiceCard from '../../components/billing/InvoiceCard'
import { motion } from 'framer-motion'
import { Search, Plus, CreditCard, DollarSign } from 'lucide-react'

export default function InvoiceList() {
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bills')
        .select('*, doctors(name), departments(name_en)')
        .order('created_at', { ascending: false })

      if (!ignore) {
        setInvoices(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = invoices.filter(inv => {
    const matchStatus = filter === 'all' || inv.payment_status === filter
    const matchSearch = !search ||
      inv.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.patient_phone?.includes(search)
    return matchStatus && matchSearch
  })

  const totalRevenue = invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
  const totalUnpaid = invoices.filter(i => i.payment_status === 'unpaid').reduce((sum, i) => sum + (i.total || 0), 0)

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-txt-primary">Billing</h1>
              <p className="text-sm text-txt-muted">Manage invoices and payments</p>
            </div>
            <Button onClick={() => navigate('/dashboard/billing/new')}>
              <Plus size={16} /> New Invoice
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-txt-muted" />
                  <p className="text-xs text-txt-muted">Total Invoices</p>
                </div>
                <p className="font-display text-3xl font-extrabold text-txt-primary">{invoices.length}</p>
              </Card>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-green-50 border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-600" />
                  <p className="text-xs text-green-600">Total Revenue</p>
                </div>
                <p className="font-display text-3xl font-extrabold text-green-600">EGP {totalRevenue.toFixed(2)}</p>
              </Card>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-red-50 border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-red-500" />
                  <p className="text-xs text-red-500">Total Unpaid</p>
                </div>
                <p className="font-display text-3xl font-extrabold text-red-500">EGP {totalUnpaid.toFixed(2)}</p>
              </Card>
            </motion.div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none"><Search size={16} /></span>
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9" placeholder="Search by name, invoice #, or phone..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'unpaid', 'paid', 'partial'].map(f => (
                <motion.div key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant={filter === f ? 'primary' : 'outline'} size="sm" className="capitalize" onClick={() => setFilter(f)}>
                    {f}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <div className="flex justify-center mb-4"><CreditCard size={48} className="text-txt-muted" /></div>
                <p className="text-lg font-semibold text-txt-primary mb-2">No Invoices Found</p>
                <p className="text-sm text-txt-muted">{search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No invoices have been created yet.'}</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(invoice => (
                <motion.div key={invoice.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
                  <InvoiceCard
                    invoice={invoice}
                    onClick={() => navigate(`/dashboard/billing/${invoice.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 text-xs text-txt-muted">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  )
}

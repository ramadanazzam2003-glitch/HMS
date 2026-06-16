import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useLogout } from '../../hooks/useLogout'
import InvoiceCard from '../../components/billing/InvoiceCard'
import { motion } from 'framer-motion'
import { Search, Plus, CreditCard, DollarSign } from 'lucide-react'

export default function InvoiceList() {
  const navigate = useNavigate()
  const handleLogout = useLogout('/login')

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
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard" subtitle="Billing"
        right={
          <div className="flex items-center gap-3">
            <motion.button onClick={() => navigate('/dashboard/billing/new')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn btn-primary btn-sm flex items-center gap-1"><Plus size={14} /> New Invoice</motion.button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <motion.div className="card p-5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} className="text-gray-400" />
                <p className="text-xs text-gray-400">Total Invoices</p>
              </div>
              <p className="font-display text-3xl font-extrabold text-gray-800">{invoices.length}</p>
            </motion.div>
            <motion.div className="card p-5 bg-green-50 border-green-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-green-600" />
                <p className="text-xs text-green-600">Total Revenue</p>
              </div>
              <p className="font-display text-3xl font-extrabold text-green-600">EGP {totalRevenue.toFixed(2)}</p>
            </motion.div>
            <motion.div className="card p-5 bg-red-50 border-red-200" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-red-500" />
                <p className="text-xs text-red-500">Total Unpaid</p>
              </div>
              <p className="font-display text-3xl font-extrabold text-red-500">EGP {totalUnpaid.toFixed(2)}</p>
            </motion.div>
          </div>

          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9" placeholder="Search by name, invoice #, or phone..." />
            </div>
            <div className="flex gap-2">
              {['all', 'unpaid', 'paid', 'partial'].map(f => (
                <motion.button key={f} onClick={() => setFilter(f)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`btn btn-md capitalize ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner spinner-lg mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><CreditCard size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Invoices Found</p>
              <p className="empty-state-desc">{search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'No invoices have been created yet.'}</p>
            </div>
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

          <div className="px-4 py-2.5 text-xs text-gray-400 mt-4">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        </motion.div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientPayments() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const phone = session.user.user_metadata?.phone || ''
      if (!phone) { setLoading(false); return }

      const { data } = await supabase
        .from('bills')
        .select('*, doctors(name), departments(name_en)')
        .eq('patient_phone', phone)
        .order('created_at', { ascending: false })

      if (!ignore) { setInvoices(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [navigate])

  const totalPaid = invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)
  const totalUnpaid = invoices.filter(i => i.payment_status === 'unpaid').reduce((sum, i) => sum + (i.total || 0), 0)

  return (
    <div className="page">
      <Navbar back="/" subtitle="Payment History" />
      <div className="page-content">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card p-5 bg-green-50 border-green-200">
            <p className="text-xs text-green-600 mb-1">Total Paid</p>
            <p className="font-display text-2xl font-extrabold text-green-600">EGP {totalPaid.toFixed(2)}</p>
          </div>
          <div className="card p-5 bg-red-50 border-red-200">
            <p className="text-xs text-red-500 mb-1">Total Unpaid</p>
            <p className="font-display text-2xl font-extrabold text-red-500">EGP {totalUnpaid.toFixed(2)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Loading...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">💰</div>
            <p className="empty-state-title">No Invoices</p>
            <p className="empty-state-desc">You have no payment records yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {invoices.map(inv => (
              <div key={inv.id} className="card animate-fadeIn p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm mb-0.5">#{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400 mb-1">{inv.doctors?.name} · {inv.departments?.name_en}</p>
                    <p className="text-xs text-gray-400">{inv.created_at?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">EGP {inv.total?.toFixed(2) || '0.00'}</p>
                    <span className={`badge mt-1 ${inv.payment_status === 'paid' ? 'badge-success' : inv.payment_status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {inv.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

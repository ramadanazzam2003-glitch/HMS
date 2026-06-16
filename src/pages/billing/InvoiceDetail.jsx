import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { formatCurrency } from '../../utils/invoice'
import PaymentStatusBadge from '../../components/billing/PaymentStatusBadge'
import { motion } from 'framer-motion'
import { Printer, CreditCard, DollarSign, Banknote, Globe } from 'lucide-react'

export default function InvoiceDetail() {
  const navigate = useNavigate()
  const { invoiceId } = useParams()
  const { hasPermission } = useAuth()
  const { toast, confirm } = useUI()

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bills')
        .select('*, doctors(name), departments(name_en), bookings(booking_ref)')
        .eq('id', invoiceId)
        .single()

      if (!ignore) {
        setInvoice(data)
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [invoiceId])

  const handleMarkPaid = async (method) => {
    if (!await confirm(`Mark as paid via ${method}?`)) return

    setUpdating(true)
    const { error } = await supabase
      .from('bills')
      .update({
        payment_status: 'paid',
        payment_method: method,
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    if (error) {
      toast('Error updating: ' + error.message, { type: 'error' })
    } else {
      setInvoice({ ...invoice, payment_status: 'paid', payment_method: method, paid_at: new Date().toISOString() })
      toast('Payment recorded', { type: 'success' })
    }
    setUpdating(false)
  }

  const handlePayOnline = async () => {
    setUpdating(true)
    try {
      const { createPaymobOrder, createPaymobPaymentKey, getPaymobCheckoutUrl } = await import('../../lib/paymob')
      const { orderId } = await createPaymobOrder({
        amount: invoice.total,
        items: invoice.items,
      })

      await supabase.from('bills').update({ paymob_order_id: String(orderId) }).eq('id', invoiceId)

      const paymentKey = await createPaymobPaymentKey({
        orderId,
        billingData: {
          amount: invoice.total,
          firstName: invoice.patient_name?.split(' ')[0] || 'Patient',
          phone: invoice.patient_phone,
          email: 'patient@medibook.com',
        },
      })

      const checkoutUrl = getPaymobCheckoutUrl(paymentKey)
      window.open(checkoutUrl, '_blank')
    } catch (err) {
      toast('Payment error: ' + err.message, { type: 'error' })
    }
    setUpdating(false)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard/billing" subtitle="Invoice" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )

  if (!invoice) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard/billing" subtitle="Invoice" />
      <div className="page-content-lg">
        <div className="card empty-state">
          <p className="empty-state-title">Invoice not found</p>
          <button onClick={() => navigate('/dashboard/billing')} className="btn btn-primary btn-md mt-4">Back to Billing</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard/billing" subtitle={`Invoice ${invoice.invoice_number}`}
        right={
          <div className="flex items-center gap-2">
            <motion.button onClick={handlePrint}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn btn-ghost btn-sm flex items-center gap-1"><Printer size={14} /> Print</motion.button>
            {invoice.payment_status !== 'paid' && hasPermission('bookings:update') && (
              <motion.button onClick={handlePayOnline} disabled={updating}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="btn btn-primary btn-sm">
                Pay Online
              </motion.button>
            )}
          </div>
        }
      />

      <div className="page-content-lg print:p-0">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <motion.div className="card p-6 mb-4 print:shadow-none print:border-0" whileHover={{ scale: 1.005 }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-gray-900 flex items-center gap-2"><CreditCard size={24} /> Invoice</h1>
                <p className="font-mono text-blue-600 font-semibold mt-1">{invoice.invoice_number}</p>
                <p className="text-xs text-gray-400 mt-1">Created: {invoice.created_at?.slice(0, 10)}</p>
              </div>
              <div className="text-right">
                <PaymentStatusBadge status={invoice.payment_status} />
                {invoice.payment_method && (
                  <p className="text-xs text-gray-400 mt-1 capitalize flex items-center gap-1 justify-end">
                    {invoice.payment_method === 'cash' ? <Banknote size={12} /> : invoice.payment_method === 'card' ? <CreditCard size={12} /> : <Globe size={12} />}
                    via {invoice.payment_method}
                  </p>
                )}
                {invoice.paid_at && (
                  <p className="text-xs text-gray-400 mt-1">Paid: {invoice.paid_at?.slice(0, 10)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Patient</p>
                <p className="text-sm font-semibold text-gray-800">{invoice.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm font-semibold text-gray-800">{invoice.patient_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Doctor</p>
                <p className="text-sm font-semibold text-gray-800">{invoice.doctors?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm font-semibold text-gray-800">{invoice.departments?.name_en || '—'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Items</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-400 font-semibold">Item</th>
                    <th className="text-right py-2 text-xs text-gray-400 font-semibold">Amount</th>
                    <th className="text-right py-2 text-xs text-gray-400 font-semibold">Qty</th>
                    <th className="text-right py-2 text-xs text-gray-400 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 text-gray-800">{item.name}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.amount)}</td>
                      <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                      <td className="py-2 text-right font-semibold text-gray-800">{formatCurrency(item.amount * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-display text-xl font-extrabold text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </motion.div>

          {invoice.payment_status !== 'paid' && hasPermission('bookings:update') && (
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Record Payment</h3>
              <div className="flex gap-3 flex-wrap">
                <motion.button onClick={() => handleMarkPaid('cash')} disabled={updating}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary btn-md flex items-center gap-1.5">
                  <Banknote size={16} /> Cash
                </motion.button>
                <motion.button onClick={() => handleMarkPaid('card')} disabled={updating}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-secondary btn-md flex items-center gap-1.5">
                  <CreditCard size={16} /> Card
                </motion.button>
                <motion.button onClick={handlePayOnline} disabled={updating}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-primary btn-md flex items-center gap-1.5">
                  <Globe size={16} /> Paymob Online
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

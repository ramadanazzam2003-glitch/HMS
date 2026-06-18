import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { formatCurrency } from '../../utils/invoice'
import PaymentStatusBadge from '../../components/billing/PaymentStatusBadge'
import { motion } from 'framer-motion'
import { Printer, CreditCard, Banknote, Globe, ArrowLeft } from 'lucide-react'

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
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </DashboardLayout>
  )

  if (!invoice) return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <p className="text-lg font-semibold text-txt-primary mb-4">Invoice not found</p>
            <Button onClick={() => navigate('/dashboard/billing')}>Back to Billing</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-0">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/billing')}>
            <ArrowLeft size={16} /> Back to Billing
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={14} /> Print
            </Button>
            {invoice.payment_status !== 'paid' && hasPermission('bookings:update') && (
              <Button size="sm" onClick={handlePayOnline} disabled={updating}>
                Pay Online
              </Button>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="print:shadow-none print:border-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="font-display text-2xl font-extrabold text-txt-primary flex items-center gap-2"><CreditCard size={24} /> Invoice</h1>
                <p className="font-mono text-blue-600 font-semibold mt-1">{invoice.invoice_number}</p>
                <p className="text-xs text-txt-muted mt-1">Created: {invoice.created_at?.slice(0, 10)}</p>
              </div>
              <div className="text-right">
                <PaymentStatusBadge status={invoice.payment_status} />
                {invoice.payment_method && (
                  <p className="text-xs text-txt-muted mt-1 capitalize flex items-center gap-1 justify-end">
                    {invoice.payment_method === 'cash' ? <Banknote size={12} /> : invoice.payment_method === 'card' ? <CreditCard size={12} /> : <Globe size={12} />}
                    via {invoice.payment_method}
                  </p>
                )}
                {invoice.paid_at && (
                  <p className="text-xs text-txt-muted mt-1">Paid: {invoice.paid_at?.slice(0, 10)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-xs text-txt-muted">Patient</p>
                <p className="text-sm font-semibold text-txt-primary">{invoice.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-txt-muted">Phone</p>
                <p className="text-sm font-semibold text-txt-primary">{invoice.patient_phone}</p>
              </div>
              <div>
                <p className="text-xs text-txt-muted">Doctor</p>
                <p className="text-sm font-semibold text-txt-primary">{invoice.doctors?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-txt-muted">Department</p>
                <p className="text-sm font-semibold text-txt-primary">{invoice.departments?.name_en || '—'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-txt-primary text-sm mb-3">Items</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-txt-muted font-semibold">Item</th>
                    <th className="text-right py-2 text-xs text-txt-muted font-semibold">Amount</th>
                    <th className="text-right py-2 text-xs text-txt-muted font-semibold">Qty</th>
                    <th className="text-right py-2 text-xs text-txt-muted font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 text-txt-primary">{item.name}</td>
                      <td className="py-2 text-right text-txt-secondary">{formatCurrency(item.amount)}</td>
                      <td className="py-2 text-right text-txt-secondary">{item.quantity}</td>
                      <td className="py-2 text-right font-semibold text-txt-primary">{formatCurrency(item.amount * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-txt-muted">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-muted">Tax ({invoice.tax_rate}%)</span>
                  <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-txt-primary">Total</span>
                  <span className="font-display text-xl font-extrabold text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-txt-muted mb-1">Notes</p>
                <p className="text-sm text-txt-primary">{invoice.notes}</p>
              </div>
            )}
          </Card>

          {invoice.payment_status !== 'paid' && hasPermission('bookings:update') && (
            <Card>
              <h3 className="font-bold text-txt-primary text-sm mb-3">Record Payment</h3>
              <div className="flex gap-3 flex-wrap">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="secondary" onClick={() => handleMarkPaid('cash')} disabled={updating}>
                    <Banknote size={16} /> Cash
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="secondary" onClick={() => handleMarkPaid('card')} disabled={updating}>
                    <CreditCard size={16} /> Card
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="primary" onClick={handlePayOnline} disabled={updating}>
                    <Globe size={16} /> Paymob Online
                  </Button>
                </motion.div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function PatientPayments() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      if (!session) return

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
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <main className="pt-20 px-4 max-w-3xl mx-auto pb-8">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
            <p className="text-xs text-green-600 mb-1">Total Paid</p>
            <p className="font-display text-2xl font-extrabold text-green-600">EGP {totalPaid.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
            <p className="text-xs text-red-500 mb-1">Total Unpaid</p>
            <p className="font-display text-2xl font-extrabold text-red-500">EGP {totalUnpaid.toFixed(2)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-10 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-lg font-bold text-txt-primary mb-1">No Invoices</p>
            <p className="text-sm text-txt-muted">You have no payment records yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {invoices.map(inv => (
              <Card key={inv.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-txt-primary text-sm mb-0.5">#{inv.invoice_number}</p>
                      <p className="text-xs text-txt-muted mb-1">{inv.doctors?.name} · {inv.departments?.name_en}</p>
                      <p className="text-xs text-txt-muted">{inv.created_at?.slice(0, 10)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-txt-primary text-sm">EGP {inv.total?.toFixed(2) || '0.00'}</p>
                      <Badge className="mt-1" variant={inv.payment_status === 'paid' ? 'success' : inv.payment_status === 'partial' ? 'warning' : 'danger'}>
                        {inv.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

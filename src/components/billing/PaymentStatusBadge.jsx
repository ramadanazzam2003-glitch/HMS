import { Check, X, RefreshCw } from 'lucide-react'
import { getPaymentStatusColor } from '../../utils/invoice'

export default function PaymentStatusBadge({ status }) {
  return (
    <span className={`badge ${getPaymentStatusColor(status)}`}>
      {status === 'paid' && <span className="flex items-center gap-0.5"><Check size={12} /> Paid</span>}
      {status === 'unpaid' && <span className="flex items-center gap-0.5"><X size={12} /> Unpaid</span>}
      {status === 'partial' && <span className="flex items-center gap-0.5"><RefreshCw size={12} /> Partial</span>}
      {status === 'refunded' && <span className="flex items-center gap-0.5"><RefreshCw size={12} /> Refunded</span>}
    </span>
  )
}

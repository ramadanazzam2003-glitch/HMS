import { motion } from 'framer-motion'
import { CreditCard, CalendarDays, Stethoscope } from 'lucide-react'
import { formatCurrency, getPaymentStatusColor } from '../../utils/invoice'

export default function InvoiceCard({ invoice, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      className="card animate-fadeIn p-5 cursor-pointer"
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-blue-600 font-semibold text-sm flex items-center gap-1"><CreditCard size={14} />{invoice.invoice_number}</span>
            <span className={`badge ${getPaymentStatusColor(invoice.payment_status)}`}>
              {invoice.payment_status}
            </span>
          </div>

          <p className="font-bold text-gray-900 text-sm mb-1">{invoice.patient_name}</p>
          <p className="text-xs text-gray-400 mb-2">{invoice.patient_phone}</p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            {invoice.doctors?.name && <span className="flex items-center gap-1"><Stethoscope size={12} /> Dr. {invoice.doctors?.name}</span>}
            {invoice.departments?.name_en && <span>{invoice.departments?.name_en}</span>}
            <span className="flex items-center gap-1"><CalendarDays size={12} />{invoice.created_at?.slice(0, 10)}</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-xl font-extrabold text-gray-800">{formatCurrency(invoice.total)}</p>
          {invoice.payment_method && (
            <p className="text-xs text-gray-400 mt-1 capitalize">{invoice.payment_method}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

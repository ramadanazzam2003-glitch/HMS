import { motion } from 'framer-motion'
import { Building2, AlertTriangle } from 'lucide-react'

const severityConfig = {
  low:       { color: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-700',  label: 'Low Risk • منخفض' },
  medium:    { color: 'bg-yellow-50 border-yellow-200',badge: 'bg-yellow-100 text-yellow-700',label: 'Moderate • متوسط' },
  high:      { color: 'bg-orange-50 border-orange-200',badge: 'bg-orange-100 text-orange-700',label: 'High • مرتفع' },
  emergency: { color: 'bg-red-50 border-red-200',      badge: 'bg-red-100 text-red-700',      label: 'Emergency • طارئ' },
}

export default function RecommendCard({ recommendation }) {
  if (!recommendation) return null
  const { department, severity, advice } = recommendation
  const cfg = severityConfig[severity] ?? severityConfig.low

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`mx-4 mb-4 p-4 rounded-2xl border-2 ${cfg.color}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800 text-base flex items-center gap-2">
          {severity === 'emergency' ? <AlertTriangle size={16} className="text-red-500" /> : <Building2 size={16} />}
          Recommendation • التوصية
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>
      {department && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-500 text-sm">Department:</span>
          <span className="font-semibold text-gray-800">{department}</span>
        </div>
      )}
      {advice && (
        <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-2 mt-2" dir="auto">
          {advice}
        </p>
      )}
    </motion.div>
  )
}

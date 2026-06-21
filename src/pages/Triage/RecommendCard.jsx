import { motion } from 'framer-motion'
import { AlertTriangle, Building2, CheckCircle, ShieldAlert } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const severityConfig = {
  low: {
    icon: CheckCircle,
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    badge: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    label: 'Low Risk • منخفض',
    iconColor: '#10b981',
  },
  medium: {
    icon: ShieldAlert,
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    badge: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    label: 'Moderate • متوسط',
    iconColor: '#f59e0b',
  },
  high: {
    icon: AlertTriangle,
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
    badge: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
    label: 'High • مرتفع',
    iconColor: '#f97316',
  },
  emergency: {
    icon: AlertTriangle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    badge: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
    label: 'Emergency • طارئ',
    iconColor: '#ef4444',
  },
}

export default function RecommendCard({ recommendation }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!recommendation) return null
  const { department, severity, advice } = recommendation
  const cfg = severityConfig[severity] ?? severityConfig.low
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-0 mb-4 mt-2 rounded-2xl overflow-hidden"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${cfg.border}` }}>
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: cfg.iconColor }} />
          <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            Recommendation • التوصية
          </span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: cfg.badge.bg, color: cfg.badge.color }}>
          {cfg.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        {department && (
          <div className="flex items-center gap-2">
            <Building2 size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Department:</span>
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{department}</span>
          </div>
        )}
        {advice && (
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`} dir="auto">
            {advice}
          </p>
        )}
      </div>
    </motion.div>
  )
}
import { motion } from 'framer-motion'
import { Stethoscope, UserRound, Clock, CalendarDays, ArrowRight } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function DoctorCard({ doc, bookingType, isAvailableToday, onSelect, animDelay }) {
  const { t } = useLanguage()
  const available = isAvailableToday(doc)

  return (
    <motion.div
      onClick={() => onSelect(doc)}
      className="card animate-fadeIn p-5 flex items-center gap-4 cursor-pointer transition-all duration-150"
      style={{ animationDelay: `${animDelay}ms` }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`w-15 h-15 rounded-2xl shrink-0 flex items-center justify-center border-2 transition-all ${
        available ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
      }`}>
        {bookingType === 'consultant' ? <Stethoscope size={24} className="text-blue-600" /> : <UserRound size={24} className="text-teal-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-gray-900 text-sm mb-0.5 truncate">{doc.name}</h3>
        <p className="text-xs text-blue-600 font-semibold mb-1.5 capitalize">{doc.type}</p>
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {doc.slots?.length || 0} {t.slotsPerDay}</span>
          {doc.working_days?.length > 0 && (
            <span className="text-xs text-gray-400 flex items-center gap-1"><CalendarDays size={12} /> {doc.working_days.map(d => d.slice(0, 3)).join(', ')}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {available
          ? <span className="badge badge-success">{t.todayBadge}</span>
          : <span className="badge badge-warning">{t.futureBadge}</span>
        }
        <span className="text-gray-400"><ArrowRight size={16} /></span>
      </div>
    </motion.div>
  )
}

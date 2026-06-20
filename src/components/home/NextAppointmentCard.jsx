import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { formatApptDate } from '../../utils/booking'
import { useLanguage } from '../../contexts/LanguageContext'

export default function NextAppointmentCard({ booking }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <motion.div
      className="mb-7 bg-surface border border-border rounded-[20px] px-5 py-4 flex items-center justify-between gap-4 shadow-md"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-[46px] h-[46px] rounded-[14px] shrink-0 bg-primary-light flex items-center justify-center">
          <CalendarDays size={22} className="text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-primary tracking-widest uppercase mb-1">{t.yourNextAppointment}</p>
          <p className="text-[15px] font-bold text-txt-primary mb-0.5">
            {booking.deptName}
            {booking.deptNameAr && <span className="font-normal text-txt-muted text-[13px] mr-1"> · {booking.deptNameAr}</span>}
            {booking.doctors?.name && <span className="font-normal text-txt-secondary"> · {booking.doctors.name}</span>}
          </p>
          <p className="text-[13px] text-txt-secondary flex items-center gap-1">
            <Clock size={12} /> {formatApptDate(booking.booking_date, booking.slot_time)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-success-light text-success">● {t.statusActive}</span>
        <button onClick={() => navigate('/my-bookings')}
          className="text-[13px] font-semibold text-white bg-primary border-none rounded-[10px] px-4 py-2 cursor-pointer hover:bg-primary-dark hover:-translate-y-0.5 transition-all flex items-center gap-1">
          {t.viewDetails} <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

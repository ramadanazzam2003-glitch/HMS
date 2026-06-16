import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import { formatApptDate } from '../../utils/booking'

export default function NextAppointmentCard({ booking }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="mb-7 bg-white border border-blue-200 rounded-[20px] px-5 py-4 flex items-center justify-between gap-4 shadow-md"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-[46px] h-[46px] rounded-[14px] shrink-0 bg-blue-50 flex items-center justify-center">
          <CalendarDays size={22} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-blue-600 tracking-widest uppercase mb-1">Your Next Appointment</p>
          <p className="text-[15px] font-bold text-gray-800 mb-0.5">
            {booking.deptName}
            {booking.deptNameAr && <span className="font-normal text-gray-400 text-[13px] mr-1"> · {booking.deptNameAr}</span>}
            {booking.doctors?.name && <span className="font-normal text-gray-500"> · {booking.doctors.name}</span>}
          </p>
          <p className="text-[13px] text-gray-500 flex items-center gap-1">
            <Clock size={12} /> {formatApptDate(booking.booking_date, booking.slot_time)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">● Active</span>
        <button onClick={() => navigate('/my-bookings')}
          className="text-[13px] font-semibold text-white bg-blue-600 border-none rounded-[10px] px-4 py-2 cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center gap-1">
          View Details <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

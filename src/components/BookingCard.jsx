import { motion } from 'framer-motion'
import { CalendarDays, Clock, Hash } from 'lucide-react'

export default function BookingCard({ booking, onCancel, onReschedule }) {
  return (
    <motion.div
      className="card animate-fadeIn p-5"
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm mb-0.5">{booking.doctors?.name}</p>
          <p className="text-sm text-gray-500 mb-1.5">{booking.departments?.name_en}</p>
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><CalendarDays size={12} /> {booking.booking_date} · <Clock size={12} /> {booking.slot_time}</p>
          <p className="text-xs text-blue-600 font-mono font-semibold flex items-center gap-0.5"><Hash size={12} />{booking.booking_ref}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`badge ${booking.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
            {booking.status}
          </span>
          {booking.status === 'active' && (
            <div className="flex gap-2">
              <button onClick={() => onReschedule(booking.id)} className="btn btn-ghost btn-sm text-blue-500 text-xs">
                Reschedule
              </button>
              <button onClick={() => onCancel(booking.id)} className="btn btn-ghost btn-sm text-red-500 text-xs">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

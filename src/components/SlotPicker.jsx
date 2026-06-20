import { motion } from 'framer-motion'
import { Clock, CalendarX } from 'lucide-react'
import { calcEndTime } from '../utils/booking'

export default function SlotPicker({ slots, bookedSlots, selectedSlot, onSelect, loading, dateAllowed, workingDays }) {
  const availableCount = slots.length - bookedSlots.length

  return (
    <div className="card p-5 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Clock size={16} /> Available Slots</h3>
        {dateAllowed && slots.length > 0 && <span className="badge badge-success">{availableCount} free</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-11 rounded-xl" />)}
        </div>
      ) : !dateAllowed ? (
        <div className="text-center py-8">
          <div className="mb-3"><CalendarX size={40} className="text-gray-300 mx-auto" /></div>
          <p className="font-semibold text-gray-500 mb-1">No slots on this day</p>
          <p className="text-xs text-gray-400">{workingDays?.map(d => d.slice(0, 3)).join(' · ')}</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8">
          <div className="mb-3"><CalendarX size={40} className="text-gray-300 mx-auto" /></div>
          <p className="text-gray-500">No slots configured for this doctor</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {slots.map(slot => {
            const isBooked = bookedSlots.includes(slot)
            const isSelected = selectedSlot === slot
            return (
              <motion.button
                key={slot}
                disabled={isBooked}
                onClick={() => onSelect(slot)}
                whileHover={!isBooked ? { scale: 1.02 } : undefined}
                whileTap={!isBooked ? { scale: 0.97 } : undefined}
                className={`rounded-xl p-2 sm:p-2.5 text-xs sm:text-sm font-semibold border-2 transition-all duration-150 ${
                  isBooked
                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                    : isSelected
                      ? 'bg-blue-600 text-white border-blue-600 scale-105 shadow-lg'
                      : 'bg-white text-gray-800 border-gray-100 cursor-pointer hover:border-blue-300'
                }`}
              >
                <div>{slot}</div>
                <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5">
                  {isBooked ? 'Booked' : `→ ${calcEndTime(slot)}`}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

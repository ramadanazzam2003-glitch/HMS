import { motion } from 'framer-motion'
import { FileText, CalendarDays, Stethoscope, Building2 } from 'lucide-react'
import { formatApptDate } from '../../utils/booking'

export default function MedicalRecordCard({ record, onClick }) {
  const vitals = record.vitals || {}
  const prescriptions = record.prescriptions || []

  return (
    <motion.div
      onClick={onClick}
      className="card animate-fadeIn p-5 cursor-pointer"
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary flex items-center gap-1"><FileText size={12} />{record.id?.slice(0, 8)}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><CalendarDays size={12} />{formatApptDate(record.created_at?.slice(0, 10))}</span>
          </div>

          <p className="font-bold text-gray-900 text-sm mb-1">{record.patient_name}</p>
          <p className="text-xs text-gray-400 mb-2">{record.patient_phone}</p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2">
            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><Stethoscope size={12} /> Diagnosis</p>
            <p className="text-sm text-gray-700">{record.diagnosis}</p>
          </div>

          {record.notes && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{record.notes}</p>
          )}

          {prescriptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prescriptions.slice(0, 3).map((p, i) => (
                <span key={i} className="badge badge-secondary text-xs">
                  {p.medication_name}
                </span>
              ))}
              {prescriptions.length > 3 && (
                <span className="badge badge-secondary text-xs">
                  +{prescriptions.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {record.doctors?.name && (
            <span className="text-xs text-gray-400">Dr. {record.doctors?.name}</span>
          )}
          {record.departments?.name_en && (
            <span className="badge badge-primary text-xs flex items-center gap-1"><Building2 size={12} />{record.departments?.name_en}</span>
          )}
          {Object.keys(vitals).length > 0 && (
            <div className="text-xs text-gray-400 text-right">
              {vitals.bp && <p>BP: {vitals.bp}</p>}
              {vitals.temp && <p>Temp: {vitals.temp}</p>}
              {vitals.weight && <p>Weight: {vitals.weight}</p>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { formatApptDate } from '../../utils/booking'
import { motion } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, CalendarDays, Stethoscope, Building2 } from 'lucide-react'

export default function PatientRecord() {
  const { patientPhone } = useParams()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*, doctors(name), departments(name_en), prescriptions(*)')
        .eq('patient_phone', decodeURIComponent(patientPhone))
        .order('created_at', { ascending: false })

      if (!ignore) {
        setRecords(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [patientPhone])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Patient Records" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Patient Records" />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {records.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><FileText size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Records Found</p>
              <p className="empty-state-desc">No medical records found for this patient.</p>
            </div>
          ) : (
            <>
              <div className="card p-4 mb-4">
                <p className="text-sm text-gray-500">
                  Patient: <span className="font-bold text-gray-800">{records[0]?.patient_name}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  Phone: <span className="font-bold text-gray-800">{records[0]?.patient_phone}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  {records.length} record(s)
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {records.map(record => (
                  <motion.div key={record.id} className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
                    <div
                      onClick={() => toggleExpand(record.id)}
                      className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><CalendarDays size={12} />{formatApptDate(record.created_at?.slice(0, 10))}</span>
                            {record.doctors?.name && (
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Stethoscope size={12} />Dr. {record.doctors?.name}</span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-sm mb-1">{record.diagnosis}</p>
                          {record.notes && <p className="text-xs text-gray-500 line-clamp-2">{record.notes}</p>}
                        </div>
                        <span className="text-gray-400 text-sm">{expandedId === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </div>
                    </div>

                    {expandedId === record.id && (
                      <div className="border-t border-gray-100 p-5 space-y-4">
                        {record.departments?.name_en && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-1"><Building2 size={12} /> Department</p>
                            <p className="text-sm text-gray-700">{record.departments?.name_en}</p>
                          </div>
                        )}

                        {Object.keys(record.vitals || {}).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">Vitals</p>
                            <div className="flex gap-4 text-sm text-gray-700">
                              {record.vitals.bp && <span>BP: {record.vitals.bp}</span>}
                              {record.vitals.temp && <span>Temp: {record.vitals.temp}</span>}
                              {record.vitals.weight && <span>Weight: {record.vitals.weight}</span>}
                              {record.vitals.heartRate && <span>HR: {record.vitals.heartRate}</span>}
                            </div>
                          </div>
                        )}

                        {record.prescriptions?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-2">Prescriptions</p>
                            <div className="flex flex-col gap-2">
                              {record.prescriptions.map((p, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                                  <p className="font-semibold text-gray-800">{p.medication_name}</p>
                                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                    {p.dosage && <span>Dosage: {p.dosage}</span>}
                                    {p.frequency && <span>Freq: {p.frequency}</span>}
                                    {p.duration && <span>Duration: {p.duration}</span>}
                                  </div>
                                  {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.notes && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

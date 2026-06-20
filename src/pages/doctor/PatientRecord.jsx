import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { formatApptDate } from '../../utils/booking'
import { motion } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp, CalendarDays, Stethoscope, Building2 } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'

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
    <DashboardLayout>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-display text-lg font-bold text-txt-primary mb-4">Patient Records</h1>
        {records.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border p-10 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-txt-primary font-semibold">No Records Found</p>
            <p className="text-txt-muted text-sm mt-1">No medical records found for this patient.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-surface border border-border p-4 mb-4">
              <p className="text-sm text-txt-muted">
                Patient: <span className="font-bold text-txt-primary">{records[0]?.patient_name}</span>
                <span className="text-txt-muted mx-2">|</span>
                Phone: <span className="font-bold text-txt-primary">{records[0]?.patient_phone}</span>
                <span className="text-txt-muted mx-2">|</span>
                {records.length} record(s)
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {records.map(record => (
                <motion.div key={record.id} className="rounded-2xl bg-surface border border-border" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
                  <div
                    onClick={() => toggleExpand(record.id)}
                    className="p-5 cursor-pointer hover:bg-surface-hover rounded-2xl transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-txt-muted flex items-center gap-1"><CalendarDays size={12} />{formatApptDate(record.created_at?.slice(0, 10))}</span>
                          {record.doctors?.name && (
                            <span className="text-xs text-txt-muted flex items-center gap-1"><Stethoscope size={12} />Dr. {record.doctors?.name}</span>
                          )}
                        </div>
                        <p className="font-bold text-txt-primary text-sm mb-1">{record.diagnosis}</p>
                        {record.notes && <p className="text-xs text-txt-muted line-clamp-2">{record.notes}</p>}
                      </div>
                      <span className="text-txt-muted text-sm">{expandedId === record.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                    </div>
                  </div>

                  {expandedId === record.id && (
                    <div className="border-t border-border p-5 space-y-4">
                      {record.departments?.name_en && (
                        <div>
                          <p className="text-xs font-semibold text-txt-muted mb-1 flex items-center gap-1"><Building2 size={12} /> Department</p>
                          <p className="text-sm text-txt-primary">{record.departments?.name_en}</p>
                        </div>
                      )}

                      {Object.keys(record.vitals || {}).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-txt-muted mb-1">Vitals</p>
                          <div className="flex flex-wrap gap-4 text-sm text-txt-primary">
                            {record.vitals.bp && <span>BP: {record.vitals.bp}</span>}
                            {record.vitals.temp && <span>Temp: {record.vitals.temp}</span>}
                            {record.vitals.weight && <span>Weight: {record.vitals.weight}</span>}
                            {record.vitals.heartRate && <span>HR: {record.vitals.heartRate}</span>}
                          </div>
                        </div>
                      )}

                      {record.prescriptions?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-txt-muted mb-2">Prescriptions</p>
                          <div className="flex flex-col gap-2">
                            {record.prescriptions.map((p, i) => (
                              <div key={i} className="bg-surface-hover rounded-lg p-3 text-sm">
                                <p className="font-semibold text-txt-primary">{p.medication_name}</p>
                                  <div className="flex flex-wrap gap-3 text-xs text-txt-muted mt-1">
                                  {p.dosage && <span>Dosage: {p.dosage}</span>}
                                  {p.frequency && <span>Freq: {p.frequency}</span>}
                                  {p.duration && <span>Duration: {p.duration}</span>}
                                </div>
                                {p.notes && <p className="text-xs text-txt-muted mt-1">{p.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <p className="text-xs font-semibold text-txt-muted mb-1">Notes</p>
                          <p className="text-sm text-txt-primary">{record.notes}</p>
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
    </DashboardLayout>
  )
}

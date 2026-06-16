import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export default function PatientMedicalHistory() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data } = await supabase
        .from('medical_records')
        .select('*, doctors(name), departments(name_en), prescriptions(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!ignore) { setRecords(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [navigate])

  return (
    <div className="page">
      <Navbar back="/" subtitle="Medical History" />
      <div className="page-content">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Loading...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No Medical Records</p>
            <p className="empty-state-desc">You have no medical records yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map(record => (
              <div key={record.id} className="card animate-fadeIn p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{record.doctors?.name}</p>
                    <p className="text-xs text-gray-400">{record.departments?.name_en}</p>
                  </div>
                  <span className="badge badge-primary">{record.created_at?.slice(0, 10)}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-400 mb-1">Diagnosis</p>
                  <p className="text-sm text-gray-800 font-medium">{record.diagnosis}</p>
                </div>
                {record.vitals && Object.keys(record.vitals).length > 0 && (
                  <div className="flex gap-3 flex-wrap mb-3">
                    {record.vitals.bp && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">BP: {record.vitals.bp}</span>}
                    {record.vitals.temp && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">Temp: {record.vitals.temp}</span>}
                    {record.vitals.weight && <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Weight: {record.vitals.weight}</span>}
                    {record.vitals.heartRate && <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">HR: {record.vitals.heartRate}</span>}
                  </div>
                )}
                {record.notes && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{record.notes}</p>
                  </div>
                )}
                {record.prescriptions?.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-2">Prescriptions</p>
                    <div className="flex flex-col gap-1.5">
                      {record.prescriptions.map((p, i) => (
                        <div key={i} className="text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                          <span className="font-semibold">{p.medication_name}</span>
                          {p.dosage && ` — ${p.dosage}`}
                          {p.frequency && ` · ${p.frequency}`}
                          {p.duration && ` · ${p.duration}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

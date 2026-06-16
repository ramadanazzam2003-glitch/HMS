import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

export default function LabOrders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useUI()
  const [doctor, setDoctor] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (ignore || !doctorData) { setLoading(false); return }
      setDoctor(doctorData)

      const { data } = await supabase
        .from('medical_records')
        .select('*, prescriptions(*), departments(name_en)')
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false })

      if (!ignore) { setRecords(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  const filtered = records.filter(r =>
    !search || r.patient_name?.toLowerCase().includes(search.toLowerCase()) || r.patient_phone?.includes(search)
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Lab Orders & Prescriptions" />
      <div className="page-content-lg">
        <div className="card p-4 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9" placeholder="Search by patient name or phone..." />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">💊</div>
            <p className="empty-state-title">No Records Found</p>
            <p className="empty-state-desc">No medical records with prescriptions yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(record => (
              <div key={record.id} className="card animate-fadeIn p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{record.patient_name}</p>
                    <p className="text-xs text-gray-400">{record.patient_phone} · {record.departments?.name_en}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Diagnosis: {record.diagnosis}</p>
                  </div>
                  <span className="badge badge-primary">{record.created_at?.slice(0, 10)}</span>
                </div>
                {record.prescriptions?.length > 0 ? (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-semibold mb-2">Prescriptions ({record.prescriptions.length})</p>
                    <div className="flex flex-col gap-2">
                      {record.prescriptions.map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.medication_name}</p>
                            <p className="text-xs text-gray-400">
                              {p.dosage && `${p.dosage} · `}
                              {p.frequency && `${p.frequency} · `}
                              {p.duration || 'No duration'}
                            </p>
                          </div>
                          {p.notes && <p className="text-xs text-gray-500 max-w-[200px] truncate">{p.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No prescriptions attached</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

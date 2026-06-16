import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useUI } from '../../hooks/useUI'

export default function MedicationTracking() {
  const navigate = useNavigate()
  const { toast } = useUI()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select('*, medical_records(patient_name, patient_phone, doctor_id, created_at, diagnosis)')
        .order('created_at', { ascending: false })

      if (!ignore) { setPrescriptions(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = prescriptions.filter(p => {
    const matchSearch = !search ||
      p.medication_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.medical_records?.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.medical_records?.patient_phone?.includes(search)
    return matchSearch
  })

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Medication Tracking" />
      <div className="page-content-lg">
        <div className="card p-4 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9" placeholder="Search by medication, patient name, or phone..." />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">💊</div>
            <p className="empty-state-title">No Prescriptions</p>
            <p className="empty-state-desc">{search ? 'No results match your search.' : 'No prescriptions found.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p, i) => (
              <div key={p.id} className="card p-4 animate-fadeIn"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{p.medication_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.dosage && `${p.dosage} · `}
                      {p.frequency && `${p.frequency} · `}
                      {p.duration || 'No duration'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {p.medical_records?.patient_name}
                      </span>
                      <span className="text-xs text-gray-400">{p.medical_records?.patient_phone}</span>
                    </div>
                    {p.medical_records?.diagnosis && (
                      <p className="text-xs text-gray-400 mt-1">Diagnosis: {p.medical_records.diagnosis}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{p.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-2.5 text-xs text-gray-400 mt-4">
          Showing {filtered.length} of {prescriptions.length} prescriptions
        </div>
      </div>
    </div>
  )
}

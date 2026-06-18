import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

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
    <DashboardLayout>
      <div className="space-y-5">
        <h1 className="font-display text-lg font-bold text-txt-primary">Lab Orders & Prescriptions</h1>

        <div className="rounded-2xl bg-surface border border-border p-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-txt-muted">🔍</span>
            <Input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9" placeholder="Search by patient name or phone..." />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-surface border border-border p-10 text-center">
            <p className="text-txt-primary font-semibold">No Records Found</p>
            <p className="text-txt-muted text-sm mt-1">No medical records with prescriptions yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(record => (
              <div key={record.id} className="rounded-2xl bg-surface border border-border p-5 animate-fadeIn">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-txt-primary text-sm">{record.patient_name}</p>
                    <p className="text-xs text-txt-muted">{record.patient_phone} · {record.departments?.name_en}</p>
                    <p className="text-xs text-txt-muted mt-0.5">Diagnosis: {record.diagnosis}</p>
                  </div>
                  <Badge variant="primary">{record.created_at?.slice(0, 10)}</Badge>
                </div>
                {record.prescriptions?.length > 0 ? (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-primary font-semibold mb-2">Prescriptions ({record.prescriptions.length})</p>
                    <div className="flex flex-col gap-2">
                      {record.prescriptions.map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-surface rounded-lg p-3 border border-blue-100">
                          <div>
                            <p className="font-semibold text-txt-primary text-sm">{p.medication_name}</p>
                            <p className="text-xs text-txt-muted">
                              {p.dosage && `${p.dosage} · `}
                              {p.frequency && `${p.frequency} · `}
                              {p.duration || 'No duration'}
                            </p>
                          </div>
                          {p.notes && <p className="text-xs text-txt-muted max-w-[200px] truncate">{p.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-txt-muted italic">No prescriptions attached</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

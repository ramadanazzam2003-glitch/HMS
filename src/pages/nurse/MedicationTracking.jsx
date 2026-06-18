import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
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
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-txt-muted">🔍</span>
              <Input value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9" placeholder="Search by medication, patient name, or phone..." />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">💊</div>
              <p className="font-semibold text-txt-primary">No Prescriptions</p>
              <p className="text-txt-muted text-sm mt-1">{search ? 'No results match your search.' : 'No prescriptions found.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p, i) => (
              <div key={p.id} className="rounded-2xl bg-surface border border-border p-4 shadow-card animate-fadeIn"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-txt-primary text-sm">{p.medication_name}</p>
                    <p className="text-xs text-txt-muted mt-0.5">
                      {p.dosage && `${p.dosage} · `}
                      {p.frequency && `${p.frequency} · `}
                      {p.duration || 'No duration'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                        {p.medical_records?.patient_name}
                      </span>
                      <span className="text-xs text-txt-muted">{p.medical_records?.patient_phone}</span>
                    </div>
                    {p.medical_records?.diagnosis && (
                      <p className="text-xs text-txt-muted mt-1">Diagnosis: {p.medical_records.diagnosis}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-txt-muted shrink-0">{p.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-2.5 text-xs text-txt-muted">
          Showing {filtered.length} of {prescriptions.length} prescriptions
        </div>
      </div>
    </DashboardLayout>
  )
}

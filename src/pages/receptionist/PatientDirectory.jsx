import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function PatientDirectory() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('patient_name, phone, age, booking_date, status, departments(name_en)')
        .order('created_at', { ascending: false })

      const uniquePatients = {}
      data?.forEach(b => {
        const key = b.phone
        if (!uniquePatients[key]) {
          uniquePatients[key] = {
            name: b.patient_name,
            phone: b.phone,
            age: b.age,
            lastVisit: b.booking_date,
            department: b.departments?.name_en,
            totalVisits: 0,
          }
        }
        uniquePatients[key].totalVisits++
        if (b.booking_date > uniquePatients[key].lastVisit) {
          uniquePatients[key].lastVisit = b.booking_date
          uniquePatients[key].department = b.departments?.name_en
        }
      })

      if (!ignore) { setPatients(Object.values(uniquePatients)); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = patients.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-txt-muted">🔍</span>
              <Input value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9" placeholder="Search by name or phone..." />
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
              <div className="text-4xl mb-4">👥</div>
              <p className="font-semibold text-txt-primary">No Patients Found</p>
              <p className="text-txt-muted text-sm mt-1">{search ? 'No patients match your search.' : 'No patients in the system yet.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p, i) => (
              <div key={p.phone} className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-3 shadow-card animate-fadeIn"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {p.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-txt-primary text-sm">{p.name}</p>
                    <p className="text-xs text-txt-muted">{p.phone} {p.age ? `· Age ${p.age}` : ''}</p>
                    <p className="text-xs text-txt-muted">Last: {p.lastVisit} · {p.totalVisits} visit(s)</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/receptionist/check-in-out')}
                  className="text-primary">View →</Button>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-2.5 text-xs text-txt-muted">
          Showing {filtered.length} of {patients.length} patients
        </div>
      </div>
    </DashboardLayout>
  )
}

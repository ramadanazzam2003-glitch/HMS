import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

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
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Patient Directory" />
      <div className="page-content-lg">
        <div className="card p-4 mb-5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-gray-400">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9" placeholder="Search by name or phone..." />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-title">No Patients Found</p>
            <p className="empty-state-desc">{search ? 'No patients match your search.' : 'No patients in the system yet.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p, i) => (
              <div key={p.phone} className="card p-4 flex items-center justify-between gap-3 animate-fadeIn"
                style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                    {p.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.phone} {p.age ? `· Age ${p.age}` : ''}</p>
                    <p className="text-xs text-gray-400">Last: {p.lastVisit} · {p.totalVisits} visit(s)</p>
                  </div>
                </div>
                <button onClick={() => navigate('/receptionist/check-in-out')}
                  className="btn btn-ghost btn-sm text-blue-600">View →</button>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-2.5 text-xs text-gray-400 mt-4">
          Showing {filtered.length} of {patients.length} patients
        </div>
      </div>
    </div>
  )
}

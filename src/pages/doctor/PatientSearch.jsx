import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { motion } from 'framer-motion'
import { Search, User, Phone, ArrowRight } from 'lucide-react'

export default function PatientSearch() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('patient_name, phone, booking_date, slot_time, status, departments(name_en), doctors(name)')
      .or(`phone.ilike.%${search}%,patient_name.ilike.%${search}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    const uniquePatients = {}
    bookings?.forEach(b => {
      const key = b.phone
      if (!uniquePatients[key]) {
        uniquePatients[key] = {
          name: b.patient_name,
          phone: b.phone,
          lastVisit: b.booking_date,
          department: b.departments?.name_en,
          doctor: b.doctors?.name,
          status: b.status,
        }
      }
    })

    setResults(Object.values(uniquePatients))
    setLoading(false)
  }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Patient Search" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="card p-5 mb-5">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="input pl-9" placeholder="Search by name or phone number..." />
              </div>
              <motion.button onClick={handleSearch} disabled={loading}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="btn btn-primary btn-md">
                {loading ? 'Searching...' : 'Search'}
              </motion.button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.99 }}
                  className="card p-5 cursor-pointer transition-all"
                  onClick={() => navigate(`/doctor/patient/${p.phone}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><User size={14} /> {p.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"><Phone size={12} /> {p.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">Last visit: {p.lastVisit} · {p.department}</p>
                    </div>
                    <span className="text-gray-400"><ArrowRight size={16} /></span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {searched && results.length === 0 && !loading && (
            <div className="card empty-state">
              <div className="empty-state-icon"><Search size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Results Found</p>
              <p className="empty-state-desc">No patients match "{search}"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

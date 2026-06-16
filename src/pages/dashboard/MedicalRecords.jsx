import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import MedicalRecordCard from '../../components/medical/MedicalRecordCard'

export default function MedicalRecords() {
  const navigate = useNavigate()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*, doctors(name), departments(name_en), prescriptions(*)')
        .order('created_at', { ascending: false })
      if (!ignore) { setRecords(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_phone?.includes(search) ||
      r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      r.doctors?.name?.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard" subtitle="Medical Records"
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input pl-9" placeholder="Search by patient, phone, diagnosis, doctor..." />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="spinner spinner-lg mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Loading...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><FileText size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Medical Records</p>
              <p className="empty-state-desc">{search ? 'Try adjusting your search.' : 'No medical records have been created yet.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((record, i) => (
                <motion.div key={record.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ scale: 1.005 }}>
                  <MedicalRecordCard
                    record={record}
                    onClick={() => {}}
                  />
                </motion.div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 text-xs text-gray-400 mt-4">
            Showing {filtered.length} of {records.length} records
          </div>
        </motion.div>
      </div>
    </div>
  )
}

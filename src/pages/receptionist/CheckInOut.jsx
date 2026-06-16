import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useUI } from '../../hooks/useUI'
import { motion } from 'framer-motion'
import { Search, CheckCircle, XCircle } from 'lucide-react'

export default function CheckInOut() {
  const navigate = useNavigate()
  const { toast } = useUI()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchQueue = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('bookings')
      .select('*, doctors(name), departments(name_en)')
      .eq('booking_date', today)
      .eq('status', 'active')
      .order('slot_time')

    setQueue(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      await fetchQueue()
      if (ignore) setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleMarkCompleted = async (id) => {
    const { error } = await supabase.from('bookings').update({ status: 'completed' }).eq('id', id)
    if (error) {
      toast('Error: ' + error.message, { type: 'error' })
    } else {
      toast('Patient marked as completed', { type: 'success' })
      fetchQueue()
    }
  }

  const handleMarkNoShow = async (id) => {
    const { error } = await supabase.from('bookings').update({ status: 'no_show' }).eq('id', id)
    if (error) {
      toast('Error: ' + error.message, { type: 'error' })
    } else {
      toast('Patient marked as no-show', { type: 'success' })
      fetchQueue()
    }
  }

  const filtered = queue.filter(b =>
    !search || b.patient_name?.toLowerCase().includes(search.toLowerCase()) || b.phone?.includes(search)
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Check-In / Check-Out" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="card p-4 mb-5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
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
              <div className="empty-state-icon"><CheckCircle size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Patients</p>
              <p className="empty-state-desc">No patients in queue today.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[55px]">
                      <p className="text-sm font-bold text-blue-600">{b.slot_time}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-3">
                      <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">{b.phone} · {b.doctors?.name}</p>
                      <p className="text-xs text-gray-400">{b.departments?.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-success">Active</span>
                    <motion.button onClick={() => handleMarkCompleted(b.id)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn btn-primary btn-sm text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Complete
                    </motion.button>
                    <motion.button onClick={() => handleMarkNoShow(b.id)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn btn-ghost btn-sm text-red-500 text-xs flex items-center gap-1">
                      <XCircle size={12} /> No Show
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { motion } from 'framer-motion'
import { Users, Hash } from 'lucide-react'

export default function PatientQueue() {
  const navigate = useNavigate()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en)')
        .eq('booking_date', today)
        .order('slot_time')

      if (!ignore) { setQueue(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = queue.filter(b => filter === 'all' || b.status === filter)

  const stats = {
    active: queue.filter(b => b.status === 'active').length,
    completed: queue.filter(b => b.status === 'completed').length,
    cancelled: queue.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Patient Queue" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <motion.div className="card p-4 text-center bg-green-50 border-green-200" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="font-display text-3xl font-extrabold text-green-600">{stats.active}</p>
              <p className="text-xs text-green-600">Waiting</p>
            </motion.div>
            <motion.div className="card p-4 text-center bg-blue-50 border-blue-200" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="font-display text-3xl font-extrabold text-blue-600">{stats.completed}</p>
              <p className="text-xs text-blue-600">Completed</p>
            </motion.div>
            <motion.div className="card p-4 text-center bg-red-50 border-red-200" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="font-display text-3xl font-extrabold text-red-500">{stats.cancelled}</p>
              <p className="text-xs text-red-500">Cancelled</p>
            </motion.div>
          </div>

          <div className="flex gap-2 mb-5">
            {['active', 'completed', 'cancelled', 'all'].map(f => (
              <motion.button key={f} onClick={() => setFilter(f)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`btn btn-md capitalize ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                {f}
              </motion.button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner spinner-lg mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><Users size={48} className="text-gray-300" /></div>
              <p className="empty-state-title">No Patients</p>
              <p className="empty-state-desc">No patients match this filter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                      <Hash size={14} /> {b.queue_number || i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">{b.slot_time} · {b.doctors?.name} · {b.departments?.name_en}</p>
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                    {b.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

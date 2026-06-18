import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
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
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <motion.div className="rounded-2xl p-5 bg-green-50 border border-green-200 text-center" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="text-3xl font-extrabold text-green-600">{stats.active}</p>
              <p className="text-xs text-green-600 font-semibold mt-1">Waiting</p>
            </motion.div>
            <motion.div className="rounded-2xl p-5 bg-blue-50 border border-blue-200 text-center" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="text-3xl font-extrabold text-blue-600">{stats.completed}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">Completed</p>
            </motion.div>
            <motion.div className="rounded-2xl p-5 bg-red-50 border border-red-200 text-center" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <p className="text-3xl font-extrabold text-red-500">{stats.cancelled}</p>
              <p className="text-xs text-red-500 font-semibold mt-1">Cancelled</p>
            </motion.div>
          </div>

          <div className="flex gap-2 mb-5">
            {['active', 'completed', 'cancelled', 'all'].map(f => (
              <Button key={f} variant={filter === f ? 'primary' : 'outline'} size="sm"
                onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Skeleton className="h-8 w-8 rounded-full mb-4" />
              <p className="text-txt-muted font-medium">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4"><Users size={48} className="text-txt-muted mx-auto" /></div>
                <p className="font-semibold text-txt-primary">No Patients</p>
                <p className="text-txt-muted text-sm mt-1">No patients match this filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-3 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      <Hash size={14} /> {b.queue_number || i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                      <p className="text-xs text-txt-muted">{b.slot_time} · {b.doctors?.name} · {b.departments?.name_en}</p>
                    </div>
                  </div>
                  <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                    {b.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

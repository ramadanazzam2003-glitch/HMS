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
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none"><Search size={16} /></span>
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9" placeholder="Search by name or phone..." />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Skeleton className="h-8 w-8 rounded-full mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mb-4"><CheckCircle size={48} className="text-txt-muted mx-auto" /></div>
                <p className="font-semibold text-txt-primary">No Patients</p>
                <p className="text-txt-muted text-sm mt-1">No patients in queue today.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between gap-3 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[55px]">
                      <p className="text-sm font-bold text-primary">{b.slot_time}</p>
                    </div>
                    <div className="border-s border-border ps-3">
                      <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                      <p className="text-xs text-txt-muted">{b.phone} · {b.doctors?.name}</p>
                      <p className="text-xs text-txt-muted">{b.departments?.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success">Active</Badge>
                    <Button size="sm" onClick={() => handleMarkCompleted(b.id)}
                      className="text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Complete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleMarkNoShow(b.id)}
                      className="text-xs flex items-center gap-1 text-danger">
                      <XCircle size={12} /> No Show
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

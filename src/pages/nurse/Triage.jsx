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
import { Users, Clock, Stethoscope } from 'lucide-react'

export default function NurseTriage() {
  const navigate = useNavigate()
  const { toast } = useUI()
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', heartRate: '', height: '', oxygenSat: '' })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en)')
        .eq('booking_date', today)
        .eq('status', 'active')
        .order('slot_time')

      if (!ignore) { setQueue(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleSaveVitals = async () => {
    if (!selectedBooking) return
    setSaving(true)

    const vitalsStr = Object.entries(vitals)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')

    const notesText = [vitalsStr, notes.trim()].filter(Boolean).join('\n')

    const { error } = await supabase
      .from('bookings')
      .update({ notes: notesText || null })
      .eq('id', selectedBooking.id)

    if (error) {
      toast('Error saving vitals: ' + error.message, { type: 'error' })
    } else {
      toast('Vitals saved successfully', { type: 'success' })
      setSelectedBooking(null)
      setVitals({ bp: '', temp: '', weight: '', heartRate: '', height: '', oxygenSat: '' })
      setNotes('')
    }
    setSaving(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-bold text-txt-primary text-sm mb-4 flex items-center gap-2"><Users size={16} /> Patient Queue ({queue.length})</h3>
                  {loading ? (
                    <div className="flex justify-center py-6"><Skeleton className="h-8 w-8 rounded-full" /></div>
                  ) : queue.length === 0 ? (
                    <p className="text-txt-muted text-center py-6 text-sm">No patients in queue</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {queue.map(b => (
                        <motion.button key={b.id} onClick={() => setSelectedBooking(b)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            selectedBooking?.id === b.id
                              ? 'bg-primary-light border-primary'
                              : 'bg-surface-hover border-transparent hover:border-border'
                          }`}>
                          <p className="font-semibold text-txt-primary text-sm">{b.patient_name}</p>
                          <p className="text-xs text-txt-muted flex items-center gap-1"><Clock size={10} /> {b.slot_time} · {b.doctors?.name}</p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {selectedBooking ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <h3 className="font-bold text-txt-primary text-base">{selectedBooking.patient_name}</h3>
                          <p className="text-xs text-txt-muted">{selectedBooking.phone} · {selectedBooking.departments?.name_en}</p>
                        </div>
                        <Badge variant="success" className="flex items-center gap-1"><Clock size={12} /> {selectedBooking.slot_time}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                        {[
                          { key: 'bp', label: 'Blood Pressure', placeholder: '120/80' },
                          { key: 'temp', label: 'Temperature', placeholder: '37.0 C' },
                          { key: 'weight', label: 'Weight', placeholder: '70 kg' },
                          { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm' },
                          { key: 'height', label: 'Height', placeholder: '170 cm' },
                          { key: 'oxygenSat', label: 'O₂ Saturation', placeholder: '98%' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <label className="text-xs text-txt-muted mb-1 block">{label}</label>
                            <Input value={vitals[key]} onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                              className="text-sm" placeholder={placeholder} />
                          </div>
                        ))}
                      </div>

                      <div className="mb-5">
                        <label className="text-xs text-txt-muted mb-1 block">Nurse Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                          className="flex h-10 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[80px] resize-y"
                          placeholder="Observations, symptoms reported by patient..." />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleSaveVitals} disabled={saving} className="flex-1">
                          {saving ? 'Saving...' : 'Save Vitals'}
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedBooking(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="mb-4"><Stethoscope size={48} className="text-txt-muted mx-auto" /></div>
                    <p className="text-txt-muted font-medium">Select a patient from the queue to record vitals</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

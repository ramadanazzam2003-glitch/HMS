import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
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
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Triage / Vitals Entry" />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Users size={16} /> Patient Queue ({queue.length})</h3>
                {loading ? (
                  <div className="spinner spinner-lg mx-auto" />
                ) : queue.length === 0 ? (
                  <p className="text-gray-400 text-center py-6 text-sm">No patients in queue</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {queue.map(b => (
                      <motion.button key={b.id} onClick={() => setSelectedBooking(b)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          selectedBooking?.id === b.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-transparent hover:border-gray-200'
                        }`}>
                        <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> {b.slot_time} · {b.doctors?.name}</p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              {selectedBooking ? (
                <motion.div className="card p-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{selectedBooking.patient_name}</h3>
                      <p className="text-xs text-gray-400">{selectedBooking.phone} · {selectedBooking.departments?.name_en}</p>
                    </div>
                    <span className="badge badge-success flex items-center gap-1"><Clock size={12} /> {selectedBooking.slot_time}</span>
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
                        <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                        <input value={vitals[key]} onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                          className="input text-sm" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label className="input-label">Nurse Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      className="input text-sm min-h-[80px] resize-y"
                      placeholder="Observations, symptoms reported by patient..." />
                  </div>

                  <div className="flex gap-3">
                    <motion.button onClick={handleSaveVitals} disabled={saving}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="btn btn-primary btn-md flex-1">
                      {saving ? 'Saving...' : 'Save Vitals'}
                    </motion.button>
                    <button onClick={() => setSelectedBooking(null)} className="btn btn-secondary btn-md">Cancel</button>
                  </div>
                </motion.div>
              ) : (
                <div className="card p-12 text-center">
                  <div className="mb-4"><Stethoscope size={48} className="text-gray-300 mx-auto" /></div>
                  <p className="text-gray-400 font-medium">Select a patient from the queue to record vitals</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

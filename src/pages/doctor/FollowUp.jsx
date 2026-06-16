import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function FollowUp() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useUI()
  const [doctor, setDoctor] = useState(null)
  const [recentPatients, setRecentPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [form, setForm] = useState({ booking_date: '', slot_time: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [bookedSlots, setBookedSlots] = useState([])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (ignore || !doctorData) { setLoading(false); return }
      setDoctor(doctorData)

      const { data } = await supabase
        .from('medical_records')
        .select('*, departments(name_en)')
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false })
        .limit(20)

      const unique = {}
      data?.forEach(r => {
        if (!unique[r.patient_phone]) {
          unique[r.patient_phone] = {
            name: r.patient_name,
            phone: r.patient_phone,
            department: r.departments?.name_en,
            departmentId: r.department_id,
            lastVisit: r.created_at?.slice(0, 10),
            diagnosis: r.diagnosis,
          }
        }
      })

      if (!ignore) { setRecentPatients(Object.values(unique)); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [user?.id])

  useEffect(() => {
    if (!selectedPatient || !form.booking_date) return
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('slot_time')
        .eq('doctor_id', doctor?.id)
        .eq('booking_date', form.booking_date)
        .eq('status', 'active')
      if (!ignore) setBookedSlots(data?.map(b => b.slot_time) || [])
    }
    load()
    return () => { ignore = true }
  }, [selectedPatient, form.booking_date, doctor?.id])

  const handleSchedule = async () => {
    if (!selectedPatient || !form.booking_date || !form.slot_time) {
      return toast('Please fill all required fields', { type: 'error' })
    }
    setSaving(true)

    const bookingRef = 'BK-' + Date.now().toString().slice(-6)

    const { error } = await supabase.from('bookings').insert({
      booking_ref: bookingRef,
      patient_name: selectedPatient.name,
      phone: selectedPatient.phone,
      doctor_id: doctor.id,
      department_id: selectedPatient.departmentId,
      booking_date: form.booking_date,
      slot_time: form.slot_time,
      notes: form.notes || `Follow-up from previous visit`,
      status: 'active',
    })

    if (error) {
      toast('Error: ' + error.message, { type: 'error' })
    } else {
      toast('Follow-up scheduled successfully', { type: 'success' })
      setSelectedPatient(null)
      setForm({ booking_date: '', slot_time: '', notes: '' })
    }
    setSaving(false)
  }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/doctor" subtitle="Schedule Follow-Up" />
      <div className="page-content-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner spinner-lg mx-auto mb-4" />
          </div>
        ) : !selectedPatient ? (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-4">Recent Patients</h3>
            {recentPatients.length === 0 ? (
              <div className="card empty-state">
                <div className="empty-state-icon">👥</div>
                <p className="empty-state-title">No Patients</p>
                <p className="empty-state-desc">No recent patients found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentPatients.map((p, i) => (
                  <button key={p.phone} onClick={() => setSelectedPatient(p)}
                    className="card p-4 flex items-center justify-between gap-3 text-left animate-fadeIn hover:shadow-md transition-all"
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.phone} · {p.department}</p>
                      <p className="text-xs text-gray-400">Last visit: {p.lastVisit}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Diagnosis: {p.diagnosis}</p>
                    </div>
                    <span className="text-lg text-gray-400">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 animate-fadeIn">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedPatient.name}</h3>
                <p className="text-xs text-gray-400">{selectedPatient.phone} · {selectedPatient.department}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="btn btn-ghost btn-sm text-gray-500">← Change</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Follow-Up Date *</label>
                <input type="date" value={form.booking_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm({ ...form, booking_date: e.target.value, slot_time: '' })}
                  className="input" />
              </div>

              {form.booking_date && (
                <div>
                  <label className="input-label">Available Slots *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(doctor?.slots || []).map(slot => {
                      const isBooked = bookedSlots.includes(slot)
                      const isSelected = form.slot_time === slot
                      return (
                        <button key={slot} disabled={isBooked}
                          onClick={() => setForm({ ...form, slot_time: slot })}
                          className={`rounded-xl p-2.5 text-sm font-semibold border-2 transition-all ${
                            isBooked ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                            : isSelected ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-800 border-gray-100 cursor-pointer hover:border-blue-300'
                          }`}>
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input text-sm min-h-[80px] resize-y"
                  placeholder="Follow-up reason or instructions..." />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSchedule} disabled={saving || !form.slot_time}
                  className="btn btn-primary btn-md flex-1">
                  {saving ? 'Scheduling...' : 'Schedule Follow-Up'}
                </button>
                <button onClick={() => setSelectedPatient(null)} className="btn btn-secondary btn-md">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

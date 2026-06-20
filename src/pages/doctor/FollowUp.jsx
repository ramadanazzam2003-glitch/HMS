import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

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
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="font-display text-lg font-bold text-txt-primary">Schedule Follow-Up</h1>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !selectedPatient ? (
          <div>
            <h3 className="font-bold text-txt-primary text-sm mb-4">Recent Patients</h3>
            {recentPatients.length === 0 ? (
              <div className="rounded-2xl bg-surface border border-border p-10 text-center">
                <p className="text-txt-primary font-semibold">No Patients</p>
                <p className="text-txt-muted text-sm mt-1">No recent patients found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentPatients.map((p, i) => (
                  <button key={p.phone} onClick={() => setSelectedPatient(p)}
                    className="rounded-2xl bg-surface border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left animate-fadeIn hover:shadow-md transition-all"
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div>
                      <p className="font-semibold text-txt-primary text-sm">{p.name}</p>
                      <p className="text-xs text-txt-muted">{p.phone} · {p.department}</p>
                      <p className="text-xs text-txt-muted">Last visit: {p.lastVisit}</p>
                      <p className="text-xs text-primary mt-0.5">Diagnosis: {p.diagnosis}</p>
                    </div>
                    <span className="text-lg text-txt-muted">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface border border-border p-6 animate-fadeIn">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="font-bold text-txt-primary text-base">{selectedPatient.name}</h3>
                <p className="text-xs text-txt-muted">{selectedPatient.phone} · {selectedPatient.department}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>← Change</Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Follow-Up Date *</label>
                <Input type="date" value={form.booking_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm({ ...form, booking_date: e.target.value, slot_time: '' })} />
              </div>

              {form.booking_date && (
                <div>
                  <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Available Slots *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(doctor?.slots || []).map(slot => {
                      const isBooked = bookedSlots.includes(slot)
                      const isSelected = form.slot_time === slot
                      return (
                        <button key={slot} disabled={isBooked}
                          onClick={() => setForm({ ...form, slot_time: slot })}
                          className={`rounded-xl p-2.5 text-sm font-semibold border-2 transition-all ${
                            isBooked ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed line-through'
                            : isSelected ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-txt-primary border-border cursor-pointer hover:border-primary/50'
                          }`}>
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-txt-secondary mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="flex h-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[80px] resize-y"
                  placeholder="Follow-up reason or instructions..." />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="md" className="flex-1" onClick={handleSchedule} disabled={saving || !form.slot_time}>
                  {saving ? 'Scheduling...' : 'Schedule Follow-Up'}
                </Button>
                <Button variant="outline" size="md" onClick={() => setSelectedPatient(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

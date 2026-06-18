import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useUI } from '../../hooks/useUI'
import PrescriptionBuilder from '../../components/medical/PrescriptionBuilder'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function EditRecord() {
  const navigate = useNavigate()
  const { recordId } = useParams()
  const { toast } = useUI()

  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [vitals, setVitals] = useState({ bp: '', temp: '', weight: '', heartRate: '' })
  const [prescriptions, setPrescriptions] = useState([])

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*, prescriptions(*)')
        .eq('id', recordId)
        .single()

      if (ignore || !data) { setLoading(false); return }
      setRecord(data)
      setDiagnosis(data.diagnosis || '')
      setNotes(data.notes || '')
      setVitals({
        bp: data.vitals?.bp || '',
        temp: data.vitals?.temp || '',
        weight: data.vitals?.weight || '',
        heartRate: data.vitals?.heartRate || '',
      })
      setPrescriptions(data.prescriptions?.map(p => ({
        medication_name: p.medication_name,
        dosage: p.dosage || '',
        frequency: p.frequency || '',
        duration: p.duration || '',
        notes: p.notes || '',
      })) || [])
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [recordId])

  const handleSave = async () => {
    if (!diagnosis.trim()) return toast('Diagnosis is required', { type: 'error' })
    setSaving(true)

    const { error: updateError } = await supabase
      .from('medical_records')
      .update({
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || null,
        vitals: Object.fromEntries(Object.entries(vitals).filter(([, v]) => v.trim())),
      })
      .eq('id', recordId)

    if (updateError) {
      toast('Error: ' + updateError.message, { type: 'error' })
      setSaving(false)
      return
    }

    await supabase.from('prescriptions').delete().eq('medical_record_id', recordId)

    if (prescriptions.length > 0) {
      const prescriptionData = prescriptions.map(p => ({
        medical_record_id: recordId,
        medication_name: p.medication_name,
        dosage: p.dosage || null,
        frequency: p.frequency || null,
        duration: p.duration || null,
        notes: p.notes || null,
      }))
      await supabase.from('prescriptions').insert(prescriptionData)
    }

    toast('Record updated successfully', { type: 'success' })
    navigate(-1)
    setSaving(false)
  }

  if (loading) return (
    <DashboardLayout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </DashboardLayout>
  )

  if (!record) return (
    <DashboardLayout>
      <div className="rounded-2xl bg-surface border border-border p-10 text-center">
        <p className="text-txt-primary font-semibold mb-4">Record not found</p>
        <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-txt-primary">Edit Medical Record</h1>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="font-bold text-txt-primary text-sm mb-3">Patient Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-txt-muted">Name</span>
              <span className="font-semibold text-txt-primary">{record.patient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Phone</span>
              <span className="font-semibold text-txt-primary">{record.patient_phone}</span>
            </div>
            {record.patient_age && (
              <div className="flex justify-between">
                <span className="text-txt-muted">Age</span>
                <span className="font-semibold text-txt-primary">{record.patient_age}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="font-bold text-txt-primary text-sm mb-3">Vitals</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'bp', label: 'Blood Pressure', placeholder: '120/80' },
              { key: 'temp', label: 'Temperature', placeholder: '37.0 C' },
              { key: 'weight', label: 'Weight', placeholder: '70 kg' },
              { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-txt-muted mb-1 block">{label}</label>
                <Input value={vitals[key]} onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                  placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="font-bold text-txt-primary text-sm mb-3">Diagnosis *</h3>
          <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
            className="flex h-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[100px] resize-y" placeholder="Enter diagnosis..." />
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5">
          <h3 className="font-bold text-txt-primary text-sm mb-3">Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="flex h-auto w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[80px] resize-y" placeholder="Additional notes..." />
        </div>

        <div className="rounded-2xl bg-surface border border-border p-5">
          <PrescriptionBuilder prescriptions={prescriptions} onChange={setPrescriptions} />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" size="md" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" size="md" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

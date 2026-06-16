import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useUI } from '../../hooks/useUI'
import PrescriptionBuilder from '../../components/medical/PrescriptionBuilder'

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
    <div className="page">
      <Navbar variant="dashboard" back={-1} subtitle="Edit Record" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  if (!record) return (
    <div className="page">
      <Navbar variant="dashboard" back={-1} subtitle="Edit Record" />
      <div className="page-content-lg">
        <div className="card empty-state">
          <p className="empty-state-title">Record not found</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary btn-md mt-4">Go Back</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back={-1} subtitle="Edit Medical Record"
        right={
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />
      <div className="page-content-lg">
        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Patient Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="font-semibold text-gray-800">{record.patient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone</span>
              <span className="font-semibold text-gray-800">{record.patient_phone}</span>
            </div>
            {record.patient_age && (
              <div className="flex justify-between">
                <span className="text-gray-400">Age</span>
                <span className="font-semibold text-gray-800">{record.patient_age}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Vitals</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'bp', label: 'Blood Pressure', placeholder: '120/80' },
              { key: 'temp', label: 'Temperature', placeholder: '37.0 C' },
              { key: 'weight', label: 'Weight', placeholder: '70 kg' },
              { key: 'heartRate', label: 'Heart Rate', placeholder: '72 bpm' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input value={vitals[key]} onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                  className="input text-sm" placeholder={placeholder} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Diagnosis *</h3>
          <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
            className="input text-sm min-h-[100px] resize-y" placeholder="Enter diagnosis..." />
        </div>

        <div className="card p-5 mb-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Notes</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="input text-sm min-h-[80px] resize-y" placeholder="Additional notes..." />
        </div>

        <div className="card p-5 mb-4">
          <PrescriptionBuilder prescriptions={prescriptions} onChange={setPrescriptions} />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-md">Cancel</button>
        </div>
      </div>
    </div>
  )
}

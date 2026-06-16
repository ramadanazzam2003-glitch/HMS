import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const EMPTY_MED = { medication_name: '', dosage: '', frequency: '', duration: '', notes: '' }

export default function PrescriptionBuilder({ prescriptions = [], onChange }) {
  const [meds, setMeds] = useState(
    prescriptions.length > 0
      ? prescriptions.map(p => ({ ...p }))
      : [{ ...EMPTY_MED }]
  )

  const update = (index, field, value) => {
    const updated = meds.map((m, i) => i === index ? { ...m, [field]: value } : m)
    setMeds(updated)
    onChange(updated.filter(m => m.medication_name.trim()))
  }

  const addRow = () => {
    setMeds([...meds, { ...EMPTY_MED }])
  }

  const removeRow = (index) => {
    if (meds.length <= 1) return
    const updated = meds.filter((_, i) => i !== index)
    setMeds(updated)
    onChange(updated.filter(m => m.medication_name.trim()))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm">Prescriptions</h3>
        <button type="button" onClick={addRow} className="btn btn-ghost btn-sm text-blue-600 text-xs flex items-center gap-1">
          <Plus size={14} /> Add Medication
        </button>
      </div>

      {meds.map((med, i) => (
        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Medication {i + 1}</span>
            {meds.length > 1 && (
              <button type="button" onClick={() => removeRow(i)}
                className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1">
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>

          <input
            value={med.medication_name}
            onChange={(e) => update(i, 'medication_name', e.target.value)}
            className="input text-sm"
            placeholder="Medication name *"
          />

          <div className="grid grid-cols-3 gap-2">
            <input
              value={med.dosage}
              onChange={(e) => update(i, 'dosage', e.target.value)}
              className="input text-sm"
              placeholder="Dosage (e.g. 500mg)"
            />
            <input
              value={med.frequency}
              onChange={(e) => update(i, 'frequency', e.target.value)}
              className="input text-sm"
              placeholder="Frequency (e.g. 3x/day)"
            />
            <input
              value={med.duration}
              onChange={(e) => update(i, 'duration', e.target.value)}
              className="input text-sm"
              placeholder="Duration (e.g. 5 days)"
            />
          </div>

          <input
            value={med.notes}
            onChange={(e) => update(i, 'notes', e.target.value)}
            className="input text-sm"
            placeholder="Additional notes (optional)"
          />
        </div>
      ))}
    </div>
  )
}

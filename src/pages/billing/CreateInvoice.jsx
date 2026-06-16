import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useUI } from '../../hooks/useUI'
import { generateInvoiceNumber, calculateBillTotal, formatCurrency, BILL_ITEMS_PRESETS } from '../../utils/invoice'
import { motion } from 'framer-motion'
import { Plus, Trash2, StickyNote } from 'lucide-react'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const { toast } = useUI()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState(null)

  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [items, setItems] = useState([{ name: 'Consultation', amount: 200, quantity: 1 }])
  const [taxRate, setTaxRate] = useState(14)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      if (bookingId) {
        const { data: b } = await supabase
          .from('bookings')
          .select('*, doctors(name), departments(name_en)')
          .eq('id', bookingId)
          .single()

        if (!ignore && b) {
          setBooking(b)
          setPatientName(b.patient_name || '')
          setPatientPhone(b.phone || '')
        }
      }
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [bookingId])

  const totals = calculateBillTotal(items, taxRate)

  const addItem = (preset) => {
    setItems([...items, { ...preset }])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleSave = async () => {
    if (!patientName.trim()) {
      toast('Patient name is required', { type: 'error' })
      return
    }
    if (!patientPhone.trim()) {
      toast('Patient phone is required', { type: 'error' })
      return
    }
    if (items.length === 0 || items.every(i => !i.name.trim())) {
      toast('Add at least one bill item', { type: 'error' })
      return
    }

    setSaving(true)

    const { error } = await supabase.from('bills').insert({
      invoice_number: generateInvoiceNumber(),
      medical_record_id: null,
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim(),
      doctor_id: booking?.doctor_id || null,
      department_id: booking?.department_id || null,
      booking_id: booking?.id || null,
      items: items.filter(i => i.name.trim()),
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.taxAmount,
      total: totals.total,
      payment_status: 'unpaid',
      notes: notes.trim() || null,
    })

    if (error) {
      toast('Error creating invoice: ' + error.message, { type: 'error' })
      setSaving(false)
      return
    }

    toast('Invoice created successfully', { type: 'success' })
    navigate('/dashboard/billing')
  }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard/billing" subtitle="Create Invoice" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard/billing" subtitle="Create Invoice"
        right={
          <button onClick={handleSave} disabled={saving}
            className="btn btn-primary btn-sm">
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        }
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <motion.div className="card p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Patient Info</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Patient Name *</label>
                  <input value={patientName} onChange={e => setPatientName(e.target.value)}
                    className="input text-sm" placeholder="Patient name" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone *</label>
                  <input value={patientPhone} onChange={e => setPatientPhone(e.target.value)}
                    className="input text-sm" placeholder="Phone number" />
                </div>
                {booking && (
                  <div className="text-xs text-gray-400">
                    <p>Booking: <span className="font-mono text-blue-600">{booking.booking_ref}</span></p>
                    <p>Doctor: {booking.doctors?.name}</p>
                    <p>Dept: {booking.departments?.name_en}</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div className="card p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Quick Add Items</h3>
              <div className="flex flex-wrap gap-2">
                {BILL_ITEMS_PRESETS.map((preset, i) => (
                  <motion.button key={i} onClick={() => addItem(preset)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn btn-ghost btn-sm text-xs border border-gray-200 flex items-center gap-1">
                    <Plus size={12} /> {preset.name} ({formatCurrency(preset.amount)})
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="card p-5 mb-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Bill Items</h3>
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)}
                      className="input text-sm" placeholder="Item name" />
                    <input value={item.amount} onChange={e => updateItem(i, 'amount', parseFloat(e.target.value) || 0)}
                      type="number" className="input text-sm" placeholder="Amount" />
                    <input value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      type="number" className="input text-sm" placeholder="Qty" min="1" />
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(item.amount * item.quantity)}</p>
                  </div>
                  <motion.button onClick={() => removeItem(i)}
                    whileHover={{ scale: 1.1, color: '#dc2626' }} whileTap={{ scale: 0.9 }}
                    className="text-red-400 hover:text-red-600 text-sm">
                    <Trash2 size={14} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
            <motion.button onClick={() => addItem({ name: '', amount: 0, quantity: 1 })}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn btn-ghost btn-sm text-blue-600 text-xs mt-3 flex items-center gap-1">
              <Plus size={14} /> Add Custom Item
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <motion.div className="card p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1"><StickyNote size={14} /> Notes</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="input text-sm min-h-[80px] resize-y"
                placeholder="Invoice notes (optional)..." />
            </motion.div>

            <motion.div className="card p-5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <h3 className="font-bold text-gray-900 text-sm mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tax</span>
                  <div className="flex items-center gap-2">
                    <input value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                      type="number" className="input text-sm w-20 text-right" min="0" max="100" />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax Amount</span>
                  <span className="font-semibold">{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="font-display text-xl font-extrabold text-blue-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.button onClick={handleSave} disabled={saving}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-lg btn-full">
            {saving ? 'Creating Invoice...' : `Create Invoice — ${formatCurrency(totals.total)}`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

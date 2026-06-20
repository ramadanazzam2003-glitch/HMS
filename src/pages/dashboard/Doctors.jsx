import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Stethoscope, Pencil, Trash2, Plus, CalendarDays, Mail, Key, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

const DAYS_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']

const DAY_LABELS = { sat: 'Sat', sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' }

function DocForm({ type, showDocForm, docForm, setDocForm, slotsInput, setSlotsInput, editingDoc, saveDoc, setShowDocForm, setEditingDoc, departments, t, saving }) {
  const toggleDay = (day) => {
    const days = docForm.working_days || []
    setDocForm({ ...docForm, working_days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] })
  }

  if (!showDocForm || docForm.type !== type) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
      className="rounded-2xl p-6 bg-surface border border-border mb-4 shadow-sm">
      <h3 className="font-bold text-primary text-sm mb-4">{editingDoc ? t.editDoctor : t.addDoctor}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-txt-muted block mb-1.5">{t.doctorName} *</label>
          <Input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} placeholder="Dr. Ahmed Mohamed" />
        </div>
        <div>
          <label className="text-xs font-semibold text-txt-muted block mb-1.5">{t.department} *</label>
          <select value={docForm.department_id} onChange={e => setDocForm({ ...docForm, department_id: e.target.value })}
            className="h-9 px-3 rounded-xl border border-border bg-surface text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="">{t.department}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-txt-muted block mb-1.5">{t.timeSlots}</label>
          <Input value={slotsInput} onChange={e => setSlotsInput(e.target.value)} placeholder="09:00, 09:30, 10:00" />
        </div>
      </div>
      {!editingDoc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5 flex items-center gap-1"><Mail size={12} /> {t.email} *</label>
            <Input type="email" value={docForm.email || ''} onChange={e => setDocForm({ ...docForm, email: e.target.value })} placeholder="doctor@hospital.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-txt-muted block mb-1.5 flex items-center gap-1"><Key size={12} /> {t.password} *</label>
            <Input type="password" value={docForm.password || ''} onChange={e => setDocForm({ ...docForm, password: e.target.value })} placeholder="********" />
          </div>
        </div>
      )}
      <div className="mb-4">
        <label className="text-xs font-semibold text-txt-muted block mb-1.5">{t.workingDays}</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_KEYS.map(dayKey => {
            const active = (docForm.working_days || []).includes(dayKey)
            return (
              <button key={dayKey} onClick={() => toggleDay(dayKey)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  active ? 'bg-primary text-white' : 'bg-surface text-txt-secondary border border-border'
                }`}>
                {t[dayKey] || DAY_LABELS[dayKey]}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2.5">
        <Button size="sm" onClick={saveDoc} disabled={saving}>{saving ? '...' : (editingDoc ? t.save : t.save)}</Button>
        <Button variant="outline" size="sm" onClick={() => { setShowDocForm(false); setEditingDoc(null) }}>{t.cancel}</Button>
      </div>
    </motion.div>
  )
}

function DocList({ type, doctors, toggleDocActive, startEditDoc, deleteDoc, t }) {
  const list = doctors.filter(d => d.type === type)
  if (list.length === 0) return (
    <div className="rounded-2xl p-8 text-center border-2 border-dashed border-border">
      <p className="text-txt-muted text-sm">{t.noDoctorsAssigned}</p>
    </div>
  )

  return (
    <div className="space-y-2.5">
      {list.map((doc, i) => (
        <motion.div key={doc.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-txt-primary text-sm mb-0.5">{doc.name}</p>
            <p className="text-xs text-txt-muted">{doc.departments?.name_en} &middot; {(doc.slots || []).length} slots</p>
            {doc.working_days?.length > 0 && (
              <p className="text-[11px] text-txt-muted mt-0.5 flex items-center gap-1"><CalendarDays size={12} /> {doc.working_days.map(d => d.slice(0, 3)).join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={() => toggleDocActive(doc)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                doc.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
              }`}>
              {doc.is_active ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => startEditDoc(doc)} className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"><Pencil size={14} /></button>
            <button onClick={() => deleteDoc(doc.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function Doctors() {
  const { hasPermission } = useAuth()
  const { toast, confirm } = useUI()
  const { t, isRTL } = useLanguage()

  const [departments, setDepartments] = useState([])
  const [doctorsList, setDoctorsList] = useState([])
  const [loading, setLoading] = useState(true)

  const [docForm, setDocForm] = useState({ name: '', type: 'doctor', department_id: '', working_days: [], slots: [], is_active: true, email: '', password: '' })
  const [editingDoc, setEditingDoc] = useState(null)
  const [showDocForm, setShowDocForm] = useState(false)
  const [slotsInput, setSlotsInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const { data: depts } = await supabase.from('departments').select('*').order('name_en')
    const { data: docs }  = await supabase.from('doctors').select('*, departments(name_en)').order('name')
    setDepartments(depts || [])
    setDoctorsList(docs || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      setLoading(true)
      const { data: depts } = await supabase.from('departments').select('*').order('name_en')
      const { data: docs }  = await supabase.from('doctors').select('*, departments(name_en)').order('name')
      if (!ignore) { setDepartments(depts || []); setDoctorsList(docs || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (!hasPermission('settings:manage')) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl bg-surface border border-border p-16 text-center">
          <Lock size={48} className="text-txt-disabled mx-auto mb-4" />
          <h2 className="font-bold text-txt-primary mb-2">{isRTL ? 'وصول مرفوض' : 'Access Denied'}</h2>
          <p className="text-txt-muted">{isRTL ? 'فقط المسؤولون يمكنهم الوصول إلى إدارة الأطباء' : 'Only administrators can manage doctors.'}</p>
        </div>
      </DashboardLayout>
    )
  }

  const saveDoc = async () => {
    if (!docForm.name || !docForm.department_id) return toast('Name and department are required', { type: 'error' })
    if (!editingDoc && (!docForm.email || !docForm.password)) return toast('Email and password are required for new doctor', { type: 'error' })
    setSaving(true)
    const slots = slotsInput.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s))

    if (editingDoc) {
      const { email, password, ...payload } = docForm
      payload.slots = slots
      const { error } = await supabase.from('doctors').update(payload).eq('id', editingDoc)
      if (error) { setSaving(false); return toast('Error updating doctor: ' + error.message, { type: 'error' }) }
    } else {
      const { data: sessionData } = await supabase.auth.getSession()
      const adminSession = sessionData?.session

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: docForm.email,
        password: docForm.password,
      })
      if (authError) { setSaving(false); return toast(authError.message, { type: 'error' }) }

      const payload = { name: docForm.name, type: docForm.type, department_id: docForm.department_id, working_days: docForm.working_days, slots, is_active: true }
      if (authData?.user?.id) payload.user_id = authData.user.id
      const { error } = await supabase.from('doctors').insert(payload)
      if (error) { setSaving(false); return toast('Error creating doctor: ' + error.message, { type: 'error' }) }

      if (adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      toast(`Doctor account created! Email: ${docForm.email}`, { type: 'success' })
    }

    setSaving(false)
    setShowDocForm(false); setEditingDoc(null)
    setDocForm({ name: '', type: 'doctor', department_id: '', working_days: [], slots: [], is_active: true, email: '', password: '' })
    setSlotsInput(''); fetchAll()
  }

  const deleteDoc = async (id) => {
    if (!await confirm('Delete this doctor?', { danger: true, confirmLabel: 'Delete' })) return
    const { error } = await supabase.from('doctors').delete().eq('id', id)
    if (error) return toast('Error deleting doctor: ' + error.message, { type: 'error' })
    fetchAll()
  }

  const toggleDocActive = async (doc) => {
    const { error } = await supabase.from('doctors').update({ is_active: !doc.is_active }).eq('id', doc.id)
    if (error) return toast('Error updating status: ' + error.message, { type: 'error' })
    fetchAll()
  }

  const startEditDoc = (doc) => {
    setDocForm({ name: doc.name, type: doc.type || 'doctor', department_id: doc.department_id, working_days: doc.working_days || [], is_active: doc.is_active, email: '', password: '' })
    setSlotsInput((doc.slots || []).join(', '))
    setEditingDoc(doc.id); setShowDocForm(true)
  }

  const openAddForm = (type) => {
    setShowDocForm(true); setEditingDoc(null)
    setDocForm({ name: '', type, department_id: '', working_days: [], slots: [], is_active: true, email: '', password: '' })
    setSlotsInput('')
  }

  const docFormProps = { showDocForm, docForm, setDocForm, slotsInput, setSlotsInput, editingDoc, saveDoc, setShowDocForm, setEditingDoc, departments, t, saving }
  const docListProps = { doctors: doctorsList, toggleDocActive, startEditDoc, deleteDoc, t }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{isRTL ? 'إدارة الأطباء' : 'Doctors Management'}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'إضافة وتعديل وإدارة الأطباء' : 'Add, edit, and manage doctors'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-txt-primary flex items-center gap-1.5">
                  <Stethoscope size={16} /> {t.consultants} ({doctorsList.filter(d => d.type === 'consultant').length})
                </h2>
                <Button size="sm" onClick={() => openAddForm('consultant')}><Plus size={14} /> {t.addDoctor}</Button>
              </div>
              <DocForm type="consultant" {...docFormProps} />
              <DocList type="consultant" {...docListProps} />
            </div>

            <div className="border-t border-border" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-txt-primary flex items-center gap-1.5">
                  <Stethoscope size={16} /> {t.doctorsTab} ({doctorsList.filter(d => d.type === 'doctor').length})
                </h2>
                <Button size="sm" onClick={() => openAddForm('doctor')}><Plus size={14} /> {t.addDoctor}</Button>
              </div>
              <DocForm type="doctor" {...docFormProps} />
              <DocList type="doctor" {...docListProps} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

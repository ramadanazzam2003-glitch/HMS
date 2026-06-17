import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Pencil, Trash2, Plus, Lock, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'

const DAYS_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']

function DocForm({ type, showDocForm, docForm, setDocForm, slotsInput, setSlotsInput, editingDoc, saveDoc, setShowDocForm, setEditingDoc, departments, t }) {
  const toggleDay = (day) => {
    const days = docForm.working_days || []
    setDocForm({ ...docForm, working_days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] })
  }

  if (!showDocForm || docForm.type !== type) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="card" style={{ padding: 24, marginBottom: 16 }}>
      <h3 style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13, marginBottom: 16 }}>
        {editingDoc ? t.editDoctor : t.addDoctor}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="input-label">{t.doctorName} *</label>
          <input value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })}
            className="input" placeholder="Dr. Ahmed Mohamed" />
        </div>
        <div>
          <label className="input-label">{t.department} *</label>
          <select value={docForm.department_id} onChange={e => setDocForm({ ...docForm, department_id: e.target.value })} className="input">
            <option value="">{t.department}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">{t.workingDays}</label>
          <input value={slotsInput} onChange={e => setSlotsInput(e.target.value)}
            className="input" placeholder="09:00, 09:30, 10:00" />
        </div>
      </div>
      <div className="mb-4">
        <label className="input-label">{t.workingDays}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {DAYS_KEYS.map(dayKey => {
            const active = (docForm.working_days || []).includes(dayKey)
            return (
              <button key={dayKey} onClick={() => toggleDay(dayKey)}
                className="btn btn-sm"
                style={{
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                {t[dayKey]}
              </button>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={saveDoc} className="btn btn-primary btn-md">{editingDoc ? t.save : t.save}</button>
        <button onClick={() => { setShowDocForm(false); setEditingDoc(null) }} className="btn btn-secondary btn-md">{t.cancel}</button>
      </div>
    </motion.div>
  )
}

function DocList({ type, doctors, toggleDocActive, startEditDoc, deleteDoc, t }) {
  const list = doctors.filter(d => d.type === type)
  if (list.length === 0) return (
    <div className="card" style={{ padding: 32, textAlign: 'center', border: '2px dashed var(--border)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.noDoctorsAssigned}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-2.5">
      {list.map((doc, i) => (
        <motion.div key={doc.id} className="card p-3.5 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}
          whileHover={{ scale: 1.01 }}>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm mb-0.5">{doc.name}</p>
            <p className="text-xs text-gray-400">{doc.departments?.name_en} · {(doc.slots || []).length} slots</p>
            {doc.working_days?.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1"><CalendarDays size={12} /> {doc.working_days.map(d => d.slice(0, 3)).join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={() => toggleDocActive(doc)}
              className={`btn btn-sm ${doc.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
              {doc.is_active ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => startEditDoc(doc)} className="btn btn-ghost btn-sm text-blue-600"><Pencil size={14} /></button>
            <button onClick={() => deleteDoc(doc.id)} className="btn btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { toast, confirm } = useUI()
  const { t, isRTL } = useLanguage()

  const [tab, setTab]               = useState('departments')
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors]       = useState([])
  const [loading, setLoading]       = useState(true)

  const [deptForm, setDeptForm]     = useState({ name_en: '', name_ar: '', max_daily: 50, is_open: true })
  const [editingDept, setEditingDept] = useState(null)
  const [showDeptForm, setShowDeptForm] = useState(false)

  const [docForm, setDocForm]       = useState({ name: '', type: 'doctor', department_id: '', working_days: [], slots: [], is_active: true })
  const [editingDoc, setEditingDoc] = useState(null)
  const [showDocForm, setShowDocForm] = useState(false)
  const [slotsInput, setSlotsInput] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const { data: depts } = await supabase.from('departments').select('*').order('name_en')
    const { data: docs }  = await supabase.from('doctors').select('*, departments(name_en)').order('name')
    setDepartments(depts || [])
    setDoctors(docs || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      setLoading(true)
      const { data: depts } = await supabase.from('departments').select('*').order('name_en')
      const { data: docs }  = await supabase.from('doctors').select('*, departments(name_en)').order('name')
      if (!ignore) { setDepartments(depts || []); setDoctors(docs || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  if (!hasPermission('settings:manage')) {
    return (
      <div className="page">
        <Navbar variant="dashboard" back="/dashboard" subtitle="Settings" />
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="card p-12 text-center">
            <div className="mb-4 flex justify-center"><Lock size={48} className="text-gray-300" /></div>
            <h2 className="font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">Only administrators can access settings.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-md">Back to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  const saveDept = async () => {
    if (!deptForm.name_en) return toast('Department name is required', { type: 'error' })
    if (editingDept) await supabase.from('departments').update(deptForm).eq('id', editingDept)
    else await supabase.from('departments').insert(deptForm)
    setShowDeptForm(false); setEditingDept(null)
    setDeptForm({ name_en: '', name_ar: '', max_daily: 50, is_open: true })
    fetchAll()
  }

  const deleteDept = async (id) => {
    if (!await confirm('Delete this department?', { danger: true, confirmLabel: 'Delete' })) return
    await supabase.from('departments').delete().eq('id', id)
    fetchAll()
  }

  const toggleDeptOpen = async (dept) => {
    await supabase.from('departments').update({ is_open: !dept.is_open }).eq('id', dept.id)
    fetchAll()
  }

  const startEditDept = (dept) => {
    setDeptForm({ name_en: dept.name_en, name_ar: dept.name_ar || '', max_daily: dept.max_daily, is_open: dept.is_open })
    setEditingDept(dept.id); setShowDeptForm(true)
  }

  const saveDoc = async () => {
    if (!docForm.name || !docForm.department_id) return toast('Name and department are required', { type: 'error' })
    const slots = slotsInput.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s))
    const payload = { ...docForm, slots }
    if (editingDoc) await supabase.from('doctors').update(payload).eq('id', editingDoc)
    else await supabase.from('doctors').insert(payload)
    setShowDocForm(false); setEditingDoc(null)
    setDocForm({ name: '', type: 'doctor', department_id: '', working_days: [], slots: [], is_active: true })
    setSlotsInput(''); fetchAll()
  }

  const deleteDoc = async (id) => {
    if (!await confirm('Delete this doctor?', { danger: true, confirmLabel: 'Delete' })) return
    await supabase.from('doctors').delete().eq('id', id)
    fetchAll()
  }

  const toggleDocActive = async (doc) => {
    await supabase.from('doctors').update({ is_active: !doc.is_active }).eq('id', doc.id)
    fetchAll()
  }

  const startEditDoc = (doc) => {
    setDocForm({ name: doc.name, type: doc.type || 'doctor', department_id: doc.department_id, working_days: doc.working_days || [], is_active: doc.is_active })
    setSlotsInput((doc.slots || []).join(', '))
    setEditingDoc(doc.id); setShowDocForm(true)
  }

  const openAddForm = (type) => {
    setShowDocForm(true); setEditingDoc(null)
    setDocForm({ name: '', type, department_id: '', working_days: [], slots: [], is_active: true })
    setSlotsInput('')
  }

  const docFormProps = { showDocForm, docForm, setDocForm, slotsInput, setSlotsInput, editingDoc, saveDoc, setShowDocForm, setEditingDoc, departments, t }
  const docListProps = { doctors, toggleDocActive, startEditDoc, deleteDoc, t }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.settingsPage} />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{t.loading}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.settingsPage} />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[
              { id: 'departments', label: t.departments, icon: <Building2 size={16} /> },
              { id: 'doctors', label: t.doctorsTab, icon: <Stethoscope size={16} /> },
            ].map(tabItem => (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                className="btn btn-md"
                style={{
                  background: tab === tabItem.id ? 'var(--primary)' : 'var(--surface)',
                  color: tab === tabItem.id ? '#fff' : 'var(--text-secondary)',
                  border: `1.5px solid ${tab === tabItem.id ? 'var(--primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {tabItem.icon}{tabItem.label}
              </button>
            ))}
          </div>

          {tab === 'departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t.departments} ({departments.length})</h2>
                <button onClick={() => { setShowDeptForm(true); setEditingDept(null); setDeptForm({ name_en: '', name_ar: '', max_daily: 50, is_open: true }) }}
                  className="btn btn-primary btn-sm"><Plus size={14} /> {t.addDepartment}</button>
              </div>

              {showDeptForm && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="card p-6 mb-4">
                  <h3 className="font-bold text-blue-600 text-sm mb-4">{editingDept ? 'Edit Department' : 'New Department'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="input-label">Name (English) *</label>
                      <input value={deptForm.name_en} onChange={e => setDeptForm({ ...deptForm, name_en: e.target.value })}
                        className="input" placeholder="e.g. Cardiology" />
                    </div>
                    <div>
                      <label className="input-label">Name (Arabic)</label>
                      <input value={deptForm.name_ar} onChange={e => setDeptForm({ ...deptForm, name_ar: e.target.value })}
                        className="input" placeholder="e.g. القلب" dir="rtl" />
                    </div>
                    <div>
                      <label className="input-label">Max Daily Bookings</label>
                      <input type="number" value={deptForm.max_daily} onChange={e => setDeptForm({ ...deptForm, max_daily: parseInt(e.target.value) })} className="input" />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <label className="text-xs text-gray-500">Open for bookings</label>
                      <button onClick={() => setDeptForm({ ...deptForm, is_open: !deptForm.is_open })}
                        className="relative w-11 h-6 rounded-full cursor-pointer transition-colors border-none"
                        style={{ background: deptForm.is_open ? 'var(--success)' : 'var(--border)' }}>
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                          style={{ left: deptForm.is_open ? 22 : 2 }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button onClick={saveDept} className="btn btn-primary btn-md">{editingDept ? 'Update' : 'Save'}</button>
                    <button onClick={() => { setShowDeptForm(false); setEditingDept(null) }} className="btn btn-secondary btn-md">Cancel</button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-2.5">
                {departments.map((dept, i) => (
                  <motion.div key={dept.id} className="card p-3.5 flex items-center justify-between gap-3"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}
                    whileHover={{ scale: 1.01 }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm mb-0.5">{dept.name_en}</p>
                      <p className="text-xs text-gray-400">{dept.name_ar} · Max {dept.max_daily}/day</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button onClick={() => toggleDeptOpen(dept)}
                        className={`btn btn-sm ${dept.is_open ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                        {dept.is_open ? 'Open' : 'Closed'}
                      </button>
                      <button onClick={() => startEditDept(dept)} className="btn btn-ghost btn-sm text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => deleteDept(dept.id)} className="btn btn-ghost btn-sm text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab === 'doctors' && (
            <div className="flex flex-col gap-8">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stethoscope size={16} /> {t.consultants} ({doctors.filter(d => d.type === 'consultant').length})
                  </h2>
                  <button onClick={() => openAddForm('consultant')} className="btn btn-primary btn-sm"><Plus size={14} /> {t.addDoctor}</button>
                </div>
                <DocForm type="consultant" {...docFormProps} />
                <DocList type="consultant" {...docListProps} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)' }} />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stethoscope size={16} /> {t.doctorsTab} ({doctors.filter(d => d.type === 'doctor').length})
                  </h2>
                  <button onClick={() => openAddForm('doctor')} className="btn btn-primary btn-sm"><Plus size={14} /> {t.addDoctor}</button>
                </div>
                <DocForm type="doctor" {...docFormProps} />
                <DocList type="doctor" {...docListProps} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

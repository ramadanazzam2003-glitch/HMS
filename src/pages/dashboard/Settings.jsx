import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Pencil, Trash2, Plus, Lock, CalendarDays, Mail, Key } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

const DAYS_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']

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
          <label className="text-xs font-semibold text-txt-muted block mb-1.5">{t.workingDays}</label>
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
                {t[dayKey]}
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

  const [docForm, setDocForm]       = useState({ name: '', type: 'doctor', department_id: '', working_days: [], slots: [], is_active: true, email: '', password: '' })
  const [editingDoc, setEditingDoc] = useState(null)
  const [showDocForm, setShowDocForm] = useState(false)
  const [slotsInput, setSlotsInput] = useState('')
  const [saving, setSaving] = useState(false)

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
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lock size={48} className="text-txt-disabled mb-4" />
            <h2 className="font-bold text-txt-primary mb-2">{isRTL ? 'وصول مرفوض' : 'Access Denied'}</h2>
            <p className="text-txt-muted mb-6">{isRTL ? 'فقط المسؤولون يمكنهم الوصول إلى الإعدادات' : 'Only administrators can access settings.'}</p>
            <Button onClick={() => navigate('/dashboard')}>{isRTL ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
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
    if (!editingDoc && (!docForm.email || !docForm.password)) return toast('Email and password are required for new doctor', { type: 'error' })
    setSaving(true)
    const slots = slotsInput.split(',').map(s => s.trim()).filter(s => /^\d{2}:\d{2}$/.test(s))

    if (editingDoc) {
      const { email, password, ...payload } = docForm
      payload.slots = slots
      await supabase.from('doctors').update(payload).eq('id', editingDoc)
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
      await supabase.from('doctors').insert(payload)

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
    await supabase.from('doctors').delete().eq('id', id)
    fetchAll()
  }

  const toggleDocActive = async (doc) => {
    await supabase.from('doctors').update({ is_active: !doc.is_active }).eq('id', doc.id)
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
  const docListProps = { doctors, toggleDocActive, startEditDoc, deleteDoc, t }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.settingsPage}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'إدارة الأقسام والأطباء' : 'Manage departments and doctors'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {[
                { id: 'departments', label: t.departments, icon: <Building2 size={16} /> },
                { id: 'doctors', label: t.doctorsTab, icon: <Stethoscope size={16} /> },
              ].map(tabItem => (
                <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
                  className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    tab === tabItem.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
                  }`}>
                  {tabItem.icon}{tabItem.label}
                </button>
              ))}
            </div>

            {tab === 'departments' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-txt-primary">{t.departments} ({departments.length})</h2>
                  <Button size="sm" onClick={() => { setShowDeptForm(true); setEditingDept(null); setDeptForm({ name_en: '', name_ar: '', max_daily: 50, is_open: true }) }}>
                    <Plus size={14} /> {t.addDepartment}
                  </Button>
                </div>

                {showDeptForm && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className="rounded-2xl p-6 bg-surface border border-border mb-4 shadow-sm">
                    <h3 className="font-bold text-primary text-sm mb-4">{editingDept ? 'Edit Department' : 'New Department'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-txt-muted block mb-1.5">Name (English) *</label>
                        <Input value={deptForm.name_en} onChange={e => setDeptForm({ ...deptForm, name_en: e.target.value })} placeholder="e.g. Cardiology" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-txt-muted block mb-1.5">Name (Arabic)</label>
                        <Input value={deptForm.name_ar} onChange={e => setDeptForm({ ...deptForm, name_ar: e.target.value })} placeholder="e.g. القلب" dir="rtl" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-txt-muted block mb-1.5">Max Daily Bookings</label>
                        <Input type="number" value={deptForm.max_daily} onChange={e => setDeptForm({ ...deptForm, max_daily: parseInt(e.target.value) })} />
                      </div>
                      <div className="flex items-center gap-2.5 pt-6">
                        <label className="text-xs text-txt-muted">Open for bookings</label>
                        <button onClick={() => setDeptForm({ ...deptForm, is_open: !deptForm.is_open })}
                          className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors border-none ${
                            deptForm.is_open ? 'bg-primary' : 'bg-border'
                          }`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface transition-all shadow-sm ${
                            deptForm.is_open ? 'left-[22px]' : 'left-[2px]'
                          }`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <Button size="sm" onClick={saveDept}>{editingDept ? 'Update' : 'Save'}</Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowDeptForm(false); setEditingDept(null) }}>Cancel</Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2.5">
                  {departments.map((dept, i) => (
                    <motion.div key={dept.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-txt-primary text-sm mb-0.5">{dept.name_en}</p>
                        <p className="text-xs text-txt-muted">{dept.name_ar} &middot; Max {dept.max_daily}/day</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button onClick={() => toggleDeptOpen(dept)}
                          className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            dept.is_open ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                          }`}>
                          {dept.is_open ? 'Open' : 'Closed'}
                        </button>
                        <button onClick={() => startEditDept(dept)} className="h-8 w-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"><Pencil size={14} /></button>
                        <button onClick={() => deleteDept(dept.id)} className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'doctors' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-txt-primary flex items-center gap-1.5">
                      <Stethoscope size={16} /> {t.consultants} ({doctors.filter(d => d.type === 'consultant').length})
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
                      <Stethoscope size={16} /> {t.doctorsTab} ({doctors.filter(d => d.type === 'doctor').length})
                    </h2>
                    <Button size="sm" onClick={() => openAddForm('doctor')}><Plus size={14} /> {t.addDoctor}</Button>
                  </div>
                  <DocForm type="doctor" {...docFormProps} />
                  <DocList type="doctor" {...docListProps} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

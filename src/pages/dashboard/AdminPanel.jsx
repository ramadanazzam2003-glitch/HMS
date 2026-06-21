// src/pages/dashboard/AdminPanel.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Shield, Pencil, Trash2, Search, Lock,
  RefreshCw, Plus, X, ChevronDown, ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

const DOCTOR_ROLE_ID   = 2
const MANAGER_ROLE_NAME    = 'manager'
const SUPER_ADMIN_ROLE_NAME = 'super_admin'
const CAN_MANAGE_PERMS     = ['admin', 'director', 'manager']

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, role, hasPermission } = useAuth()
  const { toast, confirm } = useUI()
  const { t, isRTL } = useLanguage()

  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [rolePermissions, setRolePermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Users tab
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [newDoctorType, setNewDoctorType] = useState('doctor')

  // Roles tab
  const [editingRolePerms, setEditingRolePerms] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState([])
  const [expandedResource, setExpandedResource] = useState(null)

  // Add permission modal
  const [showAddPerm, setShowAddPerm] = useState(false)
  const [newPerm, setNewPerm] = useState({ name: '', description: '', resource: '' })
  const [addingPerm, setAddingPerm] = useState(false)
  const [permError, setPermError] = useState('')   // ← inline validation

  // Delete permission confirmation inline
  const [deletingPermId, setDeletingPermId] = useState(null)

  // Edit permission inline
  const [editingPermId, setEditingPermId] = useState(null)
  const [editPermData, setEditPermData] = useState({ name: '', description: '', resource: '' })
  const [editPermError, setEditPermError] = useState('')
  const [savingPerm, setSavingPerm] = useState(false)

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const [profilesRes, rolesRes, permsRes, rpRes] = await Promise.all([
      supabase.from('profiles').select('*, roles(name)').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('id'),
      supabase.from('permissions').select('*').order('resource, name'),
      supabase.from('role_permissions').select('role_id, permission_id'),
    ])

    const filteredRoles = (rolesRes.data || []).filter(r => r.name !== SUPER_ADMIN_ROLE_NAME)

    setUsers(profilesRes.data || [])
    setRoles(filteredRoles)
    setPermissions(permsRes.data || [])
    setRolePermissions(rpRes.data || [])

    if (!silent) setLoading(false)
    else setRefreshing(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      setLoading(true)
      const [profilesRes, rolesRes, permsRes, rpRes] = await Promise.all([
        supabase.from('profiles').select('*, roles(name)').order('created_at', { ascending: false }),
        supabase.from('roles').select('*').order('id'),
        supabase.from('permissions').select('*').order('resource, name'),
        supabase.from('role_permissions').select('role_id, permission_id'),
      ])
      if (!ignore) {
        const filteredRoles = (rolesRes.data || []).filter(r => r.name !== SUPER_ADMIN_ROLE_NAME)
        setUsers(profilesRes.data || [])
        setRoles(filteredRoles)
        setPermissions(permsRes.data || [])
        setRolePermissions(rpRes.data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const isManagerRole = (roleId) => {
    const r = roles.find(r => r.id === parseInt(roleId))
    return r?.name === MANAGER_ROLE_NAME
  }

  const getPermsForRole = (roleId) =>
    rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id)

  const groupedPermissions = permissions.reduce((acc, p) => {
    const key = p.resource || 'general'
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  const getRoleBadge = (roleName) => {
    const ROLE_BADGE = {
      manager:      'bg-red-50 text-red-600 border-red-200',
      director:     'bg-yellow-50 text-yellow-600 border-yellow-200',
      admin:        'bg-blue-50 text-blue-600 border-blue-200',
      dept_manager: 'bg-green-50 text-green-600 border-green-200',
      receptionist: 'bg-purple-50 text-purple-600 border-purple-200',
      nurse:        'bg-emerald-50 text-emerald-600 border-emerald-200',
      doctor:       'bg-blue-50 text-blue-700 border-blue-200',
      patient:      'bg-gray-50 text-gray-500 border-gray-200',
    }
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap border ${ROLE_BADGE[roleName] || ROLE_BADGE.patient}`}>
        {roleName?.replace('_', ' ')}
      </span>
    )
  }

  // ─── User Actions ─────────────────────────────────────────────────────────────

  const startEditUser = (u) => {
    if (u.user_id === user?.id) {
      toast(isRTL ? 'لا يمكنك تعديل دورك الخاص' : 'You cannot edit your own role', { type: 'error' })
      return
    }
    setEditingUser(u.id)
    setNewRole(String(u.role_id))
    setNewDoctorType(u.doctor_type || 'doctor')
  }

  const handleRoleChange = async (targetUser, roleId) => {
    if (targetUser.user_id === user?.id) {
      toast(isRTL ? 'لا يمكنك تعديل دورك الخاص' : 'You cannot edit your own role', { type: 'error' })
      setEditingUser(null)
      return
    }
    if (isManagerRole(roleId) && role !== MANAGER_ROLE_NAME) {
      toast(isRTL ? 'فقط المدير يمكنه ترقية مستخدم لهذا الدور' : 'Only a manager can promote to this role', { type: 'error' })
      return
    }
    const payload = { role_id: parseInt(roleId) }
    if (parseInt(roleId) === DOCTOR_ROLE_ID) payload.doctor_type = newDoctorType

    const { error } = await supabase.from('profiles').update(payload).eq('id', targetUser.id)
    if (error) toast('Error: ' + error.message, { type: 'error' })
    else { setEditingUser(null); fetchData(true) }
  }

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.user_id === user?.id) {
      toast(isRTL ? 'لا يمكنك حذف حسابك الخاص' : 'You cannot delete your own account', { type: 'error' })
      return
    }
    if (targetUser.roles?.name === MANAGER_ROLE_NAME && role !== MANAGER_ROLE_NAME) {
      toast(isRTL ? 'فقط المدير يمكنه حذف مستخدم بهذا الدور' : 'Only a manager can delete a user with this role', { type: 'error' })
      return
    }
    if (!await confirm(
      isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?',
      { danger: true, confirmLabel: isRTL ? 'حذف' : 'Delete' }
    )) return
    const { error } = await supabase.from('profiles').delete().eq('id', targetUser.id)
    if (error) toast('Error: ' + error.message, { type: 'error' })
    else fetchData(true)
  }

  // ─── Role Permissions Actions ─────────────────────────────────────────────────

  const startEditRolePerms = (roleId) => {
    setSelectedPerms(rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id))
    setEditingRolePerms(roleId)
    setExpandedResource(null)
  }

  const togglePerm = (permId) =>
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    )

  const toggleResource = (resource) => {
    const resourcePermIds = (groupedPermissions[resource] || []).map(p => p.id)
    const allSelected = resourcePermIds.every(id => selectedPerms.includes(id))
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(id => !resourcePermIds.includes(id)))
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...resourcePermIds])])
    }
  }

  const handleUpdateRolePerms = async (roleId) => {
    await supabase.from('role_permissions').delete().eq('role_id', roleId)
    if (selectedPerms.length > 0) {
      const { error } = await supabase.from('role_permissions').insert(
        selectedPerms.map(pId => ({ role_id: roleId, permission_id: pId }))
      )
      if (error) { toast('Error: ' + error.message, { type: 'error' }); return }
    }
    toast(isRTL ? 'تم حفظ الصلاحيات' : 'Permissions saved', { type: 'success' })
    setEditingRolePerms(null)
    fetchData(true)
  }

  // ─── Add Permission ───────────────────────────────────────────────────────────

  const resetAddPerm = () => {
    setNewPerm({ name: '', description: '', resource: '' })
    setPermError('')
  }

  const handleAddPermission = async () => {
    // Validate
    if (!newPerm.name.trim()) {
      setPermError(isRTL ? 'اسم الصلاحية مطلوب' : 'Permission name is required')
      return
    }
    if (!newPerm.resource.trim()) {
      setPermError(isRTL ? 'المورد (Resource) مطلوب' : 'Resource is required')
      return
    }
    // Check duplicate
    const duplicate = permissions.find(
      p => p.name.toLowerCase() === newPerm.name.trim().toLowerCase()
    )
    if (duplicate) {
      setPermError(isRTL ? 'هذه الصلاحية موجودة بالفعل' : 'This permission already exists')
      return
    }

    setPermError('')
    setAddingPerm(true)
    const { error } = await supabase.from('permissions').insert({
      name:        newPerm.name.trim(),
      description: newPerm.description.trim() || null,
      resource:    newPerm.resource.trim(),
    })
    setAddingPerm(false)

    if (error) {
      // Handle Postgres unique constraint gracefully
      if (error.code === '23505') {
        setPermError(isRTL ? 'هذه الصلاحية موجودة بالفعل' : 'This permission already exists')
      } else {
        toast('Error: ' + error.message, { type: 'error' })
      }
    } else {
      toast(isRTL ? 'تمت إضافة الصلاحية بنجاح ✓' : 'Permission added ✓', { type: 'success' })
      resetAddPerm()
      setShowAddPerm(false)
      fetchData(true)
    }
  }

  // ─── Delete Permission ────────────────────────────────────────────────────────

  const handleDeletePermission = async (permId) => {
    // If already clicked once (confirmation step), proceed with delete
    if (deletingPermId !== permId) {
      setDeletingPermId(permId)   // first click → show confirm state
      return
    }
    // Second click → actually delete
    setDeletingPermId(null)
    const { error } = await supabase.from('permissions').delete().eq('id', permId)
    if (error) {
      toast('Error: ' + error.message, { type: 'error' })
    } else {
      // Also clean up role_permissions rows in local state immediately
      setRolePermissions(prev => prev.filter(rp => rp.permission_id !== permId))
      toast(isRTL ? 'تم حذف الصلاحية' : 'Permission deleted', { type: 'success' })
      fetchData(true)
    }
  }

  const cancelDeletePerm = () => setDeletingPermId(null)

  // ─── Edit Permission ──────────────────────────────────────────────────────────

  const startEditPerm = (perm) => {
    // Close any open delete confirm
    setDeletingPermId(null)
    setEditingPermId(perm.id)
    setEditPermData({ name: perm.name, description: perm.description || '', resource: perm.resource || '' })
    setEditPermError('')
  }

  const cancelEditPerm = () => {
    setEditingPermId(null)
    setEditPermData({ name: '', description: '', resource: '' })
    setEditPermError('')
  }

  const handleSavePermission = async (permId) => {
    if (!editPermData.name.trim()) {
      setEditPermError(isRTL ? 'اسم الصلاحية مطلوب' : 'Permission name is required')
      return
    }
    if (!editPermData.resource.trim()) {
      setEditPermError(isRTL ? 'المورد مطلوب' : 'Resource is required')
      return
    }
    // Check duplicate name (excluding self)
    const duplicate = permissions.find(
      p => p.id !== permId && p.name.toLowerCase() === editPermData.name.trim().toLowerCase()
    )
    if (duplicate) {
      setEditPermError(isRTL ? 'هذا الاسم موجود بالفعل' : 'This name already exists')
      return
    }

    setEditPermError('')
    setSavingPerm(true)
    const { error } = await supabase
      .from('permissions')
      .update({
        name:        editPermData.name.trim(),
        description: editPermData.description.trim() || null,
        resource:    editPermData.resource.trim(),
      })
      .eq('id', permId)
    setSavingPerm(false)

    if (error) {
      if (error.code === '23505') {
        setEditPermError(isRTL ? 'هذا الاسم موجود بالفعل' : 'This name already exists')
      } else {
        toast('Error: ' + error.message, { type: 'error' })
      }
    } else {
      toast(isRTL ? 'تم تعديل الصلاحية ✓' : 'Permission updated ✓', { type: 'success' })
      cancelEditPerm()
      fetchData(true)
    }
  }

  // ─── Filtered Users ───────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    if (u.roles?.name === SUPER_ADMIN_ROLE_NAME) return false
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRole   = filterRole === 'all' || u.roles?.name === filterRole
    return matchSearch && matchRole
  })

  // ─── Access Guard ─────────────────────────────────────────────────────────────

  if (!hasPermission('users:manage')) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Lock size={48} className="text-txt-disabled mb-4" />
            <h2 className="font-bold text-txt-primary mb-2">{isRTL ? 'وصول مرفوض' : 'Access Denied'}</h2>
            <p className="text-txt-muted mb-6">{t.adminPanel}</p>
            <Button onClick={() => navigate('/dashboard')}>{t.back}</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.adminPanel}</h1>
            <p className="text-txt-muted text-sm mt-1">
              {isRTL ? 'إدارة المستخدمين والأدوار والصلاحيات' : 'Manage users, roles and permissions'}
            </p>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-txt-secondary"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'users', label: t.users,           icon: <Users  size={16} /> },
            { id: 'roles', label: t.rolesPermissions, icon: <Shield size={16} /> },
          ].map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                tab === tabItem.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
              }`}
            >
              {tabItem.icon}{tabItem.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ USERS TAB ══════════════════ */}
        {tab === 'users' && (
          <div>
            {/* Role Count Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-5">
              {roles.map(r => (
                <motion.div
                  key={r.id}
                  className={`rounded-2xl p-3.5 text-center bg-surface border transition-colors cursor-pointer ${
                    filterRole === r.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary-border'
                  }`}
                  onClick={() => setFilterRole(filterRole === r.name ? 'all' : r.name)}
                >
                  <p className="text-2xl font-extrabold text-txt-primary">
                    {users.filter(u => u.role_id === r.id && u.roles?.name !== SUPER_ADMIN_ROLE_NAME).length}
                  </p>
                  <p className="text-[11px] text-txt-muted capitalize">{r.name.replace('_', ' ')}</p>
                </motion.div>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
                <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-9 text-sm ps-9"
                  placeholder={t.searchByNameEmail}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterRole('all')}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all ${
                    filterRole === 'all' ? 'bg-primary text-white' : 'bg-surface text-txt-secondary border border-border'
                  }`}
                >
                  {t.all}
                </button>
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setFilterRole(r.name)}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                      filterRole === r.name ? 'bg-primary text-white' : 'bg-surface text-txt-secondary border border-border'
                    }`}
                  >
                    {r.name.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users size={48} className="text-txt-disabled mb-4" />
                  <p className="font-semibold text-txt-primary">{isRTL ? 'لا يوجد مستخدمين' : 'No Users Found'}</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover/50">
                        {[isRTL ? 'الاسم' : 'Name', t.role, t.date, t.actions].map(col => (
                          <th key={col} className="px-4 py-3 text-start font-semibold text-txt-muted text-xs whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, i) => {
                        const isSelf = u.user_id === user?.id
                        return (
                          <motion.tr
                            key={u.id}
                            className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                          >
                            <td className="px-4 py-3 font-medium text-txt-primary">
                              {u.full_name || '—'}
                              {isSelf && (
                                <span className="ms-2 text-[10px] text-txt-muted">
                                  ({isRTL ? 'أنت' : 'You'})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingUser === u.id ? (
                                <div className="flex gap-1.5 items-center flex-wrap">
                                  <select
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    className="h-8 px-2 rounded-lg border border-border bg-surface text-xs w-full sm:w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    {roles.map(r => {
                                      const disallowed = r.name === MANAGER_ROLE_NAME && role !== MANAGER_ROLE_NAME
                                      return (
                                        <option key={r.id} value={r.id} disabled={disallowed}>
                                          {r.name.replace('_', ' ')}{disallowed ? ` (${isRTL ? 'غير متاح' : 'restricted'})` : ''}
                                        </option>
                                      )
                                    })}
                                  </select>
                                  {parseInt(newRole) === DOCTOR_ROLE_ID && (
                                    <select
                                      value={newDoctorType}
                                      onChange={e => setNewDoctorType(e.target.value)}
                                      className="h-8 px-2 rounded-lg border border-border bg-surface text-xs w-full sm:w-[110px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                      <option value="doctor">{isRTL ? 'دكتور' : 'Doctor'}</option>
                                      <option value="consultant">{isRTL ? 'استشاري' : 'Consultant'}</option>
                                    </select>
                                  )}
                                  <Button size="xs" onClick={() => handleRoleChange(u, newRole)}>{t.save}</Button>
                                  <Button variant="ghost" size="xs" onClick={() => setEditingUser(null)}>{t.cancel}</Button>
                                </div>
                              ) : getRoleBadge(u.roles?.name)}
                            </td>
                            <td className="px-4 py-3 text-txt-muted text-xs">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              {editingUser !== u.id && (
                                <div className="flex gap-1.5">
                                  <Button
                                    variant="ghost" size="xs" className="text-primary"
                                    disabled={isSelf}
                                    title={isSelf ? (isRTL ? 'لا يمكنك تعديل نفسك' : 'Cannot edit yourself') : ''}
                                    onClick={() => startEditUser(u)}
                                  >
                                    <Pencil size={12} /> {t.edit}
                                  </Button>
                                  <Button
                                    variant="ghost" size="xs" className="text-danger"
                                    disabled={isSelf}
                                    title={isSelf ? (isRTL ? 'لا يمكنك حذف نفسك' : 'Cannot delete yourself') : ''}
                                    onClick={() => handleDeleteUser(u)}
                                  >
                                    <Trash2 size={12} /> {t.delete}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border text-sm text-txt-muted">
                  {t.showing} {filtered.length} {t.of} {users.filter(u => u.roles?.name !== SUPER_ADMIN_ROLE_NAME).length}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════ ROLES TAB ══════════════════ */}
        {tab === 'roles' && (
          <div className="space-y-5">

            {/* Add Permission Button */}
            {CAN_MANAGE_PERMS.includes(role) && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setShowAddPerm(v => !v); if (showAddPerm) resetAddPerm() }}
                >
                  {showAddPerm ? <X size={14} /> : <Plus size={14} />}
                  {showAddPerm
                    ? (isRTL ? 'إلغاء' : 'Cancel')
                    : (isRTL ? 'إضافة صلاحية جديدة' : 'Add Permission')}
                </Button>
              </div>
            )}

            {/* ── Add Permission Form ── */}
            <AnimatePresence>
              {showAddPerm && (
                <motion.div
                  key="add-perm-form"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-5 bg-surface border border-border"
                >
                  <h3 className="font-semibold text-txt-primary mb-4 text-sm">
                    {isRTL ? 'إضافة صلاحية جديدة' : 'Add New Permission'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-txt-muted mb-1">
                        {isRTL ? 'اسم الصلاحية *' : 'Permission Name *'}
                      </label>
                      <Input
                        value={newPerm.name}
                        onChange={e => { setNewPerm(p => ({ ...p, name: e.target.value })); setPermError('') }}
                        placeholder={isRTL ? 'مثال: users:manage' : 'e.g. users:manage'}
                        className={`h-9 text-sm ${permError && !newPerm.name.trim() ? 'border-red-400 focus:ring-red-200' : ''}`}
                      />
                    </div>
                    {/* Resource */}
                    <div>
                      <label className="block text-xs font-medium text-txt-muted mb-1">
                        {isRTL ? 'المورد (Resource) *' : 'Resource *'}
                      </label>
                      {/* Datalist lets user pick existing resources or type a new one */}
                      <div className="relative">
                        <Input
                          list="resource-options"
                          value={newPerm.resource}
                          onChange={e => { setNewPerm(p => ({ ...p, resource: e.target.value })); setPermError('') }}
                          placeholder={isRTL ? 'مثال: users' : 'e.g. users'}
                          className={`h-9 text-sm ${permError && !newPerm.resource.trim() ? 'border-red-400 focus:ring-red-200' : ''}`}
                        />
                        <datalist id="resource-options">
                          {Object.keys(groupedPermissions).map(r => (
                            <option key={r} value={r} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-txt-muted mb-1">
                        {isRTL ? 'الوصف (اختياري)' : 'Description (optional)'}
                      </label>
                      <Input
                        value={newPerm.description}
                        onChange={e => setNewPerm(p => ({ ...p, description: e.target.value }))}
                        placeholder={isRTL ? 'وصف مختصر' : 'Brief description'}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Inline validation error */}
                  {permError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
                      <AlertTriangle size={12} /> {permError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddPermission} disabled={addingPerm}>
                      {addingPerm
                        ? (isRTL ? 'جارٍ الإضافة...' : 'Adding...')
                        : (isRTL ? 'إضافة' : 'Add Permission')}
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => { setShowAddPerm(false); resetAddPerm() }}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Roles List ── */}
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : (
              roles.map(r => {
                const rpList   = getPermsForRole(r.id)
                const isEditing = editingRolePerms === r.id

                return (
                  <motion.div
                    key={r.id}
                    className="rounded-2xl p-6 bg-surface border border-border"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Role Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        {getRoleBadge(r.name)}
                        <span className="text-xs text-txt-muted">
                          {rpList.length} {t.permissions}
                        </span>
                      </div>
                      {CAN_MANAGE_PERMS.includes(role) && (
                        <button
                          onClick={() => isEditing ? setEditingRolePerms(null) : startEditRolePerms(r.id)}
                          className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                            isEditing
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}
                        >
                          {isEditing ? t.cancel : t.edit}
                        </button>
                      )}
                    </div>

                    {/* ── Edit Mode ── */}
                    {isEditing ? (
                      <div>
                        {Object.entries(groupedPermissions).map(([resource, perms]) => {
                          const resourcePermIds = perms.map(p => p.id)
                          const allSelected     = resourcePermIds.every(id => selectedPerms.includes(id))
                          const someSelected    = resourcePermIds.some(id => selectedPerms.includes(id))
                          const isOpen          = expandedResource === resource

                          return (
                            <div key={resource} className="mb-2 rounded-xl border border-border overflow-hidden">
                              {/* Resource accordion header */}
                              <button
                                className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-hover/60 hover:bg-surface-hover transition-colors"
                                onClick={() => setExpandedResource(isOpen ? null : resource)}
                              >
                                <div className="flex items-center gap-2">
                                  {isOpen
                                    ? <ChevronDown  size={14} className="text-txt-muted" />
                                    : <ChevronRight size={14} className="text-txt-muted" />}
                                  <span className="text-xs font-semibold text-txt-primary capitalize">{resource}</span>
                                  <span className="text-[10px] text-txt-muted">
                                    ({resourcePermIds.filter(id => selectedPerms.includes(id)).length}/{perms.length})
                                  </span>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleResource(resource) }}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-all ${
                                    allSelected
                                      ? 'bg-primary text-white border-primary'
                                      : someSelected
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'bg-surface text-txt-secondary border-border'
                                  }`}
                                >
                                  {allSelected
                                    ? (isRTL ? 'إلغاء الكل' : 'Deselect all')
                                    : (isRTL ? 'تحديد الكل' : 'Select all')}
                                </button>
                              </button>

                              {/* Permissions inside resource */}
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 py-3 flex flex-wrap gap-2">
                                      {perms.map(p => (
                                        <button
                                          key={p.id}
                                          onClick={() => togglePerm(p.id)}
                                          title={p.description || ''}
                                          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                                            selectedPerms.includes(p.id)
                                              ? 'bg-primary text-white'
                                              : 'bg-surface text-txt-secondary border border-border hover:border-primary/40'
                                          }`}
                                        >
                                          {p.name}
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}

                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleUpdateRolePerms(r.id)}>{t.save}</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingRolePerms(null)}>{t.cancel}</Button>
                        </div>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      rpList.length === 0 ? (
                        <p className="text-xs text-txt-muted italic">{t.noData}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(groupedPermissions).map(([resource, perms]) => {
                            const assignedPerms = perms.filter(p => rpList.includes(p.id))
                            if (assignedPerms.length === 0) return null
                            return (
                              <div key={resource}>
                                <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-wide mb-1.5 capitalize">
                                  {resource}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {assignedPerms.map(p => (
                                    <PermissionBadge
                                      key={p.id}
                                      perm={p}
                                      canDelete={CAN_MANAGE_PERMS.includes(role)}
                                      canEdit={CAN_MANAGE_PERMS.includes(role)}
                                      isConfirming={deletingPermId === p.id}
                                      isEditing={editingPermId === p.id}
                                      editData={editPermData}
                                      editError={editPermError}
                                      saving={savingPerm}
                                      onDelete={() => handleDeletePermission(p.id)}
                                      onCancelDelete={cancelDeletePerm}
                                      onEdit={() => startEditPerm(p)}
                                      onCancelEdit={cancelEditPerm}
                                      onEditChange={(field, val) => { setEditPermData(prev => ({ ...prev, [field]: val })); setEditPermError('') }}
                                      onSave={() => handleSavePermission(p.id)}
                                      groupedPermissions={groupedPermissions}
                                      isRTL={isRTL}
                                    />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}
                  </motion.div>
                )
              })
            )}

            {/* ── All Permissions Reference ── */}
            {CAN_MANAGE_PERMS.includes(role) && permissions.length > 0 && (
              <div className="rounded-2xl p-5 bg-surface border border-dashed border-border">
                <h3 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-3">
                  {isRTL ? 'كل الصلاحيات المتاحة' : 'All Available Permissions'}
                </h3>
                <div className="space-y-2">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource}>
                      <p className="text-[10px] font-semibold text-txt-muted uppercase tracking-wide mb-1 capitalize">
                        {resource}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map(p => (
                          <PermissionBadge
                            key={p.id}
                            perm={p}
                            canDelete={true}
                            canEdit={true}
                            isConfirming={deletingPermId === p.id}
                            isEditing={editingPermId === p.id}
                            editData={editPermData}
                            editError={editPermError}
                            saving={savingPerm}
                            onDelete={() => handleDeletePermission(p.id)}
                            onCancelDelete={cancelDeletePerm}
                            onEdit={() => startEditPerm(p)}
                            onCancelEdit={cancelEditPerm}
                            onEditChange={(field, val) => { setEditPermData(prev => ({ ...prev, [field]: val })); setEditPermError('') }}
                            onSave={() => handleSavePermission(p.id)}
                            groupedPermissions={groupedPermissions}
                            isRTL={isRTL}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// ─── PermissionBadge ─────────────────────────────────────────────────────────
// Three states: view (default) → edit form → delete confirm
function PermissionBadge({
  perm,
  canDelete, canEdit,
  isConfirming, isEditing,
  editData, editError, saving,
  onDelete, onCancelDelete,
  onEdit, onCancelEdit, onEditChange, onSave,
  groupedPermissions,
  isRTL,
}) {
  // ── Edit mode: inline form ──
  if (isEditing) {
    return (
      <motion.div
        key="edit"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className="w-full rounded-xl border border-primary/30 bg-primary/5 p-3 mb-1"
      >
        <p className="text-[11px] font-semibold text-primary mb-2">
          {isRTL ? `تعديل: ${perm.name}` : `Edit: ${perm.name}`}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-medium text-txt-muted mb-1">
              {isRTL ? 'الاسم *' : 'Name *'}
            </label>
            <input
              value={editData.name}
              onChange={e => onEditChange('name', e.target.value)}
              className={`w-full h-8 px-2 rounded-lg border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                editError && !editData.name.trim() ? 'border-red-400' : 'border-border'
              }`}
              placeholder="e.g. users:manage"
            />
          </div>
          {/* Resource */}
          <div>
            <label className="block text-[10px] font-medium text-txt-muted mb-1">
              {isRTL ? 'المورد *' : 'Resource *'}
            </label>
            <input
              list={`edit-resource-opts-${perm.id}`}
              value={editData.resource}
              onChange={e => onEditChange('resource', e.target.value)}
              className={`w-full h-8 px-2 rounded-lg border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                editError && !editData.resource.trim() ? 'border-red-400' : 'border-border'
              }`}
              placeholder="e.g. users"
            />
            <datalist id={`edit-resource-opts-${perm.id}`}>
              {Object.keys(groupedPermissions).map(r => <option key={r} value={r} />)}
            </datalist>
          </div>
          {/* Description */}
          <div>
            <label className="block text-[10px] font-medium text-txt-muted mb-1">
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <input
              value={editData.description}
              onChange={e => onEditChange('description', e.target.value)}
              className="w-full h-8 px-2 rounded-lg border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={isRTL ? 'اختياري' : 'Optional'}
            />
          </div>
        </div>

        {/* Inline error */}
        {editError && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mb-2">
            <AlertTriangle size={11} /> {editError}
          </p>
        )}

        <div className="flex gap-1.5">
          <button
            onClick={onSave}
            disabled={saving}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
          </button>
          <button
            onClick={onCancelEdit}
            className="h-7 px-3 rounded-lg text-[11px] font-semibold bg-surface border border-border text-txt-secondary hover:bg-surface-hover transition-colors"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    )
  }

  // ── Delete confirm state ──
  if (isConfirming) {
    return (
      <motion.div
        key="confirm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200"
      >
        <AlertTriangle size={11} className="text-red-500 shrink-0" />
        <span className="text-[11px] text-red-600 font-medium whitespace-nowrap">
          {isRTL ? 'تأكيد الحذف؟' : 'Confirm delete?'}
        </span>
        <button
          onClick={onDelete}
          className="ms-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5 transition-colors"
        >
          {isRTL ? 'نعم' : 'Yes'}
        </button>
        <button
          onClick={onCancelDelete}
          className="text-[10px] font-bold text-txt-secondary hover:text-txt-primary rounded px-1.5 py-0.5 transition-colors"
        >
          {isRTL ? 'لا' : 'No'}
        </button>
      </motion.div>
    )
  }

  // ── Default view badge ──
  return (
    <motion.div
      key="badge"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="group flex items-center gap-1"
    >
      <span
        className="px-2.5 py-1 rounded-lg bg-surface-hover border border-border text-xs text-txt-secondary"
        title={perm.description || ''}
      >
        {perm.name}
      </span>
      {/* Edit button */}
      {canEdit && (
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 flex items-center justify-center"
          title={isRTL ? 'تعديل الصلاحية' : 'Edit permission'}
        >
          <Pencil size={8} />
        </button>
      )}
      {/* Delete button */}
      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center"
          title={isRTL ? 'حذف الصلاحية' : 'Delete permission'}
        >
          <X size={8} />
        </button>
      )}
    </motion.div>
  )
}
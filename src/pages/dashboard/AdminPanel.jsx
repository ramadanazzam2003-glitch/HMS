import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Shield, Pencil, Trash2, Search, Lock } from 'lucide-react'
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

export default function AdminPanel() {
  const navigate = useNavigate()
  const { role, hasPermission } = useAuth()
  const { toast, confirm } = useUI()
  const { t, isRTL } = useLanguage()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [rolePermissions, setRolePermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [editingRolePerms, setEditingRolePerms] = useState(null)
  const [selectedPerms, setSelectedPerms] = useState([])

  const fetchData = async () => {
    setLoading(true)
    const [profilesRes, rolesRes, permsRes, rpRes] = await Promise.all([
      supabase.from('profiles').select('*, roles(name)').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('id'),
      supabase.from('permissions').select('*').order('resource, name'),
      supabase.from('role_permissions').select('role_id, permission_id'),
    ])
    setUsers(profilesRes.data || [])
    setRoles(rolesRes.data || [])
    setPermissions(permsRes.data || [])
    setRolePermissions(rpRes.data || [])
    setLoading(false)
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
        setUsers(profilesRes.data || [])
        setRoles(rolesRes.data || [])
        setPermissions(permsRes.data || [])
        setRolePermissions(rpRes.data || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleRoleChange = async (userId, roleId) => {
    const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId)
    if (error) toast('Error: ' + error.message, { type: 'error' })
    else { setEditingUser(null); fetchData() }
  }

  const handleDeleteUser = async (userId) => {
    if (!await confirm('Are you sure you want to delete this user?', { danger: true, confirmLabel: 'Delete' })) return
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) toast('Error: ' + error.message, { type: 'error' })
    else fetchData()
  }

  const handleUpdateRolePerms = async (roleId) => {
    await supabase.from('role_permissions').delete().eq('role_id', roleId)
    if (selectedPerms.length > 0) {
      const { error } = await supabase.from('role_permissions').insert(
        selectedPerms.map(pId => ({ role_id: roleId, permission_id: pId }))
      )
      if (error) { toast('Error: ' + error.message, { type: 'error' }); return }
    }
    setEditingRolePerms(null)
    fetchData()
  }

  const startEditRolePerms = (roleId) => {
    setSelectedPerms(rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id))
    setEditingRolePerms(roleId)
  }

  const togglePerm = (permId) => {
    setSelectedPerms(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId])
  }

  const getPermsForRole = (roleId) => rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id)

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.roles?.name === filterRole
    return matchSearch && matchRole
  })

  const ROLE_BADGE = {
    manager: 'bg-red-50 text-red-600 border-red-200',
    director: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    admin: 'bg-blue-50 text-blue-600 border-blue-200',
    dept_manager: 'bg-green-50 text-green-600 border-green-200',
    receptionist: 'bg-purple-50 text-purple-600 border-purple-200',
    nurse: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    doctor: 'bg-blue-50 text-blue-700 border-blue-200',
    patient: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  const getRoleBadge = (roleName) => (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap border ${ROLE_BADGE[roleName] || ROLE_BADGE.patient}`}>
      {roleName?.replace('_', ' ')}
    </span>
  )

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.adminPanel}</h1>
            <p className="text-txt-muted text-sm mt-1">{isRTL ? 'إدارة المستخدمين والأدوار والصلاحيات' : 'Manage users, roles and permissions'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'users', label: t.users, icon: <Users size={16} /> },
            { id: 'roles', label: t.rolesPermissions, icon: <Shield size={16} /> },
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

        {tab === 'users' && (
          <div>
            {/* Role Count Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-5">
              {roles.map(r => (
                <motion.div key={r.id} className="rounded-2xl p-3.5 text-center bg-surface border border-border cursor-pointer hover:border-primary-border transition-colors"
                  onClick={() => setFilterRole(filterRole === r.name ? 'all' : r.name)}>
                  <p className="text-2xl font-extrabold text-txt-primary">{users.filter(u => u.role_id === r.id).length}</p>
                  <p className="text-[11px] text-txt-muted capitalize">{r.name.replace('_', ' ')}</p>
                </motion.div>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none left-3" />
                <Input value={search} onChange={e => setSearch(e.target.value)} className="h-9 text-sm ps-9" placeholder={t.searchByNameEmail} />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => setFilterRole('all')}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all ${
                    filterRole === 'all' ? 'bg-primary text-white' : 'bg-surface text-txt-secondary border border-border'
                  }`}>{t.all}</button>
                {roles.map(r => (
                  <button key={r.id} onClick={() => setFilterRole(r.name)}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                      filterRole === r.name ? 'bg-primary text-white' : 'bg-surface text-txt-secondary border border-border'
                    }`}>
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
                        {[t.patient, t.role, t.date, t.actions].map(col => (
                          <th key={col} className="px-4 py-3 text-start font-semibold text-txt-muted text-xs whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, i) => (
                        <motion.tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }}>
                          <td className="px-4 py-3 font-medium text-txt-primary">{u.full_name || '—'}</td>
                          <td className="px-4 py-3">
                            {editingUser === u.id ? (
                              <div className="flex gap-1.5 items-center">
                                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                  className="h-8 px-2 rounded-lg border border-border bg-surface text-xs w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/20">
                                  {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
                                </select>
                                <Button size="xs" onClick={() => handleRoleChange(u.id, parseInt(newRole))}>{t.save}</Button>
                                <Button variant="ghost" size="xs" onClick={() => setEditingUser(null)}>{t.cancel}</Button>
                              </div>
                            ) : getRoleBadge(u.roles?.name)}
                          </td>
                          <td className="px-4 py-3 text-txt-muted text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {editingUser !== u.id && (
                              <div className="flex gap-1.5">
                                <Button variant="ghost" size="xs" className="text-primary"
                                  onClick={() => { setEditingUser(u.id); setNewRole(u.role_id) }}>
                                  <Pencil size={12} /> {t.edit}
                                </Button>
                                <Button variant="ghost" size="xs" className="text-danger"
                                  onClick={() => handleDeleteUser(u.id)}>
                                  <Trash2 size={12} /> {t.delete}
                                </Button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border text-sm text-txt-muted">
                  {t.showing} {filtered.length} {t.of} {users.length}
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === 'roles' && (
          <div className="space-y-5">
            {roles.map(r => {
              const rpList = getPermsForRole(r.id)
              const isEditing = editingRolePerms === r.id
              return (
                <motion.div key={r.id} className="rounded-2xl p-6 bg-surface border border-border"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {getRoleBadge(r.name)}
                      <span className="text-xs text-txt-muted">{rpList.length} {t.permissions}</span>
                    </div>
                    {role === 'manager' && (
                      <button onClick={() => isEditing ? setEditingRolePerms(null) : startEditRolePerms(r.id)}
                        className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          isEditing ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                        {isEditing ? t.cancel : t.edit}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {permissions.map(p => (
                          <button key={p.id} onClick={() => togglePerm(p.id)}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                              selectedPerms.includes(p.id)
                                ? 'bg-primary text-white'
                                : 'bg-surface text-txt-secondary border border-border'
                            }`}>
                            {p.name}
                          </button>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => handleUpdateRolePerms(r.id)}>{t.save}</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {rpList.length > 0 ? rpList.map(pId => {
                        const perm = permissions.find(p => p.id === pId)
                        return perm ? (
                          <span key={pId} className="px-2.5 py-1 rounded-lg bg-surface-hover border border-border text-xs text-txt-secondary">{perm.name}</span>
                        ) : null
                      }) : (
                        <span className="text-xs text-txt-muted italic">{t.noData}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

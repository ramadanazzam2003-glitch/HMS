import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Shield, Pencil, Trash2, Search, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'

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
      <div className="page">
        <Navbar variant="dashboard" back="/dashboard" subtitle={t.adminPanel} />
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Lock size={48} style={{ color: 'var(--text-disabled)' }} /></div>
            <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{t.back}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{t.adminPanel}</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-md">{t.back}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.adminPanel} />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { id: 'users', label: t.users, icon: <Users size={16} /> },
              { id: 'roles', label: t.rolesPermissions, icon: <Shield size={16} /> },
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

          {tab === 'users' && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-5">
                {roles.map(r => (
                  <motion.div key={r.id} className="card p-3.5 text-center cursor-pointer hover:border-blue-200 transition-colors"
                    onClick={() => setFilterRole(filterRole === r.name ? 'all' : r.name)}
                    whileHover={{ scale: 1.03 }}>
                    <p className="text-2xl font-extrabold text-gray-800">{users.filter(u => u.role_id === r.id).length}</p>
                    <p className="text-[11px] text-gray-400 capitalize">{r.name.replace('_', ' ')}</p>
                  </motion.div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <span style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Search size={16} /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingInlineStart: 36 }} placeholder={t.searchByNameEmail} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => setFilterRole('all')}
                    className="btn btn-sm"
                    style={{
                      background: filterRole === 'all' ? 'var(--primary)' : 'var(--surface)',
                      color: filterRole === 'all' ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${filterRole === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                    }}>{t.all}</button>
                  {roles.map(r => (
                    <button key={r.id} onClick={() => setFilterRole(r.name)}
                      className="btn btn-sm"
                      style={{
                        background: filterRole === r.name ? 'var(--primary)' : 'var(--surface)',
                        color: filterRole === r.name ? '#fff' : 'var(--text-secondary)',
                        border: `1.5px solid ${filterRole === r.name ? 'var(--primary)' : 'var(--border)'}`,
                        textTransform: 'capitalize',
                      }}>
                      {r.name.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><div className="spinner spinner-lg" /></div>
              ) : filtered.length === 0 ? (
                <div className="card empty-state"><div className="empty-state-icon"><Users size={48} className="text-gray-300" /></div><p className="empty-state-title">No Users Found</p></div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {[t.patient, t.role, t.date, t.actions].map(col => (
                            <th key={col} style={{ padding: '10px 14px', textAlign: 'start', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((u, i) => (
                          <motion.tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}>
                            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name || '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {editingUser === u.id ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                    className="input" style={{ padding: '4px 8px', fontSize: 12, width: 140 }}>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
                                  </select>
                                  <button onClick={() => handleRoleChange(u.id, parseInt(newRole))} className="btn btn-primary btn-sm" style={{ fontSize: 11 }}>{t.save}</button>
                                  <button onClick={() => setEditingUser(null)} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>{t.cancel}</button>
                                </div>
                              ) : getRoleBadge(u.roles?.name)}
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {editingUser !== u.id && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => { setEditingUser(u.id); setNewRole(u.role_id) }} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontSize: 12 }}><Pencil size={12} /> {t.edit}</button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 12 }}><Trash2 size={12} /> {t.delete}</button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {t.showing} {filtered.length} {t.of} {users.length}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'roles' && (
            <div className="flex flex-col gap-5">
              {roles.map(r => {
                const rpList = getPermsForRole(r.id)
                const isEditing = editingRolePerms === r.id
                return (
                  <motion.div key={r.id} className="card p-6"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {getRoleBadge(r.name)}
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rpList.length} {t.permissions}</span>
                      </div>
                      {role === 'manager' && (
                        <button onClick={() => isEditing ? setEditingRolePerms(null) : startEditRolePerms(r.id)}
                          className="btn btn-sm"
                          style={{
                            background: isEditing ? 'var(--danger-light)' : 'var(--primary-light)',
                            color: isEditing ? 'var(--danger)' : 'var(--primary)',
                            border: `1.5px solid ${isEditing ? 'var(--danger-border)' : 'var(--primary-border)'}`,
                          }}>
                          {isEditing ? t.cancel : t.edit}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {permissions.map(p => (
                            <button key={p.id} onClick={() => togglePerm(p.id)}
                              className="btn btn-sm"
                              style={{
                                fontSize: 11,
                                background: selectedPerms.includes(p.id) ? 'var(--primary)' : 'var(--surface)',
                                color: selectedPerms.includes(p.id) ? '#fff' : 'var(--text-secondary)',
                                border: `1.5px solid ${selectedPerms.includes(p.id) ? 'var(--primary)' : 'var(--border)'}`,
                              }}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => handleUpdateRolePerms(r.id)} className="btn btn-primary btn-md">{t.save}</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {rpList.length > 0 ? rpList.map(pId => {
                          const perm = permissions.find(p => p.id === pId)
                          return perm ? (
                            <span key={pId} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)' }}>{perm.name}</span>
                          ) : null
                        }) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{t.noData}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Shield, Pencil, Trash2, Search, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { role, hasPermission } = useAuth()
  const { toast, confirm } = useUI()
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
        <Navbar variant="dashboard" back="/dashboard" subtitle="Admin Panel" />
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="card p-12 text-center">
            <div className="mb-4 flex justify-center"><Lock size={48} className="text-gray-300" /></div>
            <h2 className="font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">Only administrators can access this page.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-md">Back to Dashboard</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Navbar
        variant="dashboard" back="/dashboard" subtitle="Admin Panel"
      />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex gap-2 mb-6">
            {[
              { id: 'users', label: 'Users', icon: <Users size={16} className="mr-1.5" /> },
              { id: 'roles', label: 'Roles & Permissions', icon: <Shield size={16} className="mr-1.5" /> },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`btn btn-md ${tab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                {t.icon}{t.label}
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

              <div className="flex gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search by name..." />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => setFilterRole('all')}
                    className={`btn btn-sm ${filterRole === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>All</button>
                  {roles.map(r => (
                    <button key={r.id} onClick={() => setFilterRole(r.name)}
                      className={`btn btn-sm capitalize ${filterRole === r.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
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
                        <tr className="border-b border-gray-100">
                          {['Name', 'Role', 'Joined', 'Actions'].map(col => (
                            <th key={col} className="px-4 py-3 text-left font-semibold text-gray-400 text-[11px] whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((u, i) => (
                          <motion.tr key={u.id} className="border-b border-gray-100"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.03 }}
                            whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.8)' }}>
                            <td className="px-4 py-3 font-semibold text-gray-800">{u.full_name || 'No name'}</td>
                            <td className="px-4 py-3">
                              {editingUser === u.id ? (
                                <div className="flex gap-1.5 items-center">
                                  <select value={newRole} onChange={e => setNewRole(e.target.value)}
                                    className="input py-1 px-2 text-xs w-[150px]">
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ')}</option>)}
                                  </select>
                                  <button onClick={() => handleRoleChange(u.id, parseInt(newRole))} className="btn btn-primary btn-sm text-[11px]">Save</button>
                                  <button onClick={() => setEditingUser(null)} className="btn btn-ghost btn-sm text-[11px]">Cancel</button>
                                </div>
                              ) : getRoleBadge(u.roles?.name)}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              {editingUser !== u.id && (
                                <div className="flex gap-1.5">
                                  <button onClick={() => { setEditingUser(u.id); setNewRole(u.role_id) }} className="btn btn-ghost btn-sm text-blue-600 text-xs"><Pencil size={12} className="mr-1 inline" />Edit Role</button>
                                  <button onClick={() => handleDeleteUser(u.id)} className="btn btn-ghost btn-sm text-red-500 text-xs"><Trash2 size={12} className="mr-1 inline" />Delete</button>
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                    Showing {filtered.length} of {users.length} users
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
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        {getRoleBadge(r.name)}
                        <span className="text-xs text-gray-400">{rpList.length} permissions</span>
                      </div>
                      {role === 'manager' && (
                        <button onClick={() => isEditing ? setEditingRolePerms(null) : startEditRolePerms(r.id)}
                          className={`btn btn-sm ${isEditing ? 'bg-red-50 text-red-500 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {isEditing ? 'Cancel' : 'Edit Permissions'}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {permissions.map(p => (
                            <button key={p.id} onClick={() => togglePerm(p.id)}
                              className={`btn btn-sm text-[11px] ${selectedPerms.includes(p.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                              {p.name}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => handleUpdateRolePerms(r.id)} className="btn btn-primary btn-md">Save Permissions</button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {rpList.length > 0 ? rpList.map(pId => {
                          const perm = permissions.find(p => p.id === pId)
                          return perm ? (
                            <span key={pId} className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[11px] text-gray-500">{perm.name}</span>
                          ) : null
                        }) : (
                          <span className="text-xs text-gray-400 italic">No permissions assigned</span>
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

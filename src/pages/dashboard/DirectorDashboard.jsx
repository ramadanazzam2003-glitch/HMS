import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'

export default function DirectorDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const handleLogout = useLogout('/login')

  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, cancelled: 0, revenue: 0, unpaid: 0 })
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const [bookingsRes, billsRes, deptsRes, docsRes] = await Promise.all([
        supabase.from('bookings').select('*, departments(name_en)'),
        supabase.from('bills').select('total, payment_status'),
        supabase.from('departments').select('*'),
        supabase.from('doctors').select('*, departments(name_en)'),
      ])

      if (ignore) return

      const allBookings = bookingsRes.data || []
      const allBills = billsRes.data || []
      const allDepts = deptsRes.data || []
      const allDocs = docsRes.data || []

      const deptMap = {}
      allBookings.forEach(b => {
        const name = b.departments?.name_en || 'Unknown'
        if (!deptMap[name]) deptMap[name] = { name, total: 0, active: 0, completed: 0 }
        deptMap[name].total++
        if (b.status === 'active') deptMap[name].active++
        if (b.status === 'completed') deptMap[name].completed++
      })

      setStats({
        total: allBookings.length,
        active: allBookings.filter(b => b.status === 'active').length,
        completed: allBookings.filter(b => b.status === 'completed').length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length,
        revenue: allBills.filter(i => i.payment_status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
        unpaid: allBills.filter(i => i.payment_status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0),
      })
      setDepartments(Object.values(deptMap))
      setDoctors(allDocs)
      setRecentBookings(allBookings.slice(0, 10))
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle="Director Dashboard" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={`Director${profile?.full_name ? ` — ${profile.full_name}` : ''}`}
        right={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-ghost btn-sm">Analytics</button>
            <button onClick={() => navigate('/dashboard/admin')} className="btn btn-ghost btn-sm">Users</button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card p-5">
            <p className="text-xs text-gray-400 mb-1">Total Bookings</p>
            <p className="font-display text-3xl font-extrabold text-gray-800">{stats.total}</p>
          </div>
          <div className="card p-5 bg-green-50 border-green-200">
            <p className="text-xs text-green-600 mb-1">Revenue</p>
            <p className="font-display text-3xl font-extrabold text-green-600">EGP {stats.revenue.toFixed(0)}</p>
          </div>
          <div className="card p-5 bg-red-50 border-red-200">
            <p className="text-xs text-red-500 mb-1">Unpaid</p>
            <p className="font-display text-3xl font-extrabold text-red-500">EGP {stats.unpaid.toFixed(0)}</p>
          </div>
          <div className="card p-5 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Doctors</p>
            <p className="font-display text-3xl font-extrabold text-blue-600">{doctors.filter(d => d.is_active).length}/{doctors.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="card p-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-4">Department Performance</h2>
            {departments.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">No data</p>
            ) : (
              <div className="flex flex-col gap-4">
                {departments.map(dept => (
                  <div key={dept.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-700 font-medium">{dept.name}</span>
                      <span className="text-gray-400">{dept.completed}/{dept.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min((dept.completed / Math.max(dept.total, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-4">Staff Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              {['doctor', 'consultant'].map(type => {
                const count = doctors.filter(d => d.type === type).length
                const active = doctors.filter(d => d.type === type && d.is_active).length
                return (
                  <div key={type} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="font-display text-2xl font-extrabold text-gray-800">{active}/{count}</p>
                    <p className="text-xs text-gray-400 capitalize">{type}s</p>
                  </div>
                )
              })}
              {departments.map(dept => (
                <div key={dept.name} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="font-display text-2xl font-extrabold text-gray-800">{dept.total}</p>
                  <p className="text-xs text-gray-400 truncate">{dept.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-base font-bold text-gray-900">Recent Bookings</h2>
            <button onClick={() => navigate('/dashboard/bookings')} className="text-xs text-blue-600 font-semibold">View All →</button>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">No bookings</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                    <p className="text-xs text-gray-400">{b.departments?.name_en} · {b.booking_date} · {b.slot_time}</p>
                  </div>
                  <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-primary btn-md">📊 Analytics</button>
          <button onClick={() => navigate('/dashboard/admin')} className="btn btn-secondary btn-md">👥 Users & Roles</button>
          <button onClick={() => navigate('/dashboard/audit-log')} className="btn btn-secondary btn-md">📝 Audit Log</button>
          <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md">💰 Billing</button>
          <button onClick={() => navigate('/dashboard/settings')} className="btn btn-secondary btn-md">⚙️ Settings</button>
        </div>
      </div>
    </div>
  )
}

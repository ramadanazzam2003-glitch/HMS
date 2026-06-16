import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'

export default function DeptManagerDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const handleLogout = useLogout('/login')

  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [todayBookings, setTodayBookings] = useState([])
  const [stats, setStats] = useState({ today: 0, active: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const { data: depts } = await supabase.from('departments').select('*').order('name_en')
      const dept = depts?.[0]
      if (!dept || ignore) { setLoading(false); return }
      setDepartment(dept)

      const [docsRes, bksRes] = await Promise.all([
        supabase.from('doctors').select('*, departments(name_en)').eq('department_id', dept.id).order('name'),
        supabase.from('bookings').select('*, doctors(name), departments(name_en)').eq('department_id', dept.id).eq('booking_date', today).order('slot_time'),
      ])

      if (ignore) return

      const allDocs = docsRes.data || []
      const allBks = bksRes.data || []

      setDoctors(allDocs)
      setTodayBookings(allBks)
      setStats({
        today: allBks.length,
        active: allBks.filter(b => b.status === 'active').length,
        completed: allBks.filter(b => b.status === 'completed').length,
      })
      setLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [])

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" subtitle="Department Manager" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar
        variant="dashboard"
        subtitle={department?.name_en || 'Department Manager'}
        right={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-ghost btn-sm">Bookings</button>
            <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-ghost btn-sm">Records</button>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        }
      />

      <div className="page-content-lg">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-5">
            <p className="text-xs text-gray-400 mb-1">Today's Bookings</p>
            <p className="font-display text-3xl font-extrabold text-gray-800">{stats.today}</p>
          </div>
          <div className="card p-5 bg-green-50 border-green-200">
            <p className="text-xs text-green-600 mb-1">Active</p>
            <p className="font-display text-3xl font-extrabold text-green-600">{stats.active}</p>
          </div>
          <div className="card p-5 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-600 mb-1">Completed</p>
            <p className="font-display text-3xl font-extrabold text-blue-600">{stats.completed}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="card p-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-4">Department Staff ({doctors.length})</h2>
            {doctors.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">No doctors assigned</p>
            ) : (
              <div className="flex flex-col gap-2">
                {doctors.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{doc.type} · {doc.working_days?.length || 0} days/week</p>
                    </div>
                    <span className={`badge ${doc.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-base font-bold text-gray-900 mb-4">Today's Schedule</h2>
            {todayBookings.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-sm">No bookings today</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">{b.slot_time} · {b.doctors?.name}</p>
                    </div>
                    <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate('/dashboard/bookings')} className="btn btn-primary btn-md">📋 All Bookings</button>
          <button onClick={() => navigate('/dashboard/medical-records')} className="btn btn-secondary btn-md">📋 Medical Records</button>
          <button onClick={() => navigate('/dashboard/analytics')} className="btn btn-secondary btn-md">📊 Analytics</button>
          <button onClick={() => navigate('/dashboard/billing')} className="btn btn-secondary btn-md">💰 Billing</button>
        </div>
      </div>
    </div>
  )
}

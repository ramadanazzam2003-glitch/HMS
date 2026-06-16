import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Stethoscope, Users, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth'

export default function DepartmentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)

      const { data: depts } = await supabase.from('departments').select('*').order('name_en')

      const dept = depts?.[0]
      if (!dept || ignore) { setLoading(false); return }
      setDepartment(dept)

      const { data: docs } = await supabase.from('doctors').select('*, departments(name_en)')
        .eq('department_id', dept.id).order('name')

      const { data: bks } = await supabase.from('bookings').select('*, doctors(name), departments(name_en)')
        .eq('department_id', dept.id)
        .gte('booking_date', today)
        .order('slot_time')

      if (!ignore) {
        setDoctors(docs || [])
        setBookings(bks || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const stats = {
    todayBookings: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    doctors: doctors.length,
    activeDoctors: doctors.filter(d => d.is_active).length,
  }

  if (loading) return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle="Department Dashboard" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="spinner spinner-lg mx-auto mb-4" />
      </div>
    </div>
  )

  return (
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={department?.name_en || 'Department Dashboard'} />
      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Today's Bookings", value: stats.todayBookings, cardClass: 'card p-5', labelClass: 'text-gray-400', valueClass: 'text-gray-800', icon: <CalendarDays size={16} className="text-gray-400 mb-1" /> },
              { label: 'Active', value: stats.active, cardClass: 'card p-5 bg-green-50 border-green-200', labelClass: 'text-green-600', valueClass: 'text-green-600', icon: <Stethoscope size={16} className="text-green-600 mb-1" /> },
              { label: 'Completed', value: stats.completed, cardClass: 'card p-5 bg-blue-50 border-blue-200', labelClass: 'text-blue-600', valueClass: 'text-blue-600', icon: <Building2 size={16} className="text-blue-600 mb-1" /> },
              { label: 'Doctors', value: `${stats.activeDoctors}/${stats.doctors}`, cardClass: 'card p-5 bg-purple-50 border-purple-200', labelClass: 'text-purple-600', valueClass: 'text-purple-600', icon: <Users size={16} className="text-purple-600 mb-1" /> },
            ].map((s, i) => (
              <motion.div key={s.label} className={s.cardClass} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} whileHover={{ scale: 1.02 }}>
                {s.icon}
                <p className={`text-xs ${s.labelClass} mb-1`}>{s.label}</p>
                <p className={`font-display text-3xl font-extrabold ${s.valueClass}`}>{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-6">
              <h2 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><Users size={16} /> Department Staff</h2>
              {doctors.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">No doctors assigned</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {doctors.map((doc, i) => (
                    <motion.div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{doc.type} · {doc.working_days?.length || 0} days/week</p>
                      </div>
                      <span className={`badge ${doc.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {doc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-display text-base font-bold text-gray-900 mb-4 flex items-center gap-2"><CalendarDays size={16} /> Today's Schedule</h2>
              {bookings.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm">No bookings today</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bookings.map((b, i) => (
                    <motion.div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{b.patient_name}</p>
                        <p className="text-xs text-gray-400">{b.slot_time} · {b.doctors?.name}</p>
                      </div>
                      <span className={`badge ${b.status === 'active' ? 'badge-success' : b.status === 'completed' ? 'badge-primary' : 'badge-danger'}`}>
                        {b.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

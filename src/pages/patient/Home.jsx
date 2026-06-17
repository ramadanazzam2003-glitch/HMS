import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Building2, CalendarDays, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PatientNavbar from '../../components/home/PatientNavbar'
import HeroSection from '../../components/home/HeroSection'
import NextAppointmentCard from '../../components/home/NextAppointmentCard'
import DepartmentCard from '../../components/home/DepartmentCard'
import CancelBanner from '../../components/home/CancelBanner'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

export default function Home() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const [nextBooking, setNextBooking] = useState(null)
  const [apptLoading, setApptLoading] = useState(true)

  const departmentsSectionRef = useRef(null)
  const scrollToDepartments = () => departmentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
      if (!session) return
      if (!ignore) setUser(session.user)

      const today = new Date().toISOString().split('T')[0]
      const { data: depts, error } = await supabase.from('departments').select('*')
      if (error || !depts || ignore) { setLoading(false); return }

      const { data: bookingsData } = await supabase
        .from('bookings').select('department_id').eq('status', 'active').eq('booking_date', today)

      const countMap = {}
      bookingsData?.forEach(b => { countMap[b.department_id] = (countMap[b.department_id] || 0) + 1 })

      if (!ignore) {
        setDepartments(depts.map(d => ({ ...d, bookedCount: countMap[d.id] || 0 })))
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [navigate])

  useEffect(() => {
    if (!user) return
    let ignore = false
    const fetchNext = async () => {

      const { data: bookings } = await supabase
        .from('bookings').select('*, doctors(name)')
        .eq('status', 'active').order('booking_date', { ascending: true }).limit(1)

      if (!bookings || bookings.length === 0 || ignore) { setApptLoading(false); return }

      const booking = bookings[0]
      const { data: dept } = await supabase
        .from('departments').select('name_en, name_ar').eq('id', booking.department_id).single()

      if (!ignore) {
        setNextBooking({ ...booking, deptName: dept?.name_en || '', deptNameAr: dept?.name_ar || '' })
        setApptLoading(false)
      }
    }
    fetchNext()
    return () => { ignore = true }
  }, [user])

  const filteredDepts = departments.filter(dept => {
    const remaining = dept.max_daily - (dept.bookedCount || 0)
    const matchSearch = !searchTerm ||
      dept.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.name_ar?.includes(searchTerm)
    const matchFilter = activeFilter === 'all' ||
      (activeFilter === 'open' && remaining > 0) ||
      (activeFilter === 'full' && remaining <= 0)
    return matchSearch && matchFilter
  })

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <Building2 size={48} className="text-blue-300 animate-pulse mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Loading departments...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar user={user} nextBooking={nextBooking} />

      <HeroSection
        departmentCount={departments.length}
        openCount={departments.filter(d => (d.max_daily - d.bookedCount) > 0).length}
        onScrollToDepts={scrollToDepartments}
      />

      <div className="max-w-6xl mx-auto px-4 py-10" ref={departmentsSectionRef}>
        {!apptLoading && nextBooking && <NextAppointmentCard booking={nextBooking} />}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Select Department</h2>
            <p className="text-slate-400 text-sm mt-0.5">Choose a department to book your appointment</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
            {departments.filter(d => (d.max_daily - d.bookedCount) > 0).length} open today
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Search size={16} /></span>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search departments..."
              className="w-full py-2 pl-9 pr-3.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 bg-white outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="flex gap-1.5">
            {['all', 'open', 'full'].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all ${
                  activeFilter === f
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}>
                {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Full'}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            Showing {filteredDepts.length} of {departments.length} departments
          </span>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredDepts.map(dept => (
            <motion.div key={dept.id} variants={cardVariants}>
              <DepartmentCard dept={dept} />
            </motion.div>
          ))}
        </motion.div>

        <CancelBanner />
      </div>
    </div>
  )
}

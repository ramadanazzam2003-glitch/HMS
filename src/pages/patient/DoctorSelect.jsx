import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CalendarDays, Stethoscope, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import DoctorCard from '../../components/DoctorCard'
import StepIndicator from '../../components/StepIndicator'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

function DoctorSkeleton() {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="skeleton skeleton-circle w-15 h-15 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="skeleton skeleton-text w-[55%]" />
        <div className="skeleton skeleton-text w-[35%]" />
        <div className="skeleton skeleton-text w-[70%]" />
      </div>
      <div className="skeleton w-[90px] h-6 rounded-full shrink-0" />
    </div>
  )
}


export default function DoctorSelect() {
  const { departmentId }  = useParams()
  const [searchParams]    = useSearchParams()
  const bookingType       = searchParams.get('type')
  const navigate          = useNavigate()

  const [doctors, setDoctors]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [department, setDepartment] = useState(null)
  const [search, setSearch]         = useState('')
  const [filterToday, setFilterToday] = useState(false)

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: dept } = await supabase
        .from('departments').select('*')
        .eq('id', departmentId).single()

      let query = supabase.from('doctors').select('*').eq('department_id', departmentId)
      if (bookingType) query = query.eq('type', bookingType)
      const { data: docs } = await query

      if (!ignore) {
        setDepartment(dept)
        setDoctors(docs || [])
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [departmentId, bookingType])

  const isAvailableToday = (doc) => {
    if (!doc.working_days || doc.working_days.length === 0) return false
    return doc.working_days.includes(todayName)
  }

  const handleSelect = (doctor) => {
    navigate(`/slot-select/${doctor.id}`, {
      state: { doctor, bookingType, deptId: departmentId },
    })
  }

  const filtered = useMemo(() => {
    return doctors.filter(doc => {
      const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase())
      const matchToday = !filterToday || isAvailableToday(doc)
      return matchSearch && matchToday
    })
  }, [doctors, search, filterToday])

  const todayCount = doctors.filter(d => isAvailableToday(d)).length

  return (
    <div className="page">
      <Navbar
        back={`/booking-type/${departmentId}`}
        subtitle={department?.name_en}
        breadcrumbs={[
          { label: 'Departments', path: '/' },
          { label: 'Type', path: `/booking-type/${departmentId}` },
          { label: bookingType === 'consultant' ? 'Consultant' : 'Doctor' },
        ]}
      />

      <div className="hero-gradient">
        <div className="hero-inner text-center">
          <span className="hero-chip">{department?.name_en}</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2 flex items-center justify-center gap-2">
            {bookingType === 'consultant' ? (
              <><Stethoscope size={24} /> Select Consultant</>
            ) : (
              <><UserRound size={24} /> Select Doctor</>
            )}
          </h1>
          <p className="text-white/65 text-sm">
            {doctors.length} {bookingType === 'consultant' ? 'consultant' : 'doctor'}{doctors.length !== 1 ? 's' : ''} available
            {todayCount > 0 && ` · ${todayCount} available today`}
          </p>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={2} />

        {!loading && doctors.length > 0 && (
          <div className="flex gap-2.5 mb-4 flex-wrap">
            <div className="flex-1 min-w-[180px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Search size={16} /></span>
              <input
                className="input pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${bookingType === 'consultant' ? 'consultants' : 'doctors'}...`}
              />
            </div>

            <button
              onClick={() => setFilterToday(f => !f)}
              className={`btn btn-md gap-1.5 ${filterToday ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}
            >
              <CalendarDays size={14} /> Available Today
              {filterToday && todayCount > 0 && (
                <span className="badge badge-success py-0.5 px-1.5 text-[10px]">{todayCount}</span>
              )}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array(4).fill(0).map((_, i) => <DoctorSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">
              {search || filterToday ? <Search size={48} className="text-gray-300" /> : <Stethoscope size={48} className="text-gray-300" />}
            </div>
            <p className="empty-state-title">
              {search || filterToday ? 'No Results Found' : `No ${bookingType === 'consultant' ? 'Consultants' : 'Doctors'} Available`}
            </p>
            <p className="empty-state-desc">
              {search
                ? `No results for "${search}". Try a different name.`
                : filterToday
                  ? 'No doctors are available today. Try removing the filter.'
                  : `No ${bookingType === 'consultant' ? 'consultants' : 'doctors'} are currently available in this department.`}
            </p>
            {(search || filterToday) && (
              <button onClick={() => { setSearch(''); setFilterToday(false) }} className="btn btn-secondary btn-md">Clear Filters</button>
            )}
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((doc) => (
              <motion.div key={doc.id} variants={cardVariants}>
                <DoctorCard doc={doc} bookingType={bookingType}
                  isAvailableToday={isAvailableToday} onSelect={handleSelect} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

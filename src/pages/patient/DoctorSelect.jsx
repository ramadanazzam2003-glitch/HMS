import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CalendarDays, Stethoscope, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Input } from '../../components/ui/input'
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
    <Card className="p-5 flex items-center gap-4">
      <Skeleton className="w-15 h-15 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-[55%]" />
        <Skeleton className="h-3 w-[35%]" />
        <Skeleton className="h-3 w-[70%]" />
      </div>
      <Skeleton className="w-[90px] h-6 rounded-full shrink-0" />
    </Card>
  )
}

export default function DoctorSelect() {
  const { departmentId }  = useParams()
  const [searchParams]    = useSearchParams()
  const bookingType       = searchParams.get('type')
  const navigate          = useNavigate()
  const { t, isRTL } = useLanguage()

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
        // الدكاترة النشطين الأول، وبعدين الـ inactive في الآخر
        const sorted = [...(docs || [])].sort((a, b) => {
          if (a.is_active === b.is_active) return 0
          return a.is_active === false ? 1 : -1
        })
        setDoctors(sorted)
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [departmentId, bookingType])

  const isAvailableToday = (doc) => {
    if (doc.is_active === false) return false
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
    <div className="page pt-[72px]">
      <PublicNavbar back={`/booking-type/${departmentId}`} />

      <div className="hero-gradient">
        <div className="hero-inner text-center">
          <span className="hero-chip">{department?.name_en}</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2 flex items-center justify-center gap-2">
            {bookingType === 'consultant' ? (
              <><Stethoscope size={24} /> {t.selectConsultant}</>
            ) : (
              <><UserRound size={24} /> {t.selectDoctor}</>
            )}
          </h1>
          <p className="text-white/65 text-sm">
            {isRTL
              ? `${doctors.length} ${bookingType === 'consultant' ? 'استشاري' : 'طبيب'} ${doctors.length !== 1 ? 'ين' : ''} متاح`
              : `${doctors.length} ${bookingType === 'consultant' ? 'consultant' : 'doctor'}${doctors.length !== 1 ? 's' : ''} available`
            }
            {todayCount > 0 && (isRTL ? ` · ${todayCount} متاح اليوم` : ` · ${todayCount} available today`)}
          </p>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={2} />

        {!loading && doctors.length > 0 && (
          <div className="flex gap-2.5 mb-4 flex-wrap">
            <div className="flex-1 min-w-[180px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-txt-muted"><Search size={16} /></span>
              <Input
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={bookingType === 'consultant' ? t.searchConsultants : t.searchDoctors}
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setFilterToday(f => !f)}
              className={`gap-1.5 ${filterToday ? 'bg-green-50 text-green-600 border-green-200' : ''}`}
            >
              <CalendarDays size={14} /> {t.availableToday}
              {filterToday && todayCount > 0 && (
                <Badge variant="success" className="py-0.5 px-1.5 text-[10px]">{todayCount}</Badge>
              )}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array(4).fill(0).map((_, i) => <DoctorSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center p-8">
            <div className="mb-4">
              {search || filterToday ? <Search size={48} className="text-txt-muted mx-auto" /> : <Stethoscope size={48} className="text-txt-muted mx-auto" />}
            </div>
            <h3 className="text-lg font-bold text-txt-primary mb-2">
              {search || filterToday ? t.noResultsFound : (bookingType === 'consultant' ? t.noConsultantsDept : t.noDoctorsDept)}
            </h3>
            <p className="text-sm text-txt-muted mb-6">
              {search
                ? (isRTL ? `لا توجد نتائج لـ "${search}". جرب اسماً آخر.` : `No results for "${search}". Try a different name.`)
                : filterToday
                  ? t.noDoctorsToday
                  : (bookingType === 'consultant' ? t.consultantsNotAvailable : t.doctorsNotAvailable)}
            </p>
            {(search || filterToday) && (
              <Button variant="outline" onClick={() => { setSearch(''); setFilterToday(false) }}>{t.clearFilters}</Button>
            )}
          </Card>
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
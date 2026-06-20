import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Building2, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../hooks/useAuth'
import PublicNavbar from '../../components/layout/PublicNavbar'
import HeroSection from '../../components/home/HeroSection'
import NextAppointmentCard from '../../components/home/NextAppointmentCard'
import DepartmentCard from '../../components/home/DepartmentCard'
import CancelBanner from '../../components/home/CancelBanner'
import HomeSections from '../../components/home/HomeSections'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'

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
  const { lang, t } = useLanguage()
  const isRTL = lang === 'ar'

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

      const [deptRes, bookingRes, nextRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('bookings').select('department_id').eq('status', 'active').eq('booking_date', today),
        supabase.from('bookings').select('*, doctors(name), departments(name_en, name_ar)')
          .eq('status', 'active').order('booking_date', { ascending: true }).limit(1),
      ])

      if (ignore) return

      const depts = deptRes.data
      if (!depts) { setLoading(false); return }

      const countMap = {}
      bookingRes.data?.forEach(b => { countMap[b.department_id] = (countMap[b.department_id] || 0) + 1 })

      setDepartments(depts.map(d => ({ ...d, bookedCount: countMap[d.id] || 0 })))
      setLoading(false)

      const next = nextRes.data?.[0]
      if (next) {
        setNextBooking({
          ...next,
          deptName: next.departments?.name_en || '',
          deptNameAr: next.departments?.name_ar || '',
        })
      }
      setApptLoading(false)
    }
    load()
    return () => { ignore = true }
  }, [navigate])

  const filteredDepts = useMemo(() => {
    return departments.filter(dept => {
      const remaining = dept.max_daily - (dept.bookedCount || 0)
      const matchSearch = !searchTerm ||
        dept.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.name_ar?.includes(searchTerm)
      const matchFilter = activeFilter === 'all' ||
        (activeFilter === 'open' && remaining > 0) ||
        (activeFilter === 'full' && remaining <= 0)
      return matchSearch && matchFilter
    })
  }, [departments, searchTerm, activeFilter])

  const openCount = useMemo(() => {
    return departments.filter(d => (d.max_daily - d.bookedCount) > 0).length
  }, [departments])

  if (loading) return (
    <div className="min-h-screen">
      <PublicNavbar />
      <div className="flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-txt-muted font-medium">{t.loading}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      {/* New Hero Section */}
      <HeroSection
        departmentCount={departments.length}
        openCount={openCount}
        onScrollToDepts={scrollToDepartments}
      />

      {/* Statistics + Marketing Sections (without footer, without why choose us) */}
      <HomeSections hideFooter hideWhyChooseUs />

      {/* Departments Section with Real Data */}
      <section ref={departmentsSectionRef} className="py-16 lg:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 lg:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge variant="primary" className="mb-3">
              {t.bookYourAppointment}
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-txt-primary mb-2">
              {t.selectDepartment}
            </h2>
            <p className="text-txt-muted">
              {t.chooseSpecialty}
            </p>
          </motion.div>

          {!apptLoading && nextBooking && <NextAppointmentCard booking={nextBooking} />}

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-2xl bg-surface-hover border border-border">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" style={{ [isRTL ? 'right' : 'left']: '12px' }} />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchDepartments}
                className="h-9 text-sm ps-9"
              />
            </div>
            <div className="flex gap-1.5">
              {['all', 'open', 'full'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeFilter === f
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
                  }`}
                >
                  {f === 'all' ? t.all : f === 'open' ? t.filterOpenHome : t.filterFull}
                </button>
              ))}
            </div>
            <span className="text-xs text-txt-muted whitespace-nowrap">
              {isRTL ? `عرض ${filteredDepts.length} من ${departments.length} قسم` : `Showing ${filteredDepts.lhgth} of ${departments.length} departments`}
            </span>
          </div>

          {/* Department Grid */}
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
      </section>

      {/* CTA Section from HomeSections is already there - skip duplicate */}
      <div>
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-8 lg:p-16 text-center overflow-hidden"
          >
            <div className="absolute -top-20 -end-20 w-60 h-60 rounded-full bg-surface/5 pointer-events-none" />
            <div className="absolute -bottom-20 -start-20 w-60 h-60 rounded-full bg-surface/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
                {t.bookNowCta}
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
                {t.chooseRightDoctor}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-surface text-primary hover:bg-surface/90 shadow-xl" onClick={() => navigate('/register')}>
                  {t.bookNow}
                </Button>
                <Button variant="outline" size="lg" className="border-white/30 text-white bg-transparent hover:bg-surface/10">
                  {t.callUs}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <HomeSections hideFooter={false} hideStats />
    </div>
  )
}

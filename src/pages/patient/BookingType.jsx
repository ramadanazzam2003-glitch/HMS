import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stethoscope, UserRound, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../contexts/LanguageContext'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import StepIndicator from '../../components/StepIndicator'

function TypeCard({ icon, title, titleKey, description, count, badgeVariant, ctaLabel, ctaColor, onClick, disabled, animDelay }) {
  const { t } = useLanguage()
  return (
    <motion.div
      onClick={() => !disabled && onClick()}
      whileHover={!disabled ? { y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`animate-fadeIn ${disabled ? 'opacity-55 cursor-default' : 'cursor-pointer'}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <Card className={`p-7 text-center relative overflow-hidden transition-all duration-300 ${disabled ? 'opacity-55' : 'hover:shadow-xl hover:-translate-y-1 hover:border-blue-200'}`}>
        <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-60 pointer-events-none ${disabled ? 'bg-gray-100' : 'bg-blue-50'}`} />

        <div className={`w-17 h-17 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 ${disabled ? 'bg-gray-100 grayscale' : 'bg-blue-50'}`}>
          {icon}
        </div>

        <h3 className={`font-display text-lg font-bold mb-2 ${disabled ? 'text-txt-muted' : 'text-txt-primary'}`}>
          {title}
        </h3>

        <p className="text-sm text-txt-muted leading-relaxed mb-4 min-h-10">
          {disabled
            ? (titleKey === 'consultant' ? t.consultantsNotAvailable : t.doctorsNotAvailable)
            : description}
        </p>

        {!disabled && <Badge variant={badgeVariant}>{count} {t.availableLabel}</Badge>}

        {!disabled && (
          <Button className="w-full mt-5 text-white border-none" style={{ background: ctaColor }}>
            {ctaLabel} →
          </Button>
        )}
      </Card>
    </motion.div>
  )
}

export default function BookingType() {
  const { departmentId } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [counts, setCounts]         = useState({ consultant: 0, doctor: 0 })
  const [department, setDepartment] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: dept } = await supabase
        .from('departments').select('*')
        .eq('id', departmentId).single()

      // بنجيب is_active كمان عشان الدكتور الـ inactive ميتحسبش "متاح"
      const { data: docs } = await supabase
        .from('doctors').select('type, is_active')
        .eq('department_id', departmentId)

      if (!ignore) {
        setDepartment(dept)
        setCounts({
          consultant: docs?.filter(d => d.type === 'consultant' && d.is_active !== false).length || 0,
          doctor:     docs?.filter(d => d.type === 'doctor' && d.is_active !== false).length     || 0,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [departmentId])

  const isDeptClosed = department?.is_open === false
  const hasAny = !isDeptClosed && (counts.consultant > 0 || counts.doctor > 0)

  if (loading) return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <p className="text-txt-muted font-medium">{t.loading}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/" />

      <div className="hero-gradient">
        <div className="hero-inner text-center">
          <span className="hero-chip">{department?.name_en} · {department?.name_ar}</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">{t.selectBookingType}</h1>
          <p className="text-white/65 text-sm">{t.chooseBookingMethod}</p>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={1} />

        {isDeptClosed ? (
          <Card className="text-center p-8">
            <div className="mb-4"><Building2 size={48} className="text-txt-muted mx-auto" /></div>
            <h3 className="text-lg font-bold text-txt-primary mb-2">{t.deptClosedTitle}</h3>
            <p className="text-sm text-txt-muted mb-6">{t.deptClosedMsg}</p>
            <Button variant="outline" onClick={() => navigate('/')}>{t.backToDepartments}</Button>
          </Card>
        ) : !hasAny ? (
          <Card className="text-center p-8">
            <div className="mb-4"><Building2 size={48} className="text-txt-muted mx-auto" /></div>
            <h3 className="text-lg font-bold text-txt-primary mb-2">{t.noStaffAvailable}</h3>
            <p className="text-sm text-txt-muted mb-6">{t.noStaffMsg}</p>
            <Button variant="outline" onClick={() => navigate('/')}>{t.backToDepartments}</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TypeCard icon={<Stethoscope size={32} className="text-blue-600" />} title={t.consultantLabel} titleKey="consultant" description={t.consultantDesc}
              count={counts.consultant} badgeVariant="primary" ctaLabel={t.bookConsultant} ctaColor="var(--primary)"
              onClick={() => navigate(`/doctor-select/${departmentId}?type=consultant`)} disabled={counts.consultant === 0} animDelay={0} />
            <TypeCard icon={<UserRound size={32} className="text-teal-600" />} title={t.doctor} titleKey="doctor" description={t.doctorDesc}
              count={counts.doctor} badgeVariant="default" ctaLabel={t.bookDoctor} ctaColor="var(--secondary)"
              onClick={() => navigate(`/doctor-select/${departmentId}?type=doctor`)} disabled={counts.doctor === 0} animDelay={80} />
          </div>
        )}
      </div>
    </div>
  )
}
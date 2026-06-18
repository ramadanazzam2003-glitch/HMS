import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stethoscope, UserRound, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PublicNavbar from '../../components/layout/PublicNavbar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import StepIndicator from '../../components/StepIndicator'

function TypeCard({ icon, title, description, count, badgeVariant, ctaLabel, ctaColor, onClick, disabled, animDelay }) {
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
            ? `No ${title.toLowerCase()}s are currently available in this department.`
            : description}
        </p>

        {!disabled && <Badge variant={badgeVariant}>{count} available</Badge>}

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
  const [counts, setCounts]         = useState({ consultant: 0, doctor: 0 })
  const [department, setDepartment] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data: dept } = await supabase
        .from('departments').select('*')
        .eq('id', departmentId).single()

      const { data: docs } = await supabase
        .from('doctors').select('type')
        .eq('department_id', departmentId)

      if (!ignore) {
        setDepartment(dept)
        setCounts({
          consultant: docs?.filter(d => d.type === 'consultant').length || 0,
          doctor:     docs?.filter(d => d.type === 'doctor').length     || 0,
        })
        setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [departmentId])

  const hasAny = counts.consultant > 0 || counts.doctor > 0

  if (loading) return (
    <div className="page pt-[72px]">
      <PublicNavbar back="/" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <p className="text-txt-muted font-medium">Loading…</p>
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">Select Booking Type</h1>
          <p className="text-white/65 text-sm">Choose how you want to book your appointment</p>
        </div>
      </div>

      <div className="page-content">
        <StepIndicator currentStep={1} />

        {!hasAny ? (
          <Card className="text-center p-8">
            <div className="mb-4"><Building2 size={48} className="text-txt-muted mx-auto" /></div>
            <h3 className="text-lg font-bold text-txt-primary mb-2">No Staff Available</h3>
            <p className="text-sm text-txt-muted mb-6">No medical staff are currently assigned to this department.</p>
            <Button variant="outline" onClick={() => navigate('/')}>← Back to Departments</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TypeCard icon={<Stethoscope size={32} className="text-blue-600" />} title="Consultant" description="See the next available consultant for expert specialist advice"
              count={counts.consultant} badgeVariant="primary" ctaLabel="Book Consultant" ctaColor="var(--primary)"
              onClick={() => navigate(`/doctor-select/${departmentId}?type=consultant`)} disabled={counts.consultant === 0} animDelay={0} />
            <TypeCard icon={<UserRound size={32} className="text-teal-600" />} title="Doctor" description="Choose a specific doctor for your appointment"
              count={counts.doctor} badgeVariant="default" ctaLabel="Book Doctor" ctaColor="var(--secondary)"
              onClick={() => navigate(`/doctor-select/${departmentId}?type=doctor`)} disabled={counts.doctor === 0} animDelay={80} />
          </div>
        )}
      </div>
    </div>
  )
}

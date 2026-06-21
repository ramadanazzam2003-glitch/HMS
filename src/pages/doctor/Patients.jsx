import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'framer-motion'
import { Users, Search, ArrowLeft } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

export default function DoctorPatients() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isRTL } = useLanguage()

  const [doctor, setDoctor] = useState(null)
  const [allPatients, setAllPatients] = useState([])
  const [patientFilter, setPatientFilter] = useState('all')
  const [patientsLoading, setPatientsLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const loadPatients = async () => {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (ignore || !doctorData) { setPatientsLoading(false); return }
      setDoctor(doctorData)

      const { data: allRes } = await supabase
        .from('bookings')
        .select('*, departments(name_en, name_ar)')
        .eq('doctor_id', doctorData.id)
        .order('booking_date', { ascending: false })

      if (!ignore) {
        setAllPatients(allRes || [])
        setPatientsLoading(false)
      }
    }

    loadPatients()
    return () => { ignore = true }
  }, [user?.id])

  return (
    <DashboardLayout>
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/doctor')}
          className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-bold text-txt-primary">
          {isRTL ? 'المرضى' : 'Patients'}
        </h1>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-txt-muted" />
            <h2 className="font-display text-base font-bold text-txt-primary">
              {isRTL ? 'جميع المرضى' : 'All Patients'}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {[
              { value: 'all', label: isRTL ? 'الكل' : 'All' },
              { value: 'completed', label: isRTL ? 'مكتمل' : 'Completed' },
              { value: 'not_completed', label: isRTL ? 'غير مكتمل' : 'Not Completed' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setPatientFilter(f.value)}
                className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all ${
                  patientFilter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {patientsLoading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : allPatients.length === 0 ? (
          <p className="text-txt-muted text-center py-8">{isRTL ? 'لا يوجد مرضى' : 'No Patients'}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allPatients
              .filter(b => {
                if (patientFilter === 'completed') return b.status === 'completed'
                if (patientFilter === 'not_completed') return b.status !== 'completed'
                return true
              })
              .map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-surface-hover border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-txt-primary text-sm truncate">{b.patient_name}</p>
                      <p className="text-xs text-txt-muted">
                        {b.phone}
                        {b.booking_date && <span> · {new Date(b.booking_date).toLocaleDateString()}</span>}
                        {b.slot_time && <span> · {b.slot_time}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={b.status === 'active' ? 'success' : b.status === 'completed' ? 'primary' : 'danger'}>
                      {b.status === 'active' ? (isRTL ? 'نشط' : 'Active') : b.status === 'completed' ? (isRTL ? 'مكتمل' : 'Completed') : (isRTL ? 'ملغي' : 'Cancelled')}
                    </Badge>
                    {b.status === 'active' && (
                      <Button variant="primary" size="sm" onClick={() => navigate(`/doctor/consultation/${b.id}`)}>
                        {isRTL ? 'استشارة' : 'Consult'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

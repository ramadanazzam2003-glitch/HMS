import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, Building2, Users, FileText, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'

function CountUp({ end, duration = 2 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    let rafId
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setCount(Math.floor(end * progress))
      if (progress < 1) rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => { if (rafId) cancelAnimationFrame(rafId) }
  }, [end, duration])

  return count
}

export default function Overview() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { isRTL } = useLanguage()

  const [stats, setStats] = useState({ total: 0, active: 0, cancelled: 0, departments: [], todayBookings: 0, doctorCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingRes, docRes] = await Promise.all([
          supabase.from('bookings').select('status, department_id, departments(name_en, name_ar)').limit(1000),
          supabase.from('doctors').select('id', { count: 'exact', head: true }),
        ])

        if (bookingRes.error) {
          console.error('Bookings fetch error:', bookingRes.error)
          throw bookingRes.error
        }
        if (docRes.error) {
          console.error('Doctors fetch error:', docRes.error)
          throw docRes.error
        }

        const bookings = bookingRes.data || []
        const total = bookings.length
        const active = bookings.filter(b => b.status === 'active').length
        const cancelled = bookings.filter(b => b.status === 'cancelled').length
        const today = new Date().toISOString().slice(0, 10)

        const deptMap = {}
        bookings.forEach(b => {
          const name = isRTL ? (b.departments?.name_ar || b.departments?.name_en || 'Unknown') : (b.departments?.name_en || 'Unknown')
          if (!deptMap[name]) deptMap[name] = { total: 0, active: 0 }
          deptMap[name].total++
          if (b.status === 'active') deptMap[name].active++
        })

        setStats({
          total, active, cancelled,
          departments: Object.entries(deptMap).map(([name, data]) => ({ name, ...data })),
          todayBookings: bookings.filter(b => b.booking_date === today).length,
          doctorCount: docRes.count || 0,
        })
      } catch (err) {
        console.error('fetchStats failed:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [isRTL])

 const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

  const item = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  }

  const kpis = [
    { value: stats.total, labelAr: 'إجمالي الحجوزات', labelEn: 'Total Bookings', change: '+12%', up: true, icon: BarChart3, color: 'text-primary', bg: 'bg-primary-light' },
    { value: stats.todayBookings, labelAr: 'حجوزات اليوم', labelEn: "Today's Bookings", change: '+5%', up: true, icon: CalendarDays, color: 'text-success', bg: 'bg-success-light' },
    { value: stats.active, labelAr: 'الحجوزات النشطة', labelEn: 'Active Bookings', change: '+8%', up: true, icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { value: stats.cancelled, labelAr: 'ملغاة', labelEn: 'Cancelled', change: '-3%', up: false, icon: Building2, color: 'text-danger', bg: 'bg-danger-light' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-danger-light border border-danger/20 rounded-2xl p-6 text-center">
          <p className="text-danger font-semibold mb-1">{isRTL ? 'حدث خطأ في تحميل البيانات' : 'Failed to load dashboard data'}</p>
          <p className="text-txt-muted text-sm">{error.message || String(error)}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">
              {isRTL ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <p className="text-txt-muted text-sm mt-1">
              {isRTL ? `مرحباً بعودتك، ${profile?.full_name || 'User'}` : `Welcome back, ${profile?.full_name || 'User'}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="success" className="text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 inline-block animate-pulse" />
              {isRTL ? 'النظام يعمل' : 'System Active'}
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <motion.div key={kpi.labelEn} variants={item} className="relative group">
                <div className="relative bg-surface rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                      <Icon size={22} />
                    </div>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${kpi.up ? 'text-success' : 'text-danger'}`}>
                      {kpi.change}
                      {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-txt-primary mb-1 font-display">
                    <CountUp end={kpi.value} duration={1.5} />
                  </div>
                  <p className="text-sm text-txt-muted">{isRTL ? kpi.labelAr : kpi.labelEn}</p>
                  {i === 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/40 to-transparent rounded-full" />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {/* Bookings by Department */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{isRTL ? 'الحجوزات حسب القسم' : 'Bookings by Department'}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.departments.length === 0 ? (
                  <p className="text-txt-muted text-center py-8">{isRTL ? 'لا توجد بيانات' : 'No data'}</p>
                ) : (
                  <div className="space-y-4">
                    {stats.departments.map((dept, i) => (
                      <div key={dept.name}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-txt-primary">{dept.name}</span>
                          <span className="text-txt-muted">{dept.active} / {dept.total}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((dept.active / Math.max(dept.total, 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{isRTL ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: CalendarDays, labelAr: 'حجز جديد', labelEn: 'New Booking', color: 'text-primary', bg: 'bg-primary-light', path: '/dashboard/bookings' },
                    { icon: Users, labelAr: 'مريض جديد', labelEn: 'New Patient', color: 'text-success', bg: 'bg-success-light', path: '/dashboard/medical-records' },
                    { icon: CreditCard, labelAr: 'فاتورة جديدة', labelEn: 'New Invoice', color: 'text-secondary', bg: 'bg-secondary/10', path: '/dashboard/billing/new' },
                    { icon: FileText, labelAr: 'سجل طبي', labelEn: 'Medical Record', color: 'text-purple-500', bg: 'bg-purple-50', path: '/dashboard/medical-records' },
                    { icon: BarChart3, labelAr: 'تقارير', labelEn: 'Reports', color: 'text-orange-500', bg: 'bg-orange-50', path: '/dashboard/analytics' },
                    { icon: Building2, labelAr: 'الإعدادات', labelEn: 'Settings', color: 'text-teal-500', bg: 'bg-teal-50', path: '/dashboard/settings' },
                  ].map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                          <Icon size={20} />
                        </div>
                        <span className="text-xs font-semibold text-txt-primary">
                          {isRTL ? action.labelAr : action.labelEn}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Navigation */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'التنقل السريع' : 'Quick Navigation'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate('/dashboard/bookings')}>
                  <CalendarDays size={16} /> {isRTL ? 'عرض الحجوزات' : 'View Bookings'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard/analytics')}>
                  <BarChart3 size={16} /> {isRTL ? 'التقارير' : 'Analytics'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard/billing')}>
                  <CreditCard size={16} /> {isRTL ? 'الفواتير' : 'Billing'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Building2 size={16} /> {isRTL ? 'بوابة المريض' : 'Patient Portal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
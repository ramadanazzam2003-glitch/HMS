import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, ChevronDown, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function Patients() {
  const { isRTL } = useLanguage()

  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deletingPhone, setDeletingPhone] = useState(null)
  const PAGE_SIZE = 25

  const loadPatients = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('patient_name, phone, age, booking_date, status, departments(name_en, name_ar)')
      .order('created_at', { ascending: false })

    const uniquePatients = {}
    data?.forEach(b => {
      const key = b.phone
      if (!uniquePatients[key]) {
        uniquePatients[key] = {
          name: b.patient_name,
          phone: b.phone,
          age: b.age,
          lastVisit: b.booking_date,
          department: b.departments,
          totalVisits: 0,
          activeBookings: 0,
        }
      }
      uniquePatients[key].totalVisits++
      if (b.status === 'active') uniquePatients[key].activeBookings++
      if (b.booking_date > uniquePatients[key].lastVisit) {
        uniquePatients[key].lastVisit = b.booking_date
        uniquePatients[key].department = b.departments
      }
    })

    setPatients(Object.values(uniquePatients))
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('patient_name, phone, age, booking_date, status, departments(name_en, name_ar)')
        .order('created_at', { ascending: false })

      const uniquePatients = {}
      data?.forEach(b => {
        const key = b.phone
        if (!uniquePatients[key]) {
          uniquePatients[key] = {
            name: b.patient_name,
            phone: b.phone,
            age: b.age,
            lastVisit: b.booking_date,
            department: b.departments,
            totalVisits: 0,
            activeBookings: 0,
          }
        }
        uniquePatients[key].totalVisits++
        if (b.status === 'active') uniquePatients[key].activeBookings++
        if (b.booking_date > uniquePatients[key].lastVisit) {
          uniquePatients[key].lastVisit = b.booking_date
          uniquePatients[key].department = b.departments
        }
      })

      if (!ignore) { setPatients(Object.values(uniquePatients)); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleDeletePatient = async (phone, name) => {
    const confirmMsg = isRTL
      ? `هل أنت متأكد من حذف المريض "${name}"؟ سيتم حذف جميع حجوزاته نهائيًا.`
      : `Are you sure you want to delete patient "${name}"? All their bookings will be permanently deleted.`

    if (!window.confirm(confirmMsg)) return

    setDeletingPhone(phone)
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('phone', phone)

      if (error) throw error

      setPatients(prev => prev.filter(p => p.phone !== phone))
    } catch (err) {
      console.error('Error deleting patient:', err)
      alert(isRTL ? 'حدث خطأ أثناء حذف المريض' : 'An error occurred while deleting the patient')
    } finally {
      setDeletingPhone(null)
    }
  }

  const filtered = patients.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">
              {isRTL ? 'المرضى' : 'Patients'}
            </h1>
            <p className="text-txt-muted text-sm mt-1">
              {isRTL ? 'عرض وإدارة جميع المرضى' : 'View and manage all patients'}
            </p>
          </div>
          <Badge variant="primary" className="text-xs">
            {filtered.length} {isRTL ? 'مريض' : 'patients'}
          </Badge>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
          <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
            <Search size={16} className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="h-9 text-sm ps-9"
              placeholder={isRTL ? 'بحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users size={48} className="text-txt-disabled mb-4" />
              <p className="text-txt-primary font-semibold mb-1">
                {isRTL ? 'لا يوجد مرضى' : 'No Patients Found'}
              </p>
              <p className="text-txt-muted text-sm">
                {search
                  ? (isRTL ? 'لا توجد نتائج مطابقة للبحث' : 'No patients match your search.')
                  : (isRTL ? 'لا يوجد مرضى في النظام بعد' : 'No patients in the system yet.')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    {(isRTL
                      ? ['الاسم', 'الهاتف', 'العمر', 'القسم', 'آخر زيارة', 'الزيارات', 'الحجوزات النشطة', 'إجراءات']
                      : ['Name', 'Phone', 'Age', 'Department', 'Last Visit', 'Total Visits', 'Active Bookings', 'Actions']
                    ).map(col => (
                      <th key={col} className="px-4 py-3 text-start font-semibold text-txt-muted text-xs whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => (
                    <motion.tr
                      key={p.phone}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {p.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-txt-primary">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-txt-muted">{p.phone}</td>
                      <td className="px-4 py-3 text-txt-secondary">{p.age || '-'}</td>
                      <td className="px-4 py-3 text-txt-muted">
                        {isRTL ? (p.department?.name_ar || p.department?.name_en) : p.department?.name_en}
                      </td>
                      <td className="px-4 py-3 text-txt-muted">{p.lastVisit}</td>
                      <td className="px-4 py-3">
                        <Badge variant="primary" className="text-[10px]">{p.totalVisits}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.activeBookings > 0 ? 'success' : 'secondary'} className="text-[10px]">
                          {p.activeBookings}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeletePatient(p.phone, p.name)}
                          disabled={deletingPhone === p.phone}
                          title={isRTL ? 'حذف المريض' : 'Delete patient'}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-error hover:bg-error-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-txt-muted">
                {isRTL ? 'عرض' : 'Showing'} {paginated.length} {isRTL ? 'من' : 'of'} {filtered.length}
              </span>
              {hasMore && (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="h-9 px-4 rounded-xl text-sm font-semibold bg-surface text-txt-secondary border border-border hover:bg-surface-hover transition-all"
                >
                  {isRTL ? 'المزيد' : 'Load More'} <ChevronDown size={14} className="inline" />
                </button>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
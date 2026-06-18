import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CalendarDays, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../hooks/useUI'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function Bookings() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const { confirm } = useUI()
  const { t, isRTL } = useLanguage()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const PAGE_SIZE = 25

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, doctors(name), departments(name_en, name_ar)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, doctors(name), departments(name_en, name_ar)')
        .order('created_at', { ascending: false })
      if (!ignore) { setBookings(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const handleCancel = async (id) => {
    if (!await confirm(t.cancel + '?')) return
    await supabase.from('bookings').update({ status: 'cancelled', cancelled_by: user?.id }).eq('id', id)
    fetchBookings()
  }

  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search)
    return matchStatus && matchSearch
  })

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  const handleLoadMore = () => setPage(prev => prev + 1)

  const filterLabels = { all: t.all, active: t.statusActive, cancelled: t.statusCancelled }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">
              {isRTL ? 'الحجوزات' : 'Bookings'}
            </h1>
            <p className="text-txt-muted text-sm mt-1">
              {isRTL ? 'إدارة ومتابعة جميع الحجوزات' : 'Manage and track all bookings'}
            </p>
          </div>
          <Badge variant="primary" className="text-xs">
            {filtered.length} {isRTL ? 'حجز' : 'bookings'}
          </Badge>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" style={{ [isRTL ? 'right' : 'left']: '12px' }} />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="h-9 text-sm ps-9"
              placeholder={t.searchRefPatientDoctor}
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'active', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1) }}
                className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  filter === f
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface text-txt-secondary border border-border hover:bg-surface-hover'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CalendarDays size={48} className="text-txt-disabled mb-4" />
              <p className="text-txt-primary font-semibold mb-1">{t.noData}</p>
              <p className="text-txt-muted text-sm">{t.searchRefPatientDoctor}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-hover/50">
                    {[t.ref, t.patient, t.phone, t.doctor, t.department, t.queue, t.status, t.actions].map(col => (
                      <th key={col} className="px-4 py-3 text-start font-semibold text-txt-muted text-xs whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-primary text-xs">{b.booking_ref}</td>
                      <td className="px-4 py-3 font-medium text-txt-primary">{b.patient_name}</td>
                      <td className="px-4 py-3 text-txt-muted">{b.phone}</td>
                      <td className="px-4 py-3 text-txt-secondary">{b.doctors?.name}</td>
                      <td className="px-4 py-3 text-txt-muted">{isRTL ? (b.departments?.name_ar || b.departments?.name_en) : b.departments?.name_en}</td>
                      <td className="px-4 py-3"><Badge variant="primary" className="text-[10px]">#{b.queue_number}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={b.status === 'active' ? 'success' : 'danger'} className="text-[10px]">
                          {b.status === 'active' ? t.statusActive : b.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {b.status === 'active' && hasPermission('bookings:update') && (
                          <div className="flex gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => navigate(`/reschedule/${b.id}`)}>
                              {t.reschedule}
                            </Button>
                            <Button variant="ghost" size="xs" className="text-danger hover:bg-danger-light" onClick={() => handleCancel(b.id)}>
                              {t.cancel}
                            </Button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-txt-muted">
                {t.showing} {paginated.length} {t.of} {filtered.length}
              </span>
              {hasMore && (
                <Button variant="outline" size="sm" onClick={handleLoadMore}>
                  {t.loadMore} <ChevronDown size={14} />
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

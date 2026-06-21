import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { Search, User, Phone, CalendarDays } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { motion } from 'framer-motion'

export default function PatientSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const { data } = await supabase
      .from('bookings')
      .select('patient_name, phone, booking_date, status, departments(name_en)')
      .or(`patient_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('booking_date', { ascending: false })
      .limit(20)

    setResults(data || [])
    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="font-display text-lg font-bold text-txt-primary">Search Patient</h1>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or phone..."
            className="flex-1"
          />
          <Button variant="primary" onClick={handleSearch} disabled={loading}>
            <Search size={16} />
          </Button>
        </div>

        {loading && (
          <p className="text-txt-muted text-sm text-center py-6">Searching...</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-txt-muted text-sm text-center py-6">No patients found.</p>
        )}

        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="rounded-2xl bg-surface border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-txt-primary text-sm flex items-center gap-1.5">
                    <User size={14} /> {b.patient_name}
                  </p>
                  <p className="text-xs text-txt-muted flex items-center gap-1.5">
                    <Phone size={14} /> {b.phone}
                  </p>
                  <p className="text-xs text-txt-muted flex items-center gap-1.5">
                    <CalendarDays size={14} /> {b.booking_date} · {b.departments?.name_en}
                  </p>
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => navigate(`/doctor/patient/${b.phone}`)}>
                  View Record
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
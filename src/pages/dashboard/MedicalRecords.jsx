import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../components/layout/DashboardLayout'
import MedicalRecordCard from '../../components/medical/MedicalRecordCard'
import { useLanguage } from '../../contexts/LanguageContext'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'

export default function MedicalRecords() {
  const { t } = useLanguage()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const { data } = await supabase
        .from('medical_records')
        .select('*, doctors(name), departments(name_en, name_ar), prescriptions(*)')
        .order('created_at', { ascending: false })
      if (!ignore) { setRecords(data || []); setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_phone?.includes(search) ||
      r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      r.doctors?.name?.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-txt-primary">{t.medicalRecordsPage}</h1>
            <p className="text-txt-muted text-sm mt-1">{t.searchPatientPhoneDiag}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none left-3" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 text-sm ps-9"
            placeholder={t.searchPatientPhoneDiag}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText size={48} className="text-txt-disabled mb-4" />
              <p className="text-txt-primary font-semibold">{t.noRecordsFound}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {filtered.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                >
                  <MedicalRecordCard record={record} onClick={() => {}} />
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-txt-muted">{t.showing} {filtered.length} {t.of} {records.length}</p>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

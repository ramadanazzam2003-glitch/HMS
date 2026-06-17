import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'
import MedicalRecordCard from '../../components/medical/MedicalRecordCard'
import { useLanguage } from '../../contexts/LanguageContext'

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
    <div className="page">
      <Navbar variant="dashboard" back="/dashboard" subtitle={t.medicalRecordsPage} />

      <div className="page-content-lg">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Search size={16} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="input" style={{ paddingInlineStart: 36 }}
                placeholder={t.searchPatientPhoneDiag} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
              <div className="spinner spinner-lg mx-auto mb-4" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon"><FileText size={48} style={{ color: 'var(--text-disabled)' }} /></div>
              <p className="empty-state-title">{t.noRecordsFound}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((record, i) => (
                <motion.div key={record.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <MedicalRecordCard record={record} onClick={() => {}} />
                </motion.div>
              ))}
            </div>
          )}

          <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            {t.showing} {filtered.length} {t.of} {records.length}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

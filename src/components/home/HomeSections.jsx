import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'
import { Stethoscope, Bone, Brain, Heart, Activity, Baby, Eye, Ear } from 'lucide-react'

const departments = [
  { icon: Heart, nameAr: 'القلب', nameEn: 'Cardiology', descAr: 'أمراض القلب وجراحات القلب المفتوح', descEn: 'Heart diseases and open heart surgeries', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: Bone, nameAr: 'العظام', nameEn: 'Orthopedics', descAr: 'جراحة العظام والمفاصل والعمود الفقري', descEn: 'Bone and joint surgery', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: Brain, nameAr: 'الأعصاب', nameEn: 'Neurology', descAr: 'أمراض الجهاز العصبي والمخ', descEn: 'Nervous system and brain disorders', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Eye, nameAr: 'العيون', nameEn: 'Ophthalmology', descAr: 'فحص وجراحات العيون بالليزر', descEn: 'Eye examination and laser surgery', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Ear, nameAr: 'الأنف والأذن', nameEn: 'ENT', descAr: 'أمراض الأذن والأنف والحنجرة', descEn: 'Ear, nose and throat diseases', color: 'text-teal-500', bg: 'bg-teal-50' },
  { icon: Activity, nameAr: 'الجهاز التنفسي', nameEn: 'Respiratory', descAr: 'أمراض الصدر والجهاز التنفسي', descEn: 'Chest and respiratory diseases', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { icon: Baby, nameAr: 'الأطفال', nameEn: 'Pediatrics', descAr: 'صحة الطفل ورعاية حديثي الولادة', descEn: 'Child health and newborn care', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: Stethoscope, nameAr: 'الباطنة', nameEn: 'Internal Medicine', descAr: 'تشخيص وعلاج الأمراض الباطنية', descEn: 'Diagnosis and treatment of internal diseases', color: 'text-indigo-500', bg: 'bg-indigo-50' },
]

export default function HomeSections({ hideFooter, hideWhyChooseUs, hideStats }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, t } = useLanguage()
  const isRTL = lang === 'ar'

  const scrollToSection = (id) => {
    if (location.pathname !== '/') { navigate('/'); setTimeout(() => scrollToId(id), 150); return }
    scrollToId(id)
  }
  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Statistics Section */}
      {!hideStats && <section className="relative -mt-12 z-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: '15+', key: 'yearsExperience', icon: '🏥' },
              { value: '8', key: 'deptStats', icon: '📋' },
              { value: '126+', key: 'specialists', icon: '👨‍⚕️' },
              { value: '15K+', key: 'happyPatients', icon: '❤️' },
            ].map((stat, i) => (
              <motion.div
                key={stat.labelAr}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-surface rounded-2xl border border-border p-5 lg:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-200 group"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl lg:text-3xl font-extrabold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-txt-muted">{t[stat.key]}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>}
      {!hideWhyChooseUs && (
      <section className="py-16 lg:py-24 bg-gradient-to-b from-surface to-primary-light/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&q=80"
                  alt="Medical team"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute bottom-4 start-4 end-4 p-4 rounded-xl bg-surface/90 backdrop-blur-sm text-center">
                  <p className="font-bold text-primary text-lg">15,000+</p>
                  <p className="text-sm text-txt-muted">{t.patientsTrustUs}</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium mb-4">
                {t.whyChooseUs}
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-txt-primary mb-6">
                {t.bestHealthcare}
              </h2>
              <div className="space-y-4">
                {[
                  { titleKey: 'distinguishedStaff', descKey: 'distinguishedStaffDesc' },
                  { titleKey: 'latestTech', descKey: 'latestTechDesc' },
                  { titleKey: 'service247', descKey: 'service247Desc' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface border border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-txt-primary">{t[item.titleKey]}</h4>
                      <p className="text-sm text-txt-muted">{t[item.descKey]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      {!hideFooter && (
      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                    <path d="M12 14v4M10 16h4"/>
                  </svg>
                </div>
                <span className="font-bold text-lg text-txt-primary">MediBook</span>
              </div>
              <p className="text-sm text-txt-muted leading-relaxed">
                {t.medibookDesc}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{t.quickLinks}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                {[
                  { key: 'footerHome', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                  { key: 'footerDepartments', action: () => scrollToSection('departments') },
                  { key: 'footerDoctors', action: () => navigate('/register') },
                  { key: 'footerServices', action: () => navigate('/') },
                ].map(link => (
                  <li key={link.key}><button className="hover:text-primary transition-colors" onClick={link.action}>{t[link.key]}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{t.footerDepartments}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                {['footerCardiology', 'footerOrthopedics', 'footerNeurology', 'footerPediatrics'].map(dept => (
                  <li key={dept}><button className="hover:text-primary transition-colors" onClick={() => scrollToSection('departments')}>{t[dept]}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{t.contactUs}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                <li>{isRTL ? 'info@medibook.com' : 'info@medibook.com'}</li>
                <li>{isRTL ? '+20 123 456 789' : '+20 123 456 789'}</li>
                <li>{isRTL ? 'القاهرة، مصر' : 'Cairo, Egypt'}</li>
              </ul>
              <div className="flex gap-2 mt-4">
                {[
                  { key: 'facebook', url: 'https://facebook.com/medibook' },
                  { key: 'twitter', url: 'https://twitter.com/medibook' },
                  { key: 'instagram', url: 'https://instagram.com/medibook' },
                  { key: 'linkedin', url: 'https://linkedin.com/company/medibook' },
                ].map(social => (
                  <button key={social.key} className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center text-txt-muted hover:bg-primary hover:text-white transition-all" onClick={() => window.open(social.url, '_blank')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-txt-muted">
            © 2026 MediBook. {t.allRightsReserved}
          </div>
        </div>
      </footer>
      )}
    </>
  )
}

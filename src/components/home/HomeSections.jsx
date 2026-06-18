import { useNavigate } from 'react-router-dom'
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
  const { lang } = useLanguage()
  const isRTL = lang === 'ar'

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
              { value: '15+', labelAr: 'سنوات خبرة', labelEn: 'Years Experience', icon: '🏥' },
              { value: '8', labelAr: 'أقسام طبية', labelEn: 'Departments', icon: '📋' },
              { value: '126+', labelAr: 'طبيب متخصص', labelEn: 'Specialists', icon: '👨‍⚕️' },
              { value: '15K+', labelAr: 'مريض سعيد', labelEn: 'Happy Patients', icon: '❤️' },
            ].map((stat, i) => (
              <motion.div
                key={stat.labelAr}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white rounded-2xl border border-border p-5 lg:p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-200 group"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl lg:text-3xl font-extrabold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-txt-muted">{isRTL ? stat.labelAr : stat.labelEn}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>}
      {!hideWhyChooseUs && (
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-primary-light/30">
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
                <div className="absolute bottom-4 start-4 end-4 p-4 rounded-xl bg-white/90 backdrop-blur-sm text-center">
                  <p className="font-bold text-primary text-lg">15,000+</p>
                  <p className="text-sm text-txt-muted">{isRTL ? 'مريض وثقوا بنا' : 'Patients Trust Us'}</p>
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
                {isRTL ? 'لماذا نحن؟' : 'Why Choose Us?'}
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-txt-primary mb-6">
                {isRTL ? 'أفضل رعاية صحية في بيئة متكاملة' : 'Best Healthcare in an Integrated Environment'}
              </h2>
              <div className="space-y-4">
                {[
                  { titleAr: 'كوادر طبية متميزة', titleEn: 'Distinguished Medical Staff', descAr: 'نخبة من الأطباء والاستشاريين ذوي الخبرة', descEn: 'Elite doctors and consultants with experience' },
                  { titleAr: 'أحدث التقنيات', titleEn: 'Latest Technologies', descAr: 'أجهزة طبية متطورة وفق أحدث المعايير العالمية', descEn: 'Advanced medical devices with global standards' },
                  { titleAr: 'خدمة على مدار الساعة', titleEn: '24/7 Service', descAr: 'خدمات طبية طارئة على مدار الساعة طوال أيام الأسبوع', descEn: 'Emergency medical services around the clock' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-white border border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-txt-primary">{isRTL ? item.titleAr : item.titleEn}</h4>
                      <p className="text-sm text-txt-muted">{isRTL ? item.descAr : item.descEn}</p>
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
      <footer className="border-t border-border bg-white">
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
                {isRTL ? 'نظام متكامل لإدارة المستشفيات والمواعيد الطبية' : 'Integrated hospital and appointment management system'}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{isRTL ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                {['الرئيسية', 'الأقسام', 'الأطباء', 'الخدمات'].map(link => (
                  <li key={link}><button className="hover:text-primary transition-colors">{link}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{isRTL ? 'الأقسام' : 'Departments'}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                {['القلب', 'العظام', 'الأعصاب', 'الأطفال'].map(dept => (
                  <li key={dept}><button className="hover:text-primary transition-colors">{dept}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-txt-primary mb-4">{isRTL ? 'تواصل معنا' : 'Contact Us'}</h4>
              <ul className="space-y-2.5 text-sm text-txt-muted">
                <li>{isRTL ? 'info@medibook.com' : 'info@medibook.com'}</li>
                <li>{isRTL ? '+20 123 456 789' : '+20 123 456 789'}</li>
                <li>{isRTL ? 'القاهرة، مصر' : 'Cairo, Egypt'}</li>
              </ul>
              <div className="flex gap-2 mt-4">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                  <button key={social} className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center text-txt-muted hover:bg-primary hover:text-white transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-txt-muted">
            © 2026 MediBook. {isRTL ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
      )}
    </>
  )
}

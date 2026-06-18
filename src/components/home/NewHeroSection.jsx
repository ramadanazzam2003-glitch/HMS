import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { motion } from 'framer-motion'

export default function HeroSection() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const isRTL = lang === 'ar'

  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-light/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -end-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -start-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light border border-primary/20 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {isRTL ? 'مرحباً بكم في مستشفى ميديبوك' : 'Welcome to MediBook Hospital'}
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-txt-primary leading-[1.1] mb-6">
              {isRTL ? (
                <>رعايتك الصحية<br /><span className="text-primary">أولوية</span> بالنسبة لنا</>
              ) : (
                <>Your Health<br />Is Our <span className="text-primary">Priority</span></>
              )}
            </h1>

            <p className="text-lg text-txt-secondary leading-relaxed mb-8 max-w-lg">
              {isRTL
                ? 'نقدم خدمات طبية متكاملة بأحدث التقنيات العالمية. فريقنا من الأطباء المتخصصين مستعدون لتقديم أفضل رعاية صحية لك ولعائلتك.'
                : 'We provide comprehensive medical services with the latest global technologies. Our team of specialized doctors is ready to provide the best healthcare for you and your family.'}
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/register')}
                className="h-12 px-8 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all duration-200"
              >
                {isRTL ? 'حجز موعد الآن' : 'Book Appointment Now'}
              </button>
              <button className="h-12 px-8 rounded-xl border-2 border-border text-txt-primary font-semibold text-base hover:bg-surface-hover transition-all duration-200">
                {isRTL ? 'تواصل معنا' : 'Contact Us'}
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {i === 4 ? '+' : ''}
                  </div>
                ))}
              </div>
              <p className="text-sm text-txt-muted">
                {isRTL ? 'أكثر من 15 ألف مريض وثقوا بنا' : 'Over 15K patients trust us'}
              </p>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80"
                alt={isRTL ? 'مستشفى حديث' : 'Modern Hospital'}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              {/* Floating badge */}
              <div className="absolute top-4 start-4 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-lg text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {isRTL ? 'مفتوح 24 ساعة' : 'Open 24/7'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

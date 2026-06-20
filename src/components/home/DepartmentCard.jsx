import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const DEPT_IMAGES = {
  'internal medicine': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=82',
  'pediatrics': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=82',
  'ophthalmology': 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80',
  'cardiology': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&q=82',
  'dermatology': 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=800&q=82',
  'dentistry': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&q=80',
  'obstetrics': 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=82',
  'orthopedics': 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=82',
  'neurology': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&q=80',
  'psychiatry': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  'surgery': 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&q=80',
  'urology': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80',
}

const getDeptImage = (name) => DEPT_IMAGES[name?.toLowerCase()] || DEPT_IMAGES['default']

export default function DepartmentCard({ dept }) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const bookedCount = dept.bookedCount || 0
  const remaining = dept.max_daily - bookedCount
  const isFull = remaining <= 0
  const percent = Math.min((bookedCount / dept.max_daily) * 100, 100)

  return (
    <motion.div
      onClick={() => !isFull && navigate(`/booking-type/${dept.id}`)}
      className={`relative rounded-2xl overflow-hidden h-48 transition-all duration-300 group ${
        isFull ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer shadow-md'
      }`}
      whileHover={!isFull ? { y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' } : undefined}
    >
      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${getDeptImage(dept.name_en)})` }} />
      <div className={`absolute inset-0 ${isFull ? 'bg-slate-900/70' : 'bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent group-hover:from-blue-900/95'}`} />
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${isFull ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
          {isFull ? t.deptFull : t.deptOpen}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-bold text-white text-lg leading-tight">{dept.name_en}</h3>
        <p className="text-blue-200 text-sm">{dept.name_ar}</p>
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-blue-200">{isFull ? t.noSlotsAvailable : `${remaining} ${t.slotsLeft}`}</span>
            <span className="text-xs text-blue-200">{Math.round(percent)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div className={`h-1 rounded-full transition-all ${isFull ? 'bg-red-400' : percent > 70 ? 'bg-orange-400' : 'bg-blue-300'}`}
              style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

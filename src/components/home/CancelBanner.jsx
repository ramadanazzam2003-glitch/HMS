import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarX, ArrowRight } from 'lucide-react'

export default function CancelBanner() {
  const navigate = useNavigate()

  return (
    <div className="text-center mt-10 pt-6 border-t border-slate-100">
      <style>{`
        .home-cancel-banner {
          width: 100%; max-width: 1200px; margin: 0 auto; height: 64px;
          background: linear-gradient(135deg, #0A4A8F 0%, #0D6CB3 50%, #0A5A9E 100%);
          border-radius: 16px; box-shadow: 0 8px 32px rgba(10,74,143,0.28);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: all 220ms cubic-bezier(0.22,1,0.36,1);
          border: none; outline: none;
        }
        @media (max-width: 600px) { .home-cancel-banner { padding: 0 12px; font-size: 14px; height: 54px; } }
      `}</style>

      <motion.button
        className="home-cancel-banner"
        onClick={() => navigate('/cancel')}
        type="button"
        whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(10,74,143,0.38)' }}
        whileTap={{ y: 0 }}
      >
        <span className="left">
          <CalendarX size={20} className="mr-1.5" />
          Cancel Existing Booking
        </span>
        <span className="right" aria-hidden="true"><ArrowRight size={18} /></span>
      </motion.button>
    </div>
  )
}

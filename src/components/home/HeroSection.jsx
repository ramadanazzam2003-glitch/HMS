import { motion } from 'framer-motion'
import { Building2, ArrowRight } from 'lucide-react'

export default function HeroSection({ departmentCount, openCount, onScrollToDepts }) {
  return (
    <div className="pt-14 relative z-1">
      <style>{`
        .home-hero {
          position: relative; overflow: hidden;
          background-image: url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1400&q=85');
          background-size: cover; background-position: center right; background-attachment: fixed;
          border-bottom-left-radius: 40% 60px; border-bottom-right-radius: 40% 60px;
          min-height: 460px; display: flex; flex-direction: row; align-items: center; justify-content: flex-start;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        }
        .home-hero-dot {
          position: absolute; left: 0; top: 0; bottom: 0; width: 38%; z-index: 1; pointer-events: none;
          background: linear-gradient(90deg, rgba(7,26,53,0.92) 0%, rgba(7,26,53,0.75) 50%, rgba(7,26,53,0.15) 100%);
        }
        .home-hero-left {
          position: relative; z-index: 2; flex: 0 0 38%; max-width: 38%;
          padding: 52px 56px; display: flex; flex-direction: column; justify-content: center;
          align-items: flex-start; text-align: left; height: 100%;
        }
        .home-hero-eyebrow { color: #7DD3FC; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 14px; opacity: 0.98; }
        .home-hero-headline { font-size: 3.2rem; font-weight: 900; margin-bottom: 12px; color: #FFFFFF; letter-spacing: -0.025em; line-height: 1.12; }
        .home-hero-subtitle { color: #E0F2FE; font-size: 1.1rem; margin-bottom: 32px; max-width: 420px; line-height: 1.7; font-weight: 500; }
        .home-hero-stats { display: flex; gap: 24px; flex-wrap: wrap; }
        .home-hero-wave { position: absolute; left: 0; right: 0; bottom: -1px; width: 100%; height: 60px; z-index: 5; }
        @media (max-width: 1024px) {
          .home-hero { min-height: 440px; background-position: center; }
          .home-hero-dot { width: 40%; background: linear-gradient(90deg, rgba(7,26,53,0.93) 0%, rgba(7,26,53,0.70) 50%, rgba(7,26,53,0.10) 100%); }
          .home-hero-left { flex: 0 0 40%; max-width: 40%; padding: 48px 40px; }
          .home-hero-headline { font-size: 2.8rem; }
        }
        @media (max-width: 900px) {
          .home-hero { min-height: 420px; }
          .home-hero-dot { width: 45%; background: linear-gradient(90deg, rgba(7,26,53,0.94) 0%, rgba(7,26,53,0.65) 50%, rgba(7,26,53,0.05) 100%); }
          .home-hero-left { flex: 0 0 45%; max-width: 45%; padding: 56px 32px; }
          .home-hero-headline { font-size: 2.2rem; }
          .home-hero-subtitle { font-size: 0.95rem; margin-bottom: 36px; }
        }
        @media (max-width: 768px) {
          .home-hero { min-height: 400px; flex-direction: column; border-bottom-left-radius: 32px; border-bottom-right-radius: 32px; background-position: center top; background-attachment: scroll; }
          .home-hero-dot { width: 100%; height: 100%; background: linear-gradient(180deg, rgba(7,26,53,0.85) 0%, rgba(7,26,53,0.70) 50%, rgba(7,26,53,0.50) 100%); left: 0; top: 0; bottom: auto; }
          .home-hero-left { flex: 0 0 auto; width: 100%; max-width: 100%; align-items: center; text-align: center; padding: 36px 16px; }
          .home-hero-headline { font-size: 1.8rem; }
          .home-hero-subtitle { font-size: 0.95rem; margin-bottom: 32px; }
          .home-hero-stats { gap: 12px; justify-content: center; }
        }
      `}</style>

      <div className="home-hero">
        <div className="home-hero-dot" />
        <div className="home-hero-left">
          <motion.div
            className="home-hero-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 0.98, y: 0 }}
            transition={{ duration: 0.5 }}
          >WELCOME TO MEDIBOOK</motion.div>
          <motion.div
            className="home-hero-headline"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >Book Your Appointment</motion.div>
          <motion.div
            className="home-hero-subtitle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >Fast, easy online booking for all hospital departments</motion.div>
          <motion.div
            className="home-hero-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.div
              className="home-hero-stat-pill"
              onClick={onScrollToDepts}
              title="Scroll to departments"
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(125,211,252,0.15)' }}
            >
              <div className="stat-main">{departmentCount}</div>
              <div className="stat-label">Departments ↓</div>
            </motion.div>
            <motion.div
              className="home-hero-stat-pill"
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(125,211,252,0.15)' }}
            >
              <div className="stat-main">{openCount}</div>
              <div className="stat-label">Available Now</div>
            </motion.div>
            <motion.div
              className="home-hero-stat-pill"
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(125,211,252,0.15)' }}
            >
              <div className="stat-main">15m</div>
              <div className="stat-label">Slot Duration</div>
            </motion.div>
          </motion.div>
        </div>

        <div className="home-hero-wave">
          <svg viewBox="0 0 1440 60" width="100%" height="60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#f1f5f9" fillOpacity="1" />
          </svg>
        </div>
      </div>
    </div>
  )
}

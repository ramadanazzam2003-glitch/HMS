import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Building2, CalendarCheck, ClipboardList, LogOut, Stethoscope } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function PatientNavbar({ user, nextBooking }) {
  const navigate = useNavigate()
  const navRef = useRef(null)
  const lastScrollY = useRef(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const bellRef = useRef(null)
  const avatarRef = useRef(null)

  const avatarInitial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()

  useEffect(() => {
    const handleScroll = () => {
      const nav = navRef.current
      if (!nav) return
      const currentY = window.scrollY
      if (currentY < 60) {
        nav.style.background = 'rgba(15, 23, 42, 0.45)'
        nav.style.backdropFilter = 'blur(12px)'
        nav.style.webkitBackdropFilter = 'blur(12px)'
        nav.style.boxShadow = 'none'
        nav.style.borderBottom = '1px solid rgba(255,255,255,0.08)'
      } else {
        nav.style.background = 'rgba(15, 23, 42, 0.95)'
        nav.style.backdropFilter = 'blur(16px)'
        nav.style.webkitBackdropFilter = 'blur(16px)'
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'
        nav.style.borderBottom = '1px solid rgba(255,255,255,0.06)'
      }
      if (currentY > lastScrollY.current && currentY > 80) {
        nav.style.transform = 'translateY(-100%)'
      } else {
        nav.style.transform = 'translateY(0)'
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const dropdownStyle = {
    position: 'absolute', top: 48, right: 0, minWidth: 220,
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 16, boxShadow: 'var(--shadow-lg)', zIndex: 100,
    overflow: 'hidden',
  }

  return (
    <>
      <nav ref={navRef} style={{
        background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-white">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">MediBook</p>
              <p className="text-[11px] text-white/50">Hospital System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/triage')}
              className="text-[13px] text-white/80 font-medium px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 cursor-pointer hover:bg-white/15 transition-all flex items-center gap-1.5">
              <Stethoscope size={14} />
              AI Triage
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/my-bookings')}
              className="text-[13px] text-white/80 font-medium px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 cursor-pointer hover:bg-white/15 transition-all flex items-center gap-1.5">
              <ClipboardList size={14} />
              My Bookings
            </motion.button>

            <div ref={bellRef} className="relative">
              <button onClick={() => { setBellOpen(o => !o); setAvatarOpen(false) }}
                className="w-9 h-9 rounded-[10px] bg-white/8 border border-white/12 cursor-pointer flex items-center justify-center relative hover:bg-white/15 transition-all">
                <Bell size={16} className="text-white/85" />
                {nextBooking && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-800/80">1</span>
                )}
              </button>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={dropdownStyle}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-bold text-[13px] text-gray-800">Notifications</p>
                  </div>
                  {nextBooking ? (
                    <div className="px-4 py-3">
                      <p className="text-[13px] text-gray-500 mb-2 flex items-center gap-1.5">
                        <CalendarCheck size={14} className="text-blue-600" />
                        You have <strong className="text-blue-600">1 upcoming appointment</strong>
                      </p>
                      <p className="text-xs text-gray-400 mb-2.5">{nextBooking.deptName} · {nextBooking.slot_time}</p>
                      <button onClick={() => { setBellOpen(false); navigate('/my-bookings') }}
                        className="text-xs text-blue-600 font-semibold bg-blue-50 border-none rounded-lg px-3 py-1.5 cursor-pointer w-full">
                        View My Bookings →
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-5 text-center">
                      <p className="text-[13px] text-gray-400">No upcoming appointments</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div ref={avatarRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAvatarOpen(o => !o); setBellOpen(false) }}
                className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-white/25 text-white text-sm font-bold cursor-pointer flex items-center justify-center hover:scale-105 transition-all shrink-0">
                {avatarInitial}
              </motion.button>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={dropdownStyle}>
                  <div className="px-4 py-3.5 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-800 mb-0.5">{user?.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <div className="py-1.5">
                    <button onClick={() => { setAvatarOpen(false); navigate('/my-bookings') }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 font-medium bg-transparent border-none cursor-pointer flex items-center gap-2 hover:bg-gray-50 transition-colors">
                      <ClipboardList size={14} />
                      My Bookings
                    </button>
                    <div className="h-px bg-gray-100 mx-4 my-1" />
                    <button onClick={() => { setAvatarOpen(false); handleLogout() }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 font-medium bg-transparent border-none cursor-pointer flex items-center gap-2 hover:bg-red-50 transition-colors">
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

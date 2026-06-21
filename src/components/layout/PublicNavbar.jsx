import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Moon, Sun, Globe, Menu, X } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function PublicNavbar({ back }) {
  const navigate = useNavigate()
  const { lang, toggleLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const isRTL = lang === 'ar'
  const [user, setUser] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/')
  }

  const handleNav = (path) => {
    if (path.startsWith('/#')) {
      const id = path.slice(2)
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)
    } else {
      navigate(path)
    }
  }

  const navLinks = isRTL
    ? [
        { label: 'الرئيسية', path: '/' },
        { label: 'الأقسام', path: '/#departments' },
        { label: 'المساعد الذكي ', path: '/triage' },
        { label: 'الأطباء', path: '/#doctors' },
      ]
    : [
        { label: 'Home', path: '/' },
        { label: 'Departments', path: '/#departments' },
        { label: 'AI Triage', path: '/triage' },
        { label: 'Doctors', path: '/#doctors' },
      ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Back button */}
          {back !== undefined && (
            <button
              onClick={() => { if (typeof back === 'number') navigate(back); else navigate(back) }}
              className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:bg-primary-light transition-all shrink-0"
              aria-label={isRTL ? 'رجوع' : 'Back'}
            >
              {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            </button>
          )}

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
                <path d="M12 14v4M10 16h4"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-txt-primary">MediBook</span>
          </button>

          {/* Nav Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-surface-hover transition-all duration-200"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* AI Triage Icon */}
            {/* <button
              onClick={() => navigate('/triage')}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-primary-light hover:text-primary hover:border-primary/30 transition-all"
              title={isRTL ? 'المساعد الذكي' : 'AI Triage'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4"/>
                <rect x="4" y="8" width="16" height="12" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M6 14h.01M10 14h.01M14 14h.01M18 14h.01"/>
              </svg>
              <span className="hidden xl:inline">{isRTL ? 'المساعد الذكي ' : 'AI Triage'}</span>
            </button> */}

            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-border text-txt-secondary hover:bg-surface-hover transition-all"
              title={theme === 'dark' ? (isRTL ? 'الوضع النهاري' : 'Light Mode') : (isRTL ? 'الوضع الليلي' : 'Dark Mode')}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all"
            >
              <Globe size={15} />
              <span className="text-xs font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {user ? (
              <>
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {isRTL ? 'حجوزاتي' : 'My Bookings'}
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 h-9 px-3 rounded-xl bg-primary-light text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="hidden sm:inline">{isRTL ? 'حسابي' : 'My Account'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center h-9 px-3 rounded-xl text-sm font-medium text-txt-muted hover:text-danger hover:bg-danger-light transition-all"
                >
                  {isRTL ? 'خروج' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex items-center h-9 px-4 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all"
                >
                  {isRTL ? 'دخول' : 'Login'}
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="h-9 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                >
                  {isRTL ? 'حجز موعد' : 'Book Now'}
                </button>
              </>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t border-border mt-2 pt-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileOpen(false) }}
                className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-border my-2" />
            <div className="flex gap-2 px-3 py-2">
              <button onClick={() => { toggleTheme(); setMobileOpen(false) }}
                className="flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all">
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                <span>{theme === 'dark' ? (isRTL ? 'نهاري' : 'Light') : (isRTL ? 'ليلي' : 'Dark')}</span>
              </button>
              <button onClick={() => { toggleLang(); setMobileOpen(false) }}
                className="flex items-center justify-center gap-2 flex-1 h-9 px-3 rounded-xl border border-border text-sm font-medium text-txt-secondary hover:bg-surface-hover transition-all">
                <Globe size={14} />
                <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
              </button>
            </div>
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                <button onClick={() => { navigate('/my-bookings'); setMobileOpen(false) }}
                  className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-txt-secondary hover:bg-surface-hover">
                  {isRTL ? 'حجوزاتي' : 'My Bookings'}
                </button>
                <button onClick={() => { navigate('/profile'); setMobileOpen(false) }}
                  className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-txt-secondary hover:bg-surface-hover">
                  {isRTL ? 'الملف الشخصي' : 'Profile'}
                </button>
                <button onClick={handleLogout}
                  className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger-light">
                  {isRTL ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/login'); setMobileOpen(false) }}
                  className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary-light">
                  {isRTL ? 'دخول' : 'Login'}
                </button>
                <button onClick={() => { navigate('/register'); setMobileOpen(false) }}
                  className="block w-full text-start px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover">
                  {isRTL ? 'حجز موعد' : 'Book Now'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

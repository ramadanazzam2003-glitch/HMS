import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, LogOut, ArrowLeft, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { navItems, roleBadgeColors, roleLabels } from '../config/navConfig'

export default function Navbar({
  variant = 'patient',
  back,
  subtitle,
  breadcrumbs = [],
  right,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, role, signOut } = useAuth()
  const isDark = variant === 'dashboard'

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  const allowedNav = role ? navItems.filter(item => item.roles.includes(role)) : []

  const avatarInitial = (profile?.full_name || user?.email || 'U')[0].toUpperCase()

  const badgeColors = roleBadgeColors[role] || roleBadgeColors.admin
  const roleLabel = roleLabels[role] || role

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  useEffect(() => {
    setDropdownOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  const handleBack = () => {
    if (back === undefined) return
    if (typeof back === 'number') navigate(back)
    else navigate(back)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <nav
        className="navbar"
        style={isDark ? {
          background: '#161B22',
          borderBottomColor: '#30363D',
        } : {}}
      >
        <div className="navbar-inner">

          {back !== undefined && (
            <button
              onClick={handleBack}
              className="btn-icon"
              aria-label="Go back"
              style={isDark ? {
                background: '#21262D',
                borderColor: '#30363D',
                color: '#8B949E',
              } : {}}
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <a className="navbar-brand" onClick={() => navigate(isDark ? '/dashboard' : '/')} style={{ cursor: 'pointer' }}>
            <div className="navbar-logo">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p
                className="navbar-title"
                style={isDark ? { color: '#F0F6FC' } : {}}
              >
                MediBook
              </p>
              {subtitle && (
                <p
                  className="navbar-subtitle"
                  style={isDark ? { color: '#8B949E' } : {}}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </a>

          {breadcrumbs.length > 0 && (
            <div
              className="navbar-breadcrumb"
              style={isDark ? { color: '#484F58' } : {}}
            >
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <span key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                    <span
                      className={isLast ? 'active' : ''}
                      onClick={() => !isLast && crumb.path && navigate(crumb.path)}
                      style={isDark && !isLast ? { color: '#8B949E' } : isDark && isLast ? { color: '#3B82F6' } : {}}
                    >
                      {crumb.label}
                    </span>
                  </span>
                )
              })}
            </div>
          )}

          {isDark ? (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              {right}

              <button
                className="btn-icon md:hidden"
                onClick={() => setMobileOpen(o => !o)}
                style={{ background: '#21262D', borderColor: '#30363D', color: '#8B949E' }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <div ref={dropdownRef} className="relative hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDropdownOpen(o => !o)}
                  className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-white/20 text-white text-sm font-bold cursor-pointer flex items-center justify-center hover:scale-105 transition-all shrink-0"
                  aria-label="User menu"
                >
                  {avatarInitial}
                </motion.button>

                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-[44px] w-[280px] rounded-xl overflow-hidden"
                    style={{
                      background: '#161B22',
                      border: '1px solid #30363D',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.50)',
                      zIndex: 100,
                    }}
                  >
                    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #30363D' }}>
                      <p className="font-bold text-sm" style={{ color: '#F0F6FC' }}>
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#8B949E' }}>
                        {user?.email}
                      </p>
                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
                      >
                        {roleLabel}
                      </span>
                    </div>

                    <div className="py-1.5">
                      {allowedNav.map(item => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                          <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-3 transition-colors border-none cursor-pointer"
                            style={{
                              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                              color: isActive ? '#3B82F6' : '#8B949E',
                            }}
                            onMouseEnter={e => {
                              if (!isActive) e.currentTarget.style.background = '#1C2230'
                            }}
                            onMouseLeave={e => {
                              if (!isActive) e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <Icon size={16} />
                            <span className="flex-1">{item.labelAr}</span>
                            <span className="text-[11px] opacity-60">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid #30363D' }} className="py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-3 transition-colors border-none cursor-pointer"
                        style={{ background: 'transparent', color: '#F87171' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <LogOut size={16} />
                        <span>تسجيل الخروج</span>
                        <span className="text-[11px] opacity-60">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            right && (
              <div style={{ marginLeft: breadcrumbs.length ? 0 : 'auto' }}>
                {right}
              </div>
            )
          )}
        </div>
      </nav>

      {isDark && mobileOpen && (
        <div
          className="fixed inset-0 md:hidden"
          style={{ zIndex: 40 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileOpen(false)}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto"
            style={{
              background: '#161B22',
              borderLeft: '1px solid #30363D',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.40)',
              zIndex: 50,
            }}
          >
            <div className="px-4 py-4" style={{ borderBottom: '1px solid #30363D' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-white/20 text-white text-sm font-bold flex items-center justify-center">
                    {avatarInitial}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#F0F6FC' }}>
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs" style={{ color: '#8B949E' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="btn-icon"
                  style={{ background: '#21262D', borderColor: '#30363D', color: '#8B949E' }}
                >
                  <X size={16} />
                </button>
              </div>
              <span
                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-3 border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
              >
                {roleLabel}
              </span>
            </div>

            <div className="py-2">
              {allowedNav.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium flex items-center gap-3 transition-colors border-none cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                      color: isActive ? '#3B82F6' : '#8B949E',
                    }}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.labelAr}</span>
                    <span className="text-[11px] opacity-60">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid #30363D' }} className="py-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-[13px] font-medium flex items-center gap-3 transition-colors border-none cursor-pointer"
                style={{ background: 'transparent', color: '#F87171' }}
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
                <span className="text-[11px] opacity-60">Logout</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

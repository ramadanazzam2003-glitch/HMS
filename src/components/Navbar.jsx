import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, ArrowLeft, ArrowRight, Building2, Sun, Moon, Globe, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
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
  const { theme, toggleTheme, isDark } = useTheme()
  const { lang, t, toggleLang, isRTL } = useLanguage()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  const allowedNav = role ? navItems.filter(item => item.roles.includes(role)) : []

  const avatarInitial = (profile?.full_name || user?.email || 'U')[0].toUpperCase()

  const badgeColors = roleBadgeColors[role] || roleBadgeColors.admin
  const roleLabel = t[role] || roleLabels[role] || role

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

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <>
      <nav className="navbar" style={{ background: 'var(--surface)' }}>
        <div className="navbar-inner">
          {back !== undefined && (
            <button onClick={handleBack} className="btn-icon" aria-label={t.back}>
              <ArrowIcon size={16} />
            </button>
          )}

          <a className="navbar-brand" onClick={() => navigate(isDark ? '/dashboard' : '/')} style={{ cursor: 'pointer' }}>
            <div className="navbar-logo">
              <Building2 size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <p className="navbar-title">MediBook</p>
              {subtitle && (
                <p className="navbar-subtitle">{subtitle}</p>
              )}
            </div>
          </a>

          {breadcrumbs.length > 0 && (
            <div className="navbar-breadcrumb">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <span key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <span style={{ opacity: 0.5 }}>{isRTL ? '‹' : '›'}</span>}
                    <span
                      className={isLast ? 'active' : ''}
                      onClick={() => !isLast && crumb.path && navigate(crumb.path)}
                    >
                      {crumb.label}
                    </span>
                  </span>
                )
              })}
            </div>
          )}

          <div className="navbar-actions">
            {right}

            <button className="lang-toggle" onClick={toggleLang} title={lang === 'ar' ? 'Switch to English' : 'تحويل إلى العربية'}>
              <Globe size={14} />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              className="btn-icon md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                className="navbar-avatar"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label="User menu"
              >
                {avatarInitial}
              </button>

              {dropdownOpen && (
                <div
                  className="navbar-dropdown"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {profile?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {user?.email}
                    </p>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
                    >
                      {roleLabel}
                    </span>
                  </div>

                  <div style={{ padding: '6px 0' }}>
                    {allowedNav.map(item => {
                      const Icon = item.icon
                      const isActive = location.pathname === item.path
                      return (
                        <button
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className="navbar-dropdown-item"
                          style={{
                            background: isActive ? 'var(--primary-light)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                          }}
                        >
                          <Icon size={16} />
                          <span className="flex-1">{item.labelAr}</span>
                          <span style={{ fontSize: 11, opacity: 0.5 }}>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item"
                      style={{ color: 'var(--danger)' }}
                    >
                      <LogOut size={16} />
                      <span className="flex-1">{t.logout}</span>
                      <span style={{ fontSize: 11, opacity: 0.5 }}>{t.logoutEn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="navbar-overlay md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)}>
          <div
            className="navbar-drawer"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderInlineEnd: '1px solid var(--border)',
              boxShadow: isRTL ? '-4px 0 24px rgba(0,0,0,0.15)' : '4px 0 24px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="navbar-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                    {avatarInitial}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {profile?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>
              <span
                className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-3 border ${badgeColors.bg} ${badgeColors.text} ${badgeColors.border}`}
              >
                {roleLabel}
              </span>
            </div>

            <div style={{ padding: '8px 0' }}>
              {allowedNav.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="navbar-dropdown-item"
                    style={{
                      padding: '12px 16px',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.labelAr}</span>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 8, padding: '8px 16px' }}>
                <button onClick={() => { toggleTheme(); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-txt-secondary hover:bg-surface-hover flex-1 justify-center border border-border">
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{isDark ? 'Light' : 'Dark'}</span>
                </button>
                <button onClick={() => { toggleLang(); setMobileOpen(false) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-txt-secondary hover:bg-surface-hover flex-1 justify-center border border-border">
                  <Globe size={14} />
                  <span>{lang === 'ar' ? 'EN' : 'AR'}</span>
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
              <button
                onClick={handleLogout}
                className="navbar-dropdown-item"
                style={{ padding: '12px 16px', color: 'var(--danger)' }}
              >
                <LogOut size={18} />
                <span className="flex-1">{t.logout}</span>
                <span style={{ fontSize: 11, opacity: 0.5 }}>{t.logoutEn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

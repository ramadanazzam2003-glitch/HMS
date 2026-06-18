import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, Users, Stethoscope, FileText,
  Receipt, Bot, BarChart3, ScrollText, Settings, ChevronLeft,
  ChevronRight, LogOut, Bell, Search, Moon, Sun, Globe,
  Menu, User, Hospital, CalendarCheck, ClipboardList, FlaskConical, CalendarPlus, Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

const sidebarItems = [
  // Admin / Dashboard items
  { icon: LayoutDashboard, label: 'الرئيسية', labelEn: 'Dashboard', path: '/dashboard', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: CalendarDays, label: 'الحجوزات', labelEn: 'Bookings', path: '/dashboard/bookings', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: Users, label: 'المرضى', labelEn: 'Patients', path: '/dashboard/patients', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: Stethoscope, label: 'الأطباء', labelEn: 'Doctors', path: '/dashboard/doctors', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: FileText, label: 'السجلات الطبية', labelEn: 'Medical Records', path: '/dashboard/medical-records', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin', 'doctor'] },
  { icon: Receipt, label: 'الفواتير', labelEn: 'Billing', path: '/dashboard/billing', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: BarChart3, label: 'التقارير', labelEn: 'Analytics', path: '/dashboard/analytics', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin'] },
  { icon: ScrollText, label: 'سجل النشاط', labelEn: 'Audit Log', path: '/dashboard/audit-log', roles: ['admin', 'director', 'manager', 'super_admin'] },
  { icon: Shield, label: 'لوحة الإدارة', labelEn: 'Admin Panel', path: '/dashboard/admin', roles: ['admin', 'director', 'manager', 'super_admin'] },
  { icon: Settings, label: 'الإعدادات', labelEn: 'Settings', path: '/dashboard/settings', roles: ['admin', 'director', 'manager', 'super_admin'] },

  // Doctor-specific items
  { icon: CalendarCheck, label: 'جدولي', labelEn: 'My Schedule', path: '/doctor', roles: ['doctor'] },
  { icon: Search, label: 'بحث عن مريض', labelEn: 'Search Patient', path: '/doctor/search', roles: ['doctor'] },
  { icon: FlaskConical, label: 'المعمل', labelEn: 'Lab Orders', path: '/doctor/lab-orders', roles: ['doctor'] },
  { icon: CalendarPlus, label: 'متابعة', labelEn: 'Follow-Up', path: '/doctor/follow-up', roles: ['doctor'] },
  { icon: CalendarDays, label: 'جدول المواعيد', labelEn: 'Schedule', path: '/doctor/schedule', roles: ['doctor'] },

  // Shared items
  { icon: Bot, label: 'الفرز الذكي', labelEn: 'AI Triage', path: '/triage', roles: ['admin', 'director', 'dept_manager', 'manager', 'super_admin', 'doctor', 'nurse', 'receptionist'] },

  // Nurse items
  { icon: Stethoscope, label: 'الفرز', labelEn: 'Triage', path: '/nurse/triage', roles: ['nurse'] },
  { icon: Users, label: 'قائمة المرضى', labelEn: 'Patient Queue', path: '/nurse/queue', roles: ['nurse'] },
  { icon: FlaskConical, label: 'الأدوية', labelEn: 'Medications', path: '/nurse/medications', roles: ['nurse'] },

  // Receptionist items
  { icon: LayoutDashboard, label: 'الرئيسية', labelEn: 'Dashboard', path: '/receptionist', roles: ['receptionist'] },
  { icon: ClipboardList, label: 'حجز مباشر', labelEn: 'Walk-In', path: '/receptionist/walk-in', roles: ['receptionist'] },
  { icon: Users, label: 'دليل المرضى', labelEn: 'Patients', path: '/receptionist/patients', roles: ['receptionist'] },
  { icon: CalendarCheck, label: 'تسجيل الوصول', labelEn: 'Check-In/Out', path: '/receptionist/check-in-out', roles: ['receptionist'] },
]

export default function DashboardLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut, role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isRTL = lang === 'ar'

  const filteredItems = useMemo(() => {
    return sidebarItems.filter(item => item.roles.includes(role))
  }, [role])

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 z-50 flex flex-col bg-gradient-to-b from-[#081028] to-[#0B1739] text-white transition-all duration-300',
          collapsed ? (isRTL ? 'w-[72px]' : 'w-[72px]') : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full'),
          'lg:translate-x-0'
        )}
        style={{ [isRTL ? 'right' : 'left']: 0 }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 h-16 px-4 border-b border-white/10 shrink-0',
          collapsed && 'justify-center px-0'
        )}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Hospital size={18} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden"
              >
                MediBook
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
                title={isRTL ? item.label : item.labelEn}
              >
                <Icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {isRTL ? item.label : item.labelEn}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 mx-3 mb-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Profile */}
        <div className={cn(
          'p-3 border-t border-white/10',
          collapsed && 'flex flex-col items-center'
        )}>
          <div className={cn(
            'flex items-center gap-3 p-2.5 rounded-xl bg-white/5',
            collapsed && 'justify-center p-2'
          )}>
            <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
              <User size={16} className="text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <Badge variant="primary" className="mt-0.5 text-[10px] px-1.5 py-0">
                    {profile?.role || 'Staff'}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={signOut}
            className={cn(
              'flex items-center gap-2 w-full mt-2 px-2.5 py-2 rounded-xl text-sm text-white/40 hover:text-danger hover:bg-danger/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={16} />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'lg:mr-[72px]' : 'lg:mr-[260px]'
      )} style={{ [isRTL ? 'marginRight' : 'marginLeft']: collapsed ? '72px' : '260px' }}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors"
            >
              <Menu size={18} />
            </button>
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-hover text-txt-muted text-sm">
              <Search size={15} />
              <span className="text-txt-muted/60">بحث...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white border border-border text-[10px] text-txt-muted font-medium">
                <span>Ctrl</span><span>K</span>
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors">
              <Bell size={18} />
              <span className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center">
                3
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors"
            >
              <Globe size={16} />
              <span className="text-[10px] font-bold ms-1">{lang === 'ar' ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

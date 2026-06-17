import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('medibook-theme')
    if (saved) return saved
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  useEffect(() => {
    localStorage.setItem('medibook-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      const saved = localStorage.getItem('medibook-theme')
      if (!saved || saved === 'auto') {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setThemeMode = (mode) => {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
      localStorage.removeItem('medibook-theme')
    } else {
      setTheme(mode)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

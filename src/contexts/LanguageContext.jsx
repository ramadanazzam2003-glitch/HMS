import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('medibook-lang') || 'ar'
  })

  const t = translations[lang] || translations.ar
  const dir = t.dir
  const isRTL = dir === 'rtl'

  useEffect(() => {
    localStorage.setItem('medibook-lang', lang)
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', dir)
  }, [lang, dir])

  const toggleLang = () => {
    setLang(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const setLanguage = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang)
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, dir, isRTL, t, toggleLang, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

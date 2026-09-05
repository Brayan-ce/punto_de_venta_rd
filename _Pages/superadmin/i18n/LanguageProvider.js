'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, SUPPORTED_LANGUAGES } from './translations'

const LanguageContext = createContext(undefined)

function normalizeLanguage(lang) {
  if (!lang) return 'es'
  const base = lang.split('-')[0].toLowerCase()
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'es'
}

function getByPath(obj, path, defaultValue = null) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj) ?? defaultValue
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('es')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted to avoid hydration mismatch
    setMounted(true)
    
    // Load from localStorage on mount
    const saved = localStorage.getItem('idioma')
    const normalized = normalizeLanguage(saved)
    setLanguageState(normalized)
    document.documentElement.lang = normalized

    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      const updated = localStorage.getItem('idioma')
      const normalized = normalizeLanguage(updated)
      setLanguageState(normalized)
      document.documentElement.lang = normalized
    }

    // Listen for custom language events
    const handleLanguageChange = (event) => {
      const detailLang = event.detail || localStorage.getItem('idioma')
      const normalized = normalizeLanguage(detailLang)
      setLanguageState(normalized)
      document.documentElement.lang = normalized
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('idiomaChange', handleLanguageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('idiomaChange', handleLanguageChange)
    }
  }, [])

  const setLang = useCallback((newLang) => {
    const normalized = normalizeLanguage(newLang)
    setLanguageState(normalized)
    localStorage.setItem('idioma', normalized)
    document.documentElement.lang = normalized
    const event = new CustomEvent('idiomaChange', { detail: normalized })
    window.dispatchEvent(event)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLang(language === 'es' ? 'en' : 'es')
  }, [language, setLang])

  const t = useCallback((key) => {
    const value = getByPath(translations[language], key)
    if (value === null || value === undefined) {
      const fallback = getByPath(translations['es'], key)
      return fallback ?? key
    }
    return value
  }, [language])

  const contextValue = useMemo(
    () => ({
      language,
      setLang,
      toggleLanguage,
      t,
      SUPPORTED_LANGUAGES
    }),
    [language, setLang, toggleLanguage, t]
  )

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

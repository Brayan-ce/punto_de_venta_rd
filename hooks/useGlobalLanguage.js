'use client'

import { useEffect } from 'react'

/**
 * Hook to sync language changes across all tabs and LanguageProviders
 * Call this in your layout ONCE per section to enable cross-provider sync
 */
export function useGlobalLanguageSyncEffect() {
  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'idioma') {
        // Dispatch event to local listeners
        const event = new CustomEvent('idiomaChange', { detail: e.newValue })
        window.dispatchEvent(event)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Also listen for idiomaChange events to persist to localStorage
  // This ensures all tabs stay in sync
  useEffect(() => {
    const handleLanguageChange = (e) => {
      const newLang = e.detail
      if (newLang && newLang !== localStorage.getItem('idioma')) {
        localStorage.setItem('idioma', newLang)
      }
    }

    window.addEventListener('idiomaChange', handleLanguageChange)
    return () => window.removeEventListener('idiomaChange', handleLanguageChange)
  }, [])
}

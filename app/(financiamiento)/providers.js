'use client'
import { useGlobalLanguageSyncEffect } from '@/hooks/useGlobalLanguage'
import { LanguageProvider } from '@/_Pages/vendedor/i18n'
import { LanguageProvider as AdminLanguageProvider } from '@/_Pages/admin/i18n'

function FinanciamientoProvidersContent({ children }) {
  useGlobalLanguageSyncEffect()
  return children
}

export default function FinanciamientoProviders({ children }) {
  return (
    <LanguageProvider>
      <AdminLanguageProvider>
        <FinanciamientoProvidersContent>{children}</FinanciamientoProvidersContent>
      </AdminLanguageProvider>
    </LanguageProvider>
  )
}

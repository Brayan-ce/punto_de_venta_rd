'use client'

import { useGlobalLanguageSyncEffect } from '@/hooks/useGlobalLanguage'
import { LanguageProvider } from '@/_Pages/admin/i18n'

function AdminProvidersContent({ children }) {
  useGlobalLanguageSyncEffect()
  return children
}

export default function AdminProviders({ children }) {
  return (
    <LanguageProvider>
      <AdminProvidersContent>{children}</AdminProvidersContent>
    </LanguageProvider>
  )
}

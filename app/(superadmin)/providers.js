'use client'

import { useGlobalLanguageSyncEffect } from '@/hooks/useGlobalLanguage'
import { LanguageProvider } from '@/_Pages/superadmin/i18n'

function SuperAdminProvidersContent({ children }) {
  useGlobalLanguageSyncEffect()
  return children
}

export default function SuperAdminProviders({ children }) {
  return (
    <LanguageProvider>
      <SuperAdminProvidersContent>{children}</SuperAdminProvidersContent>
    </LanguageProvider>
  )
}

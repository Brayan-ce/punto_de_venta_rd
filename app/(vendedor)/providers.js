'use client'

import { useGlobalLanguageSyncEffect } from '@/hooks/useGlobalLanguage'
import { LanguageProvider } from '@/_Pages/vendedor/i18n'
import { LanguageProvider as AdminLanguageProvider } from '@/_Pages/admin/i18n'

function VendedorProvidersContent({ children }) {
  useGlobalLanguageSyncEffect()
  return children
}

export default function VendedorProviders({ children }) {
  return (
    <LanguageProvider>
      <AdminLanguageProvider>
        <VendedorProvidersContent>{children}</VendedorProvidersContent>
      </AdminLanguageProvider>
    </LanguageProvider>
  )
}

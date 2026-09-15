'use client'

import { useLanguage } from '@/_Pages/admin/i18n'

/**
 * Hook to get translated button/label text
 * Usage: const text = useTranslationKey('buttons.guardar')
 * Also works with shortcuts: useTranslationKey('pages.productosTitle')
 */
export function useTranslationKey(key, fallback = null) {
  const { t } = useLanguage()
  const result = t(key)
  return result || fallback || key
}

/**
 * Hook to translate status text directly
 */
export function useStatusTranslation(estadoValue) {
  const { t } = useLanguage()

  const translations = {
    // Spanish to key map
    'Pendiente': t('status.pendiente'),
    'Confirmado': t('status.confirmado'),
    'En Proceso': t('status.enProceso'),
    'Entregado': t('status.entregado'),
    'Cancelado': t('status.cancelado'),
    'Completado': t('status.completado'),
    'Activo': t('status.activo'),
    'Inactivo': t('status.inactivo'),
    'Devuelto': t('status.devuelto'),

    // Direct status keys
    'pendiente': t('status.pendiente'),
    'confirmado': t('status.confirmado'),
    'en_proceso': t('status.enProceso'),
    'entregado': t('status.entregado'),
    'cancelado': t('status.cancelado'),
    'completado': t('status.completado'),
    'activo': t('status.activo'),
    'inactivo': t('status.inactivo'),
    'devuelto': t('status.devuelto'),
    'recibida': t('status.completado'), // Mapping compras recibida to delivered
    'anulada': t('status.cancelado') // Mapping compras anulada to canceled
  }

  return translations[estadoValue] || estadoValue
}

/**
 * Hook to translate common page strings
 */
export function usePageTranslations() {
  const { t } = useLanguage()

  return {
    cargando: t('common.loading'),
    guardar: t('buttons.guardar'),
    cancelar: t('buttons.cancelar'),
    editar: t('buttons.editar'),
    eliminar: t('buttons.eliminar'),
    volver: t('buttons.volver'),
    ver: t('buttons.ver'),
    nuevo: t('buttons.nuevo'),
    confirmar: t('buttons.confirmar'),
    imprimir: t('buttons.imprimir'),
    despachar: t('buttons.despachar'),
    buscar: t('buttons.buscar'),
    filtrar: t('buttons.filtrar')
  }
}

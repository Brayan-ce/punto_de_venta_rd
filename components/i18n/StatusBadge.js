'use client'

import { useLanguage } from '@/_Pages/admin/i18n'

const statusColors = {
  activo: '#10b981',
  inactivo: '#ef4444',
  completado: '#10b981',
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  en_proceso: '#8b5cf6',
  entregado: '#059669',
  cancelado: '#ef4444',
  en_proceso_lowercase: '#8b5cf6',
  atrasado: '#ef4444'
}

/**
 * Component to display translatable status badges
 * Usage: <StatusBadge estado="pendiente" />
 */
export function StatusBadge({ estado, className = '', style = {} }) {
  const { t } = useLanguage()

  // Map status to translation keys
  const statusKeyMap = {
    activo: 'status.activo',
    inactivo: 'status.inactivo',
    completado: 'status.completado',
    pendiente: 'status.pendiente',
    confirmado: 'status.confirmado',
    en_proceso: 'status.enProceso',
    en_proceso_lowercase: 'status.enProceso',
    entregado: 'status.entregado',
    cancelado: 'status.cancelado',
    devuelto: 'status.devuelto'
  }

  const key = statusKeyMap[estado?.toLowerCase()] || estado
  const texto = t(key)
  const color = statusColors[estado?.toLowerCase()] || '#6b7280'

  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}`,
        ...style
      }}
    >
      {texto}
    </span>
  )
}

/**
 * Hook to get translated status text
 * Usage: const statusText = useTranslatedStatus('pendiente')
 */
export function useTranslatedStatus(estado) {
  const { t } = useLanguage()

  const statusKeyMap = {
    activo: 'status.activo',
    inactivo: 'status.inactivo',
    completado: 'status.completado',
    pendiente: 'status.pendiente',
    confirmado: 'status.confirmado',
    en_proceso: 'status.enProceso',
    entregado: 'status.entregado',
    cancelado: 'status.cancelado',
    devuelto: 'status.devuelto'
  }

  const key = statusKeyMap[estado?.toLowerCase()] || estado
  return t(key)
}

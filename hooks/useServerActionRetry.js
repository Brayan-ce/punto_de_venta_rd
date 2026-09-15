"use client"
import { useCallback } from 'react'

export function useServerActionRetry() {
  const executeWithRetry = useCallback(async (action, maxRetries = 1) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await action()
      } catch (error) {
        const isServerActionError = 
          error?.message?.includes('Server Action') ||
          error?.message?.includes('UnrecognizedActionError') ||
          error?.name === 'UnrecognizedActionError'
        
        if (isServerActionError && attempt < maxRetries) {
          console.warn('Server Action no encontrado, recargando página...', error)
          window.location.reload()
          return // No retornar nada, la página se recargará
        }
        
        throw error // Re-lanzar si no es Server Action error o se agotaron los intentos
      }
    }
  }, [])
  
  return { executeWithRetry }
}


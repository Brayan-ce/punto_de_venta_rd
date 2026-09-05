'use client'

import { useEffect } from 'react'

const SW_VERSION = 9

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const swUrl = '/sw.js?v=' + SW_VERSION

    let reg = null

    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/')
        if (existing) {
          const activeUrl = existing.active?.scriptURL || ''
          if (activeUrl.includes('v=' + SW_VERSION)) {
            reg = existing
            return
          }
          await existing.unregister()
        }
        reg = await navigator.serviceWorker.register(swUrl)
      } catch (_) {}
    }

    register()

    const interval = setInterval(async () => {
      if (reg) {
        try { await reg.update() } catch (_) {}
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}

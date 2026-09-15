'use client';

import { useEffect } from 'react';

export function useServiceWorkerDev() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isDevelopment = 
            process.env.NODE_ENV === 'development' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isDevelopment) return;

        if (!('serviceWorker' in navigator)) return;

        if (sessionStorage.getItem('sw_cleaned') === 'true') return;

        const cleanup = async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                }
            } catch (_) {}

            try {
                const cacheNames = await caches.keys();
                for (const name of cacheNames) {
                    await caches.delete(name);
                }
            } catch (_) {}
        };

        cleanup().then(() => {
            sessionStorage.setItem('sw_cleaned', 'true');
            console.log('🔧 Caches y SWs antiguos limpiados en desarrollo');
        });
    }, []);
}

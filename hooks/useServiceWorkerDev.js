'use client';

import { useEffect } from 'react';

/**
 * Hook para deshabilitar Service Worker en desarrollo
 * 
 * Este hook:
 * - Desregistra cualquier Service Worker activo en desarrollo
 * - Limpia todos los caches en desarrollo
 * - Previene que se registren nuevos Service Workers en desarrollo
 * 
 * Esto es necesario porque el Service Worker intercepta requests
 * y puede cachear CSS/JS, impidiendo que los cambios se reflejen
 * durante el desarrollo (hot reload).
 */
export function useServiceWorkerDev() {
    useEffect(() => {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') return;

        // Verificar si estamos en desarrollo
        const isDevelopment = 
            process.env.NODE_ENV === 'development' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (!isDevelopment) {
            // En producción, permitir Service Worker normalmente
            return;
        }

        // Verificar si el navegador soporta Service Workers
        if (!('serviceWorker' in navigator)) {
            return;
        }

        console.log('🔧 Modo desarrollo detectado - Deshabilitando Service Worker');

        // Función para desregistrar todos los Service Workers
        const unregisterAllServiceWorkers = async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                
                if (registrations.length === 0) {
                    console.log('✅ No hay Service Workers registrados');
                    return;
                }

                console.log(`🧹 Desregistrando ${registrations.length} Service Worker(s)...`);

                for (const registration of registrations) {
                    const success = await registration.unregister();
                    if (success) {
                        console.log('✅ Service Worker desregistrado:', registration.scope);
                    } else {
                        console.warn('⚠️ No se pudo desregistrar Service Worker:', registration.scope);
                    }
                }
            } catch (error) {
                console.error('❌ Error al desregistrar Service Workers:', error);
            }
        };

        // Función para limpiar todos los caches
        const clearAllCaches = async () => {
            if (!('caches' in window)) {
                return;
            }

            try {
                const cacheNames = await caches.keys();
                
                if (cacheNames.length === 0) {
                    console.log('✅ No hay caches para limpiar');
                    return;
                }

                console.log(`🧹 Limpiando ${cacheNames.length} cache(s)...`);

                for (const cacheName of cacheNames) {
                    const deleted = await caches.delete(cacheName);
                    if (deleted) {
                        console.log('✅ Cache eliminado:', cacheName);
                    }
                }
            } catch (error) {
                console.error('❌ Error al limpiar caches:', error);
            }
        };

        // Ejecutar limpieza inmediatamente
        const cleanup = async () => {
            await unregisterAllServiceWorkers();
            await clearAllCaches();
        };

        cleanup();

        // Prevenir que se registren nuevos Service Workers en desarrollo
        const originalRegister = navigator.serviceWorker.register;
        navigator.serviceWorker.register = function(...args) {
            console.warn('⚠️ Intento de registrar Service Worker bloqueado en desarrollo');
            return Promise.reject(new Error('Service Worker deshabilitado en desarrollo'));
        };

        // Limpiar periódicamente (por si acaso se registra uno nuevo)
        const intervalId = setInterval(() => {
            cleanup();
        }, 5000); // Cada 5 segundos

        // Cleanup al desmontar
        return () => {
            clearInterval(intervalId);
            // Restaurar el método original
            navigator.serviceWorker.register = originalRegister;
        };
    }, []);
}


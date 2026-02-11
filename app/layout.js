'use client';

import "./globals.css";
import Script from "next/script";
import { metadata } from "./metadata"; // si quieres separarlo
import { useServiceWorkerDev } from "../hooks/useServiceWorkerDev";

export default function RootLayout({ children }) {
    useServiceWorkerDev();
    return (
        <html lang="es">
            <head>
                {/* Icono de la app */}
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/logo.svg" />

                {/* Manifest y PWA */}
                <link rel="manifest" href={metadata.manifest} />
                <meta name="theme-color" content={metadata.themeColor} />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                {/* Meta tags para PWA - Actualizados según estándares actuales */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content={metadata.appleWebApp.statusBarStyle} />
                <meta name="apple-mobile-web-app-title" content={metadata.appleWebApp.title} />

                {/* Scripts globales - Con crossorigin para evitar warnings de Tracking Prevention */}
                <Script
                    src="https://cdnjs.cloudflare.com/ajax/libs/rsvp/4.8.5/rsvp.min.js"
                    strategy="beforeInteractive"
                    crossOrigin="anonymous"
                />
                <Script
                    src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"
                    strategy="beforeInteractive"
                    crossOrigin="anonymous"
                />
            </head>
            <body suppressHydrationWarning>
                {children}

                {/* Ionicons - CDN - Optimizado para evitar preload warnings */}
                <Script
                    type="module"
                    src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"
                    strategy="lazyOnload"
                    crossOrigin="anonymous"
                />
                <Script
                    noModule
                    src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"
                    strategy="lazyOnload"
                    crossOrigin="anonymous"
                />
            </body>
        </html>
    );
}

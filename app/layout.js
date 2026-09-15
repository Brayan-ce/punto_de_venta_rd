'use client';

import "./globals.css";
import Script from "next/script";
import { metadata } from "./metadata"; // si quieres separarlo
import { useServiceWorkerDev } from "../hooks/useServiceWorkerDev";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

export default function RootLayout({ children }) {
    useServiceWorkerDev();
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/logo-pwa.png" />
                <link rel="apple-touch-icon" href="/logo-pwa.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/logo-pwa.png" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content={metadata.themeColor} />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content={metadata.appleWebApp.statusBarStyle} />
                <meta name="apple-mobile-web-app-title" content={metadata.appleWebApp.title} />

                {/* Tema: aplica data-theme antes de que React hidrate para evitar flash */}
                <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('tema')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()` }} />

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
                <ServiceWorkerRegister />
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

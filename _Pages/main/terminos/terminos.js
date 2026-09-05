"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import estilos from './terminos.module.css'
import { obtenerTerminosActivos } from "@/_Pages/main/registro/servidor"
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useLanguage } from '../i18n'

export default function TerminosCondiciones() {
    const { t, language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [terminos, setTerminos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        cargarTerminos()
    }, [])

    const cargarTerminos = async () => {
        try {
            setCargando(true)
            const resultado = await obtenerTerminosActivos()

            if (resultado.success) {
                setTerminos(resultado.datos)
            } else {
                setError(resultado.mensaje)
            }
        } catch (err) {
            setError(t('terminos.loadError'))
            console.error('Error:', err)
        } finally {
            setCargando(false)
        }
    }

    // ✅ FUNCIÓN CORREGIDA - Convierte Markdown a HTML correctamente
    const formatearContenido = (contenido = '') => {
        if (!contenido) return ''

        // Configurar marked para mejor renderizado
        marked.setOptions({
            breaks: true,        // Convierte saltos de línea en <br>
            gfm: true,          // GitHub Flavored Markdown
            headerIds: false,   // No genera IDs automáticos
            mangle: false       // No modifica emails
        })

        // Convertir Markdown a HTML
        const html = marked.parse(contenido)

        // Sanitizar HTML para seguridad
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'hr',
                'ul', 'ol', 'li',
                'strong', 'em', 'u', 's',
                'a', 'code', 'pre',
                'blockquote',
                'table', 'thead', 'tbody', 'tr', 'th', 'td'
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel']
        })
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={`${estilos.caja} ${estilos[tema]}`}>
                    <div className={estilos.cargando}>
                        <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                        <p>{t('terminos.loading')}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={`${estilos.caja} ${estilos[tema]}`}>
                    <div className={estilos.error}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <p>{error}</p>
                    </div>
                    <Link href="/registro" className={estilos.botonVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        {t('terminos.backToRegister')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.caja} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div className={estilos.iconoHeader}>
                        <ion-icon name="document-text"></ion-icon>
                    </div>
                    <h1 className={estilos.titulo}>{terminos?.titulo || t('terminos.fallbackTitle')}</h1>
                    <div className={estilos.metaInfo}>
                        <span className={estilos.version}>
                            <ion-icon name="code-working-outline"></ion-icon>
                            {t('terminos.version')} {terminos?.version}
                        </span>
                        <span className={estilos.fecha}>
                            <ion-icon name="calendar-outline"></ion-icon>
                            {terminos?.creado_en && new Date(terminos.creado_en).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* ✅ AQUÍ SE RENDERIZA EL MARKDOWN CORRECTAMENTE */}
                <div
                    className={estilos.contenido}
                    dangerouslySetInnerHTML={{
                        __html: formatearContenido(terminos?.contenido)
                    }}
                />

                <div className={estilos.footer}>
                    <div className={estilos.avisoImportante}>
                        <ion-icon name="information-circle"></ion-icon>
                        <p>
                            {t('terminos.importantNotice')}
                        </p>
                    </div>

                    <div className={estilos.acciones}>
                        <Link href="/registro" className={estilos.botonPrincipal}>
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            {t('terminos.backToRegister')}
                        </Link>

                        <button
                            onClick={() => window.print()}
                            className={estilos.botonSecundario}
                        >
                            <ion-icon name="print-outline"></ion-icon>
                            {t('terminos.print')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
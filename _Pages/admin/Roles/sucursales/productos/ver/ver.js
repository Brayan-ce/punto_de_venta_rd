"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { obtenerProducto } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './ver.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerProductoSucursal() {
    const { id } = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [producto, setProducto] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')

        const handleTemaChange = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        const cargar = async () => {
            const res = await obtenerProducto(id)
            if (!res.success) {
                setError(res.mensaje || tr('No se pudo cargar', 'Could not load'))
                setCargando(false)
                return
            }

            setProducto(res.producto)
            setCargando(false)
        }

        window.addEventListener('temaChange', handleTemaChange)
        if (id) cargar()
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [id])

    if (!mounted) return null

    if (cargando) {
        return <LoadingScreen />
    }

    if (!producto) {
        return <div className={`${estilos.contenedor} ${estilos[tema]}`}><div className={estilos.estado}>{error}</div></div>
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.topbar}>
                <h1>{producto.nombre}</h1>
                <div className={estilos.accionesTop}>
                    <Link href="/sucursales/productos" className={estilos.btnSecundario}>{tr('Volver', 'Back')}</Link>
                    <Link href={`/sucursales/productos/editar/${id}`} className={estilos.btnPrimario}>{tr('Editar', 'Edit')}</Link>
                </div>
            </div>

            <div className={estilos.card}>
                <div className={estilos.fila}><span>ID</span><strong>{producto.id}</strong></div>
                <div className={estilos.fila}><span>{tr('Codigo de barras', 'Barcode')}</span><strong>{producto.codigo_barras || '-'}</strong></div>
                <div className={estilos.fila}><span>SKU</span><strong>{producto.sku || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Descripcion', 'Description')}</span><strong>{producto.descripcion || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Precio compra', 'Cost price')}</span><strong>{Number(producto.precio_compra || 0).toFixed(2)}</strong></div>
                <div className={estilos.fila}><span>{tr('Precio venta', 'Sale price')}</span><strong>{Number(producto.precio_venta || 0).toFixed(2)}</strong></div>
                <div className={estilos.fila}><span>{tr('Stock', 'Stock')}</span><strong>{producto.stock ?? 0}</strong></div>
                <div className={estilos.fila}><span>{tr('Stock minimo', 'Minimum stock')}</span><strong>{producto.stock_minimo ?? 0}</strong></div>
                <div className={estilos.fila}><span>{tr('Stock maximo', 'Maximum stock')}</span><strong>{producto.stock_maximo ?? '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Sucursal', 'Branch')}</span><strong>{producto.sucursal_nombre || '-'}</strong></div>
                <div className={estilos.fila}><span>{tr('Estado', 'State')}</span><strong>{producto.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}</strong></div>
            </div>
        </div>
    )
}

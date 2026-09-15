"use client"
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { obtenerInventarioSucursales } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './inventario.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Stock() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [stock, setStock] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [codigoFiltro, setCodigoFiltro] = useState('')
    const [sucursalFiltro, setSucursalFiltro] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState('')
    const [relacionFiltro, setRelacionFiltro] = useState('')
    const [fuenteDatos, setFuenteDatos] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargar()

        const handleTemaChange = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }
        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await obtenerInventarioSucursales({ buscar: busqueda, sucursalId: sucursalFiltro, estado: estadoFiltro })
            if (res.success) {
                setStock(res.stock || [])
                setSucursales(res.sucursales || [])
                setFuenteDatos(res.fuenteDatos)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setCargando(false)
        }
    }

    const estadoBadge = (item) => {
        const stock_actual = item.stock || 0
        const stock_minimo = item.stock_minimo || 0
        
        if (stock_actual === 0) return { clase: 'sin_stock', texto: tr('Sin Stock', 'Out of Stock') }
        if (stock_actual <= stock_minimo) return { clase: 'bajo', texto: tr('Stock Bajo', 'Low Stock') }
        return { clase: 'ok', texto: tr('OK', 'OK') }
    }

    const resumen = useMemo(() => {
        return {
            total: stock.length,
            bajo: stock.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.stock_minimo || 0)).length,
            sin_stock: stock.filter(i => (i.stock || 0) === 0).length
        }
    }, [stock])

    const stockFiltrado = useMemo(() => {
        return stock.filter((item) => {
            const textoBusqueda = busqueda.trim().toLowerCase()
            const textoCodigo = codigoFiltro.trim().toLowerCase()
            const nombre = String(item.nombre || '').toLowerCase()
            const codigo = String(item.codigo || '').toLowerCase()
            const sucursal = String(item.sucursal_nombre || '').toLowerCase()

            const coincideBusqueda = !textoBusqueda || nombre.includes(textoBusqueda) || sucursal.includes(textoBusqueda)
            const coincideCodigo = !textoCodigo || codigo.includes(textoCodigo)
            const coincideRelacion = !relacionFiltro || sucursal.includes(relacionFiltro.toLowerCase())

            return coincideBusqueda && coincideCodigo && coincideRelacion
        })
    }, [stock, busqueda, codigoFiltro, relacionFiltro])

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [busqueda, sucursalFiltro, estadoFiltro])

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerTexto}>
                    <h1 className={estilos.titulo}>{tr('Inventario de Sucursales', 'Branch Inventory')}</h1>
                    <p className={estilos.subtitulo}>{tr('Vista detallada de productos, estado y relacion por sucursal', 'Detailed view of products, status and branch relation')}</p>
                </div>
            </div>

            {/* Stats */}
            <div className={estilos.stats}>
                <div className={estilos.stat}>
                    <p>{tr('Total Productos', 'Total Products')}</p>
                    <h3>{resumen.total}</h3>
                </div>
                <div className={estilos.stat}>
                    <p>{tr('Stock Bajo', 'Low Stock')}</p>
                    <h3 className={estilos.warning}>{resumen.bajo}</h3>
                </div>
                <div className={estilos.stat}>
                    <p>{tr('Sin Stock', 'Out of Stock')}</p>
                    <h3 className={estilos.danger}>{resumen.sin_stock}</h3>
                </div>
            </div>

            {/* Aviso fallback */}
            {fuenteDatos === 'productos' && (
                <div className={estilos.avisoFallback}>
                    <ion-icon name="information-circle-outline"></ion-icon>
                    <span>{tr('Mostrando inventario desde productos mientras se carga el stock detallado por sucursal', 'Showing inventory from products while detailed stock by branch loads')}</span>
                </div>
            )}

            {/* Filtros */}
            <div className={estilos.filtros}>
                <div className={estilos.filtro}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por producto o sucursal...', 'Search by product or branch...')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <div className={estilos.filtro}>
                    <ion-icon name="pricetag-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Filtrar por codigo...', 'Filter by code...')}
                        value={codigoFiltro}
                        onChange={(e) => setCodigoFiltro(e.target.value)}
                    />
                </div>

                {sucursales.length > 0 && (
                    <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)}>
                        <option value="">{tr('Todas las sucursales', 'All branches')}</option>
                        {sucursales.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                )}

                <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="ok">{tr('OK', 'OK')}</option>
                    <option value="bajo">{tr('Stock Bajo', 'Low Stock')}</option>
                    <option value="sin_stock">{tr('Sin Stock', 'Out of Stock')}</option>
                </select>

                <select value={relacionFiltro} onChange={(e) => setRelacionFiltro(e.target.value)}>
                    <option value="">{tr('Relacion: todas', 'Relation: all')}</option>
                    {sucursales.map((s) => (
                        <option key={`rel-${s.id}`} value={s.nombre}>{tr('Relacionado con', 'Related to')} {s.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Tabla */}
            {cargando ? <LoadingScreen /> : stockFiltrado.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="cube-outline"></ion-icon>
                    <p>{tr('No hay productos vinculados a tus sucursales', 'No products linked to your branches')}</p>
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <table>
                        <thead>
                            <tr>
                                <th>{tr('Producto', 'Product')}</th>
                                <th>{tr('Código', 'Code')}</th>
                                <th>{tr('Stock', 'Stock')}</th>
                                <th>{tr('Mínimo', 'Minimum')}</th>
                                <th>{tr('Relacionado con', 'Related to')}</th>
                                <th>{tr('Estado', 'Status')}</th>
                                <th>{tr('Editar', 'Edit')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockFiltrado.map(item => {
                                const estado = estadoBadge(item)
                                return (
                                    <tr key={item.id}>
                                        <td data-label={tr('Producto', 'Product')}><strong>{item.nombre}</strong></td>
                                        <td data-label={tr('Código', 'Code')}>{item.codigo}</td>
                                        <td data-label={tr('Stock', 'Stock')} className={estilos.valorStock}>{item.stock || 0} {item.unidad_medida}</td>
                                        <td data-label={tr('Mínimo', 'Minimum')}>{item.stock_minimo || 0}</td>
                                        <td data-label={tr('Relacionado con', 'Related to')}>{item.sucursal_nombre || '-'}</td>
                                        <td data-label={tr('Estado', 'Status')}>
                                            <span className={`${estilos.badge} ${estilos[estado.clase]}`}>
                                                {estado.texto}
                                            </span>
                                        </td>
                                        <td data-label={tr('Editar', 'Edit')}>
                                            <div className={estilos.acciones}>
                                                <Link href={`/sucursales/productos/editar/${item.producto_id}`} className={estilos.btnAccion}>{tr('Editar Producto', 'Edit Product')}</Link>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    )
}

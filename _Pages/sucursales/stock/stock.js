"use client"

import { useEffect, useMemo, useState } from 'react'
import { obtenerInventarioSucursales } from './servidor'
import estilos from './stock.module.css'

export default function StockSucursalesPage() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [stock, setStock] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [resumen, setResumen] = useState({
        totalRegistros: 0,
        productosStockBajo: 0,
        productosSinStock: 0,
        sucursalesConStock: 0
    })
    const [fuenteDatos, setFuenteDatos] = useState('stock_sucursal')

    const [busqueda, setBusqueda] = useState('')
    const [filtroSucursal, setFiltroSucursal] = useState('todas')
    const [filtroEstado, setFiltroEstado] = useState('todos')

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            const r = await obtenerInventarioSucursales()
            if (r.success) {
                setStock(r.stock || [])
                setSucursales(r.sucursales || [])
                setResumen(r.resumen || {})
                setFuenteDatos(r.fuenteDatos || 'stock_sucursal')
            }
            setCargando(false)
        }
        cargar()
    }, [])

    const stockFiltrado = useMemo(() => {
        return stock.filter(item => {
            const texto = busqueda.trim().toLowerCase()
            const coincideBusqueda = !texto ||
                String(item.producto_nombre || '').toLowerCase().includes(texto) ||
                String(item.sucursal_nombre || '').toLowerCase().includes(texto) ||
                String(item.codigo_barras || '').toLowerCase().includes(texto) ||
                String(item.sku || '').toLowerCase().includes(texto)

            const coincideSucursal = filtroSucursal === 'todas' || String(item.sucursal_id) === filtroSucursal

            const sinStock = Number(item.stock_actual || 0) <= 0
            const stockBajo = Number(item.stock_actual || 0) <= Number(item.stock_minimo || 0)

            const coincideEstado =
                filtroEstado === 'todos' ||
                (filtroEstado === 'sin_stock' && sinStock) ||
                (filtroEstado === 'stock_bajo' && stockBajo && !sinStock) ||
                (filtroEstado === 'ok' && !stockBajo)

            return coincideBusqueda && coincideSucursal && coincideEstado
        })
    }, [stock, busqueda, filtroSucursal, filtroEstado])

    const estadoBadge = (item) => {
        const actual = Number(item.stock_actual || 0)
        const minimo = Number(item.stock_minimo || 0)

        if (actual <= 0) return { texto: 'Sin stock', clase: estilos.danger }
        if (actual <= minimo) return { texto: 'Stock bajo', clase: estilos.warning }
        return { texto: 'OK', clase: estilos.success }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <h1 className={estilos.titulo}>Inventario por Sucursal</h1>
                <p className={estilos.subtitulo}>Control de existencias por sucursal y estado de inventario.</p>
                {fuenteDatos === 'productos' ? (
                    <p className={estilos.subtitulo}>
                        Mostrando inventario desde productos mientras se carga el stock detallado por sucursal.
                    </p>
                ) : null}
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}><ion-icon name="file-tray-stacked-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Registros de inventario</span>
                        <span className={estilos.estadValor}>{resumen.totalRegistros || 0}</span>
                    </div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warningBg}`}><ion-icon name="alert-circle-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Productos con stock bajo</span>
                        <span className={estilos.estadValor}>{resumen.productosStockBajo || 0}</span>
                    </div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.dangerBg}`}><ion-icon name="close-circle-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Productos sin stock</span>
                        <span className={estilos.estadValor}>{resumen.productosSinStock || 0}</span>
                    </div>
                </div>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.successBg}`}><ion-icon name="business-outline"></ion-icon></div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Sucursales con inventario</span>
                        <span className={estilos.estadValor}>{resumen.sucursalesConStock || 0}</span>
                    </div>
                </div>
            </div>

            <div className={`${estilos.panel} ${estilos[tema]}`}>
                <div className={estilos.panelHeader}>
                    <h2 className={estilos.panelTitulo}>Listado de inventario</h2>
                    <div className={estilos.controles}>
                        <div className={estilos.busqueda}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar por producto, sucursal, codigo o SKU..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)}>
                            <option value="todas">Todas las sucursales</option>
                            {sucursales.map(s => (
                                <option key={s.id} value={String(s.id)}>{s.nombre}</option>
                            ))}
                        </select>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                            <option value="todos">Todos los estados</option>
                            <option value="ok">OK</option>
                            <option value="stock_bajo">Stock bajo</option>
                            <option value="sin_stock">Sin stock</option>
                        </select>
                    </div>
                </div>

                <div className={estilos.tablaWrap}>
                    {cargando ? (
                        <div className={estilos.vacio}>Cargando inventario...</div>
                    ) : stockFiltrado.length === 0 ? (
                        <div className={estilos.vacio}>No hay datos de inventario con los filtros seleccionados.</div>
                    ) : (
                        <table className={estilos.tabla}>
                            <thead>
                                <tr>
                                    <th>Sucursal</th>
                                    <th>Producto</th>
                                    <th>Codigo / SKU</th>
                                    <th>Categoria</th>
                                    <th>Stock actual</th>
                                    <th>Stock minimo</th>
                                    <th>Estado</th>
                                    <th>Ubicacion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockFiltrado.map(item => {
                                    const estado = estadoBadge(item)
                                    return (
                                        <tr key={item.id}>
                                            <td>{item.sucursal_nombre}</td>
                                            <td>
                                                <strong>{item.producto_nombre}</strong>
                                                {item.unidad_medida_abreviatura ? <small>{item.unidad_medida_abreviatura}</small> : null}
                                            </td>
                                            <td>
                                                <div>{item.codigo_barras || '-'}</div>
                                                <small>{item.sku || '-'}</small>
                                            </td>
                                            <td>{item.categoria_nombre || '-'}</td>
                                            <td>{Number(item.stock_actual || 0).toLocaleString('es-DO')}</td>
                                            <td>{Number(item.stock_minimo || 0).toLocaleString('es-DO')}</td>
                                            <td><span className={`${estilos.badge} ${estado.clase}`}>{estado.texto}</span></td>
                                            <td>{item.ubicacion || '-'}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

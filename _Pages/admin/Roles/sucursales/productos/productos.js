"use client"
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { eliminarProductoSucursal, obtenerProductosSucursal } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './productos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function ProductosSucursal() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [productos, setProductos] = useState([])
    const [buscar, setBuscar] = useState('')
    const [estadoFiltro, setEstadoFiltro] = useState('')
    const [estadoOperacion, setEstadoOperacion] = useState({ tipo: '', texto: '' })

    useEffect(() => {
        setMounted(true)
        setTema(localStorage.getItem('tema') || 'light')
        cargar()

        const handleTemaChange = () => {
            setTema(localStorage.getItem('tema') || 'light')
        }

        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await obtenerProductosSucursal({ buscar, estado: estadoFiltro })
            if (res.success) {
                setProductos(res.productos || [])
            }
        } catch (error) {
            console.error('Error cargando productos:', error)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargar, 350)
        return () => clearTimeout(timer)
    }, [buscar, estadoFiltro])

    const resumen = useMemo(() => {
        const total = productos.length
        const activos = productos.filter((p) => Boolean(p.activo)).length
        const inactivos = total - activos
        const itbis = productos.filter((p) => Boolean(p.aplica_itbis)).length

        return { total, activos, inactivos, itbis }
    }, [productos])

    const manejarEliminar = async (id) => {
        const confirmar = window.confirm(tr('Esta seguro de eliminar este producto?', 'Are you sure you want to delete this product?'))
        if (!confirmar) return

        const res = await eliminarProductoSucursal(id)
        if (!res.success) {
            setEstadoOperacion({ tipo: 'error', texto: res.mensaje || tr('No se pudo eliminar', 'Could not delete') })
            return
        }

        setEstadoOperacion({ tipo: 'ok', texto: res.mensaje })
        await cargar()
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerTexto}>
                    <h1 className={estilos.titulo}>{tr('Productos', 'Products')}</h1>
                    <p className={estilos.subtitulo}>{tr('Gestion de productos para sucursales', 'Product management for branches')}</p>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/sucursales/productos/crear" className={estilos.btnNuevo}>
                        <ion-icon name="add-outline"></ion-icon>
                        <span>{tr('Crear Producto', 'Create Product')}</span>
                    </Link>
                </div>
            </div>

            {estadoOperacion.texto && (
                <div className={`${estilos.estadoOperacion} ${estilos[estadoOperacion.tipo]}`}>
                    {estadoOperacion.texto}
                </div>
            )}

            <div className={estilos.stats}>
                <div className={estilos.statCard}>
                    <h4>{tr('Total', 'Total')}</h4>
                    <p>{resumen.total}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Activos', 'Active')}</h4>
                    <p>{resumen.activos}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Inactivos', 'Inactive')}</h4>
                    <p>{resumen.inactivos}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Con ITBIS', 'With ITBIS')}</h4>
                    <p>{resumen.itbis}</p>
                </div>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.filtro}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        className={estilos.input}
                        type="text"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        placeholder={tr('Buscar por nombre, codigo o SKU...', 'Search by name, code or SKU...')}
                    />
                </div>
                <select className={estilos.select} value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                    <option value="">{tr('Todos', 'All')}</option>
                    <option value="activos">{tr('Activos', 'Active')}</option>
                    <option value="inactivos">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : productos.length === 0 ? (
                <div className={estilos.vacio}>{tr('No hay productos registrados', 'No products found')}</div>
            ) : (
                <div className={estilos.tabla}>
                    <table>
                        <thead>
                            <tr>
                                <th>{tr('Producto', 'Product')}</th>
                                <th>{tr('Codigo', 'Code')}</th>
                                <th>{tr('Precio', 'Price')}</th>
                                <th>{tr('Stock', 'Stock')}</th>
                                <th>{tr('Estado', 'State')}</th>
                                <th>{tr('Acciones', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((p) => (
                                <tr key={p.id}>
                                    <td data-label={tr('Producto', 'Product')}>
                                        <strong>{p.nombre}</strong>
                                        <br />
                                        <span className={estilos.descripcionProducto}>{p.descripcion || '-'}</span>
                                    </td>
                                    <td data-label={tr('Codigo', 'Code')}>{p.codigo_barras || p.sku || '-'}</td>
                                    <td data-label={tr('Precio', 'Price')} className={estilos.valorPrecio}>{Number(p.precio_venta || 0).toFixed(2)}</td>
                                    <td data-label={tr('Stock', 'Stock')} className={estilos.valorStock}>{p.stock ?? 0}</td>
                                    <td data-label={tr('Estado', 'State')}>
                                        <span className={`${estilos.badge} ${p.activo ? estilos.activo : estilos.inactivo}`}>
                                            {p.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                        </span>
                                    </td>
                                    <td data-label={tr('Acciones', 'Actions')}>
                                        <div className={`${estilos.acciones} ${estilos.accionesCelda}`}>
                                            <Link href={`/sucursales/productos/ver/${p.id}`} className={estilos.btnAccion}>{tr('Ver', 'View')}</Link>
                                            <Link href={`/sucursales/productos/editar/${p.id}`} className={estilos.btnAccion}>{tr('Editar', 'Edit')}</Link>
                                            <button type="button" className={estilos.btnAccion} onClick={() => manejarEliminar(p.id)}>{tr('Eliminar', 'Delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

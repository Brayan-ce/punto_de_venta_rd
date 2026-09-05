"use client"
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerReporteTransferencias } from './servidor'
import estilos from './reportesTransferencias.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const formatterDop = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 2
})

export default function ReportesTransferencias() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [exportando, setExportando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [fuenteDatos, setFuenteDatos] = useState('')
    const [filas, setFilas] = useState([])
    const [buscar, setBuscar] = useState('')
    const [estado, setEstado] = useState('')
    const [prioridad, setPrioridad] = useState('')
    const [tipoOperacion, setTipoOperacion] = useState('')
    const [desde, setDesde] = useState('')
    const [hasta, setHasta] = useState('')

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargarDatos()

        const handleTemaChange = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        setMensaje('')
        try {
            const res = await obtenerReporteTransferencias({
                buscar,
                estado,
                prioridad,
                tipoOperacion,
                desde,
                hasta
            })

            if (res.success) {
                setFilas(res.transferencias || [])
                setFuenteDatos(res.fuenteDatos || '')
            } else {
                setMensaje(res.mensaje || tr('No se pudo cargar el reporte', 'Could not load report'))
            }
        } catch (error) {
            console.error('Error en reportes:', error)
            setMensaje(tr('Error inesperado cargando reportes', 'Unexpected error loading reports'))
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(cargarDatos, 450)
        return () => clearTimeout(timer)
    }, [buscar, estado, prioridad, tipoOperacion, desde, hasta])

    const textoTipoOperacion = (tipo) => {
        if (tipo === 'compartir') return tr('Compartir', 'Share')
        return tr('Mover', 'Move')
    }

    const resumen = useMemo(() => {
        const total = filas.length
        const pendientes = filas.filter((item) => item.estado === 'pendiente').length
        const enTransito = filas.filter((item) => item.estado === 'en_transito').length
        const recibidas = filas.filter((item) => item.estado === 'recibida').length
        const urgentes = filas.filter((item) => item.prioridad === 'urgente').length
        const montoTotal = filas.reduce((acc, item) => acc + Number(item.monto_estimado || 0), 0)

        return { total, pendientes, enTransito, recibidas, urgentes, montoTotal }
    }, [filas])

    const formatFecha = (value) => {
        if (!value) return '-'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return '-'
        return date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')
    }

    const exportarExcel = async () => {
        if (!filas.length) {
            setMensaje(tr('No hay datos para exportar', 'No data to export'))
            return
        }

        setExportando(true)
        setMensaje('')

        try {
            const XLSX = await import('xlsx')
            const data = filas.map((item) => ({
                [tr('Numero', 'Number')]: item.numero_transferencia || '',
                [tr('Fecha', 'Date')]: formatFecha(item.fecha_solicitud),
                [tr('Origen', 'Origin')]: item.sucursal_origen || '-',
                [tr('Destino', 'Destination')]: item.sucursal_destino || '-',
                [tr('Estado', 'Status')]: item.estado || '-',
                [tr('Prioridad', 'Priority')]: item.prioridad || '-',
                [tr('Items', 'Items')]: Number(item.items || 0),
                [tr('Monto estimado', 'Estimated amount')]: Number(item.monto_estimado || 0)
            }))

            const worksheet = XLSX.utils.json_to_sheet(data)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, tr('Transferencias', 'Transfers'))

            const fecha = new Date().toISOString().slice(0, 10)
            const nombre = `reporte_transferencias_${fecha}.xlsx`
            XLSX.writeFile(workbook, nombre)

            setMensaje(tr('Excel generado correctamente', 'Excel exported successfully'))
        } catch (error) {
            console.error('Error al exportar excel:', error)
            setMensaje(tr('No se pudo exportar a Excel', 'Could not export to Excel'))
        } finally {
            setExportando(false)
        }
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Reportes de Transferencias', 'Transfer Reports')}</h1>
                    <p className={estilos.subtitulo}>{tr('Analiza estados, prioridades e importes de transferencias', 'Analyze transfer statuses, priorities, and amounts')}</p>
                </div>
                <div className={estilos.accionesHeader}>
                    <button type="button" className={estilos.btnSecundario} onClick={cargarDatos}>
                        {tr('Actualizar', 'Refresh')}
                    </button>
                    <button type="button" className={estilos.btnExcel} onClick={exportarExcel} disabled={exportando || !filas.length}>
                        {exportando ? tr('Exportando...', 'Exporting...') : tr('Exportar Excel', 'Export Excel')}
                    </button>
                    {fuenteDatos === 'transferencias_stock' && (
                        <span className={estilos.aviso}>
                            <ion-icon name="information-circle-outline"></ion-icon>
                            {tr('Usando consulta directa como respaldo', 'Using direct query as fallback')}
                        </span>
                    )}
                </div>
            </div>

            {mensaje && <div className={estilos.mensaje}>{mensaje}</div>}

            <div className={estilos.stats}>
                <div className={estilos.statCard}>
                    <h4>{tr('Total Transferencias', 'Total Transfers')}</h4>
                    <p>{resumen.total}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Pendientes', 'Pending')}</h4>
                    <p>{resumen.pendientes}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('En Transito', 'In Transit')}</h4>
                    <p>{resumen.enTransito}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Recibidas', 'Received')}</h4>
                    <p>{resumen.recibidas}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Urgentes', 'Urgent')}</h4>
                    <p>{resumen.urgentes}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Monto Estimado', 'Estimated Amount')}</h4>
                    <p>{formatterDop.format(resumen.montoTotal)}</p>
                </div>
            </div>

            <div className={estilos.filtros}>
                <input
                    className={estilos.control}
                    type="text"
                    placeholder={tr('Buscar por numero u origen/destino...', 'Search by number or origin/destination...')}
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />

                <select className={estilos.select} value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="">{tr('Todos los estados', 'All statuses')}</option>
                    <option value="pendiente">{tr('Pendiente', 'Pending')}</option>
                    <option value="aprobada">{tr('Aprobada', 'Approved')}</option>
                    <option value="en_transito">{tr('En Transito', 'In Transit')}</option>
                    <option value="recibida">{tr('Recibida', 'Received')}</option>
                    <option value="rechazada">{tr('Rechazada', 'Rejected')}</option>
                    <option value="cancelada">{tr('Cancelada', 'Canceled')}</option>
                </select>

                <select className={estilos.select} value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="">{tr('Todas las prioridades', 'All priorities')}</option>
                    <option value="baja">{tr('Baja', 'Low')}</option>
                    <option value="normal">{tr('Normal', 'Normal')}</option>
                    <option value="alta">{tr('Alta', 'High')}</option>
                    <option value="urgente">{tr('Urgente', 'Urgent')}</option>
                </select>

                <select className={estilos.select} value={tipoOperacion} onChange={(e) => setTipoOperacion(e.target.value)}>
                    <option value="">{tr('Todos los tipos', 'All types')}</option>
                    <option value="mover">{tr('Mover', 'Move')}</option>
                    <option value="compartir">{tr('Compartir', 'Share')}</option>
                </select>

                <input
                    className={estilos.input}
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    aria-label={tr('Fecha desde', 'Date from')}
                />

                <input
                    className={estilos.input}
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    aria-label={tr('Fecha hasta', 'Date to')}
                />
            </div>

            {cargando ? <LoadingScreen /> : filas.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="stats-chart-outline"></ion-icon>
                    <p>{tr('No hay datos para los filtros aplicados', 'No data found for current filters')}</p>
                </div>
            ) : (
                <div className={estilos.resultados}>
                    <div className={estilos.tabla}>
                        <table>
                            <thead>
                                <tr>
                                    <th>{tr('Numero', 'Number')}</th>
                                    <th>{tr('Fecha', 'Date')}</th>
                                    <th>{tr('Origen', 'Origin')}</th>
                                    <th>{tr('Destino', 'Destination')}</th>
                                    <th>{tr('Estado', 'Status')}</th>
                                    <th>{tr('Prioridad', 'Priority')}</th>
                                    <th>{tr('Tipo', 'Type')}</th>
                                    <th>{tr('Items', 'Items')}</th>
                                    <th>{tr('Monto', 'Amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((item) => (
                                    <tr key={item.id}>
                                        <td><strong>{item.numero_transferencia}</strong></td>
                                        <td>{formatFecha(item.fecha_solicitud)}</td>
                                        <td>{item.sucursal_origen || '-'}</td>
                                        <td>{item.sucursal_destino || '-'}</td>
                                        <td>
                                            <span className={`${estilos.badge} ${estilos[item.estado] || ''}`}>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td><span className={estilos.prioridad}>{item.prioridad}</span></td>
                                        <td>{textoTipoOperacion(item.tipo_operacion)}</td>
                                        <td>{item.items || 0}</td>
                                        <td>{formatterDop.format(Number(item.monto_estimado || 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={estilos.tarjetasMobile}>
                        {filas.map((item) => (
                            <article className={estilos.cardItem} key={`m-${item.id}`}>
                                <div className={estilos.cardTop}>
                                    <strong>{item.numero_transferencia}</strong>
                                    <span className={`${estilos.badge} ${estilos[item.estado] || ''}`}>
                                        {item.estado}
                                    </span>
                                </div>
                                <p>{formatFecha(item.fecha_solicitud)}</p>
                                <p>{tr('Origen', 'Origin')}: {item.sucursal_origen || '-'}</p>
                                <p>{tr('Destino', 'Destination')}: {item.sucursal_destino || '-'}</p>
                                <p>{tr('Prioridad', 'Priority')}: <span className={estilos.prioridad}>{item.prioridad}</span></p>
                                <p>{tr('Tipo', 'Type')}: {textoTipoOperacion(item.tipo_operacion)}</p>
                                <p>{tr('Items', 'Items')}: {item.items || 0}</p>
                                <p>{tr('Monto', 'Amount')}: {formatterDop.format(Number(item.monto_estimado || 0))}</p>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

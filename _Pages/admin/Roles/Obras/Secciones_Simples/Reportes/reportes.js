"use client"
import { useState, useEffect } from 'react'
import { obtenerReporteObra, obtenerReporteAsistencias, obtenerReporteGastos, obtenerObrasActivas, obtenerMonedaEmpresa } from './servidor'
import * as XLSX from 'xlsx'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './reportes.module.css'

const TIPOS_REPORTE = [
    { value: 'obra', label: 'Resumen de Obra', labelEn: 'Project Summary', icon: 'business-outline' },
    { value: 'asistencias', label: 'Reporte de Asistencias', labelEn: 'Attendance Report', icon: 'checkmark-done-outline' },
    { value: 'gastos', label: 'Reporte de Gastos', labelEn: 'Expense Report', icon: 'wallet-outline' }
]

export default function Reportes() {
    const [tema, setTema] = useState('light')
    const [tipoReporte, setTipoReporte] = useState('obra')
    const [obras, setObras] = useState([])
    const [obraSeleccionada, setObraSeleccionada] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [moneda, setMoneda] = useState('DOP RD$')
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

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
        cargarMoneda()
        cargarObras()
    }, [])

    async function cargarMoneda() {
        const res = await obtenerMonedaEmpresa()
        if (res.success) {
            setMoneda(`${res.codigo_moneda} ${res.simbolo_moneda}`)
        }
    }

    async function cargarObras() {
        const res = await obtenerObrasActivas()
        if (res.success) {
            setObras(res.obras)
            if (res.obras.length > 0) {
                setObraSeleccionada(res.obras[0].id.toString())
            }
        }
    }

    async function generarReporte() {
        if (!obraSeleccionada) {
            alert(tr('Selecciona una obra', 'Select a project'))
            return
        }

        setCargando(true)
        setDatos(null)

        let res
        switch (tipoReporte) {
            case 'obra':
                res = await obtenerReporteObra(obraSeleccionada)
                break
            case 'asistencias':
                res = await obtenerReporteAsistencias(obraSeleccionada, fechaInicio, fechaFin)
                break
            case 'gastos':
                res = await obtenerReporteGastos(obraSeleccionada, fechaInicio, fechaFin)
                break
        }

        setCargando(false)

        if (res && res.success) {
            setDatos(res.datos)
        } else {
            alert(res?.mensaje || tr('Error al generar reporte', 'Error generating report'))
        }
    }

    function exportarExcel() {
        if (!datos) return

        const obraNombre = obras.find(o => o.id.toString() === obraSeleccionada)?.nombre || 'Obra'
        const nombreArchivo = `${tipoReporte}_${obraNombre}_${new Date().toISOString().split('T')[0]}.xlsx`

        const wb = XLSX.utils.book_new()

        if (tipoReporte === 'obra') {
            const wsResumen = XLSX.utils.json_to_sheet([
                { Campo: 'Obra', Valor: datos.obra.nombre },
                { Campo: 'Codigo', Valor: datos.obra.codigo_obra },
                { Campo: 'Estado', Valor: datos.obra.estado },
                { Campo: 'Presupuesto Total', Valor: datos.obra.presupuesto_total },
                { Campo: 'Total Gastado', Valor: datos.totales.total_gastos },
                { Campo: 'Total Trabajadores', Valor: datos.totales.total_trabajadores },
                { Campo: 'Dias Trabajados', Valor: datos.totales.dias_trabajados },
                { Campo: 'Total Horas', Valor: datos.totales.total_horas }
            ])
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

            if (datos.trabajadores && datos.trabajadores.length > 0) {
                const wsTrabajadores = XLSX.utils.json_to_sheet(datos.trabajadores.map(t => ({
                    Nombre: `${t.nombre} ${t.apellido || ''}`,
                    Especialidad: t.especialidad,
                    Dias: t.dias_trabajados,
                    Horas: t.horas_trabajadas,
                    'Monto Total': t.monto_total
                })))
                XLSX.utils.book_append_sheet(wb, wsTrabajadores, 'Trabajadores')
            }

            if (datos.gastos_tipo && datos.gastos_tipo.length > 0) {
                const wsGastos = XLSX.utils.json_to_sheet(datos.gastos_tipo.map(g => ({
                    Tipo: g.tipo_gasto,
                    Total: g.total
                })))
                XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos por Tipo')
            }
        }

        if (tipoReporte === 'asistencias' && datos.asistencias && datos.asistencias.length > 0) {
            const wsAsistencias = XLSX.utils.json_to_sheet(datos.asistencias.map(a => ({
                Fecha: new Date(a.fecha).toLocaleDateString(),
                Trabajador: `${a.nombre} ${a.apellido || ''}`,
                Presente: a.presente ? 'SI' : 'NO',
                Horas: a.horas_trabajadas,
                Monto: a.monto_pagar,
                Observaciones: a.observaciones || ''
            })))
            XLSX.utils.book_append_sheet(wb, wsAsistencias, 'Asistencias')
        }

        if (tipoReporte === 'gastos' && datos.gastos && datos.gastos.length > 0) {
            const wsGastos = XLSX.utils.json_to_sheet(datos.gastos.map(g => ({
                Fecha: new Date(g.fecha).toLocaleDateString(),
                Tipo: g.tipo_gasto,
                Concepto: g.concepto,
                Descripcion: g.descripcion || '',
                Monto: g.monto,
                Proveedor: g.proveedor || '',
                Factura: g.numero_factura || '',
                'Metodo Pago': g.metodo_pago
            })))
            XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos')

            if (datos.por_tipo && datos.por_tipo.length > 0) {
                const wsTipos = XLSX.utils.json_to_sheet(datos.por_tipo.map(t => ({
                    Tipo: t.tipo_gasto,
                    Total: t.total
                })))
                XLSX.utils.book_append_sheet(wb, wsTipos, 'Por Tipo')
            }
        }

        XLSX.writeFile(wb, nombreArchivo)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        {tr('Reportes Simples', 'Simple Reports')}
                    </h1>
                    <p className={estilos.subtitulo}>
                        {tr('Genera y exporta reportes de tus obras', 'Generate and export reports for your projects')}
                    </p>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.tiposReporte}>
                    {TIPOS_REPORTE.map(tipo => (
                        <button
                            key={tipo.value}
                            className={`${estilos.tipoBtn} ${tipoReporte === tipo.value ? estilos.tipoActivo : ''}`}
                            onClick={() => setTipoReporte(tipo.value)}
                        >
                            <ion-icon name={tipo.icon}></ion-icon>
                            <span>{language === 'en' ? tipo.labelEn : tipo.label}</span>
                        </button>
                    ))}
                </div>

                <div className={estilos.filtros}>
                    <div className={estilos.campo}>
                        <label>{tr('Obra', 'Project')}</label>
                        <select
                            value={obraSeleccionada}
                            onChange={(e) => setObraSeleccionada(e.target.value)}
                            className={estilos.select}
                        >
                            <option value="">{tr('Seleccionar obra', 'Select project')}</option>
                            {obras.map(obra => (
                                <option key={obra.id} value={obra.id}>
                                    {obra.codigo_obra} - {obra.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {tipoReporte !== 'obra' && (
                        <>
                            <div className={estilos.campo}>
                                <label>{tr('Fecha Inicio', 'Start Date')}</label>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className={estilos.input}
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Fecha Fin', 'End Date')}</label>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className={estilos.input}
                                />
                            </div>
                        </>
                    )}

                    <button 
                        className={estilos.btnGenerar}
                        onClick={generarReporte}
                        disabled={cargando}
                    >
                        {cargando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                {tr('Generando...', 'Generating...')}
                            </>
                        ) : (
                            <>
                                <ion-icon name="bar-chart-outline"></ion-icon>
                                {tr('Generar Reporte', 'Generate Report')}
                            </>
                        )}
                    </button>

                    {datos && (
                        <button 
                            className={estilos.btnExportar}
                            onClick={exportarExcel}
                        >
                            <ion-icon name="download-outline"></ion-icon>
                            {tr('Exportar Excel', 'Export Excel')}
                        </button>
                    )}
                </div>
            </div>

            {datos && tipoReporte === 'obra' && (
                <div className={estilos.resultados}>
                    <div className={estilos.resumenCard}>
                        <h3>{tr('Resumen General', 'General Summary')}</h3>
                        <div className={estilos.stats}>
                            <div className={estilos.stat}>
                                <ion-icon name="business-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Obra', 'Project')}</span>
                                    <span className={estilos.statValor}>{datos.obra.nombre}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="code-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Codigo', 'Code')}</span>
                                    <span className={estilos.statValor}>{datos.obra.codigo_obra}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="flag-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Estado', 'Status')}</span>
                                    <span className={estilos.statValor}>{datos.obra.estado}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="wallet-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Presupuesto', 'Budget')}</span>
                                    <span className={estilos.statValor}>{moneda} {parseFloat(datos.obra.presupuesto_total || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="cash-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Total Gastado', 'Total Spent')}</span>
                                    <span className={estilos.statValor}>{moneda} {parseFloat(datos.totales.total_gastos || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="people-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Trabajadores', 'Workers')}</span>
                                    <span className={estilos.statValor}>{datos.totales.total_trabajadores || 0}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="calendar-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Dias Trabajados', 'Days Worked')}</span>
                                    <span className={estilos.statValor}>{datos.totales.dias_trabajados || 0}</span>
                                </div>
                            </div>
                            <div className={estilos.stat}>
                                <ion-icon name="time-outline"></ion-icon>
                                <div>
                                    <span className={estilos.statLabel}>{tr('Total Horas', 'Total Hours')}</span>
                                    <span className={estilos.statValor}>{parseFloat(datos.totales.total_horas || 0).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {datos.trabajadores?.length > 0 && (
                        <div className={estilos.tablaCard}>
                            <h3>{tr('Trabajadores', 'Workers')}</h3>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Nombre', 'Name')}</th>
                                        <th>{tr('Especialidad', 'Specialty')}</th>
                                        <th>{tr('Dias', 'Days')}</th>
                                        <th>{tr('Horas', 'Hours')}</th>
                                        <th>{tr('Monto Total', 'Total Amount')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.trabajadores.map((t, i) => (
                                        <tr key={i}>
                                            <td>{t.nombre} {t.apellido}</td>
                                            <td>{t.especialidad || '-'}</td>
                                            <td>{t.dias_trabajados}</td>
                                            <td>{parseFloat(t.horas_trabajadas).toFixed(1)}</td>
                                            <td>{moneda} {parseFloat(t.monto_total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {datos.gastos_tipo?.length > 0 && (
                        <div className={estilos.tablaCard}>
                            <h3>{tr('Gastos por Tipo', 'Expenses by Type')}</h3>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Tipo', 'Type')}</th>
                                        <th>{tr('Total', 'Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.gastos_tipo.map((g, i) => (
                                        <tr key={i}>
                                            <td>{g.tipo_gasto}</td>
                                            <td>{moneda} {parseFloat(g.total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {datos && tipoReporte === 'asistencias' && datos.asistencias && (
                <div className={estilos.resultados}>
                    <div className={estilos.tablaCard}>
                        <h3>{tr('Reporte de Asistencias', 'Attendance Report')}</h3>
                        {datos.asistencias.length === 0 ? (
                            <p>{tr('No hay asistencias registradas en el periodo seleccionado', 'No attendance records in the selected period')}</p>
                        ) : (
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Trabajador', 'Worker')}</th>
                                        <th>{tr('Presente', 'Present')}</th>
                                        <th>{tr('Horas', 'Hours')}</th>
                                        <th>{tr('Monto', 'Amount')}</th>
                                        <th>{tr('Observaciones', 'Observations')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.asistencias.map((a, i) => (
                                        <tr key={i}>
                                            <td>{new Date(a.fecha).toLocaleDateString()}</td>
                                            <td>{a.nombre} {a.apellido}</td>
                                            <td>
                                                <span className={`${estilos.badge} ${a.presente ? estilos.presente : estilos.ausente}`}>
                                                    {a.presente ? 'SI' : 'NO'}
                                                </span>
                                            </td>
                                            <td>{parseFloat(a.horas_trabajadas).toFixed(1)}</td>
                                            <td>{moneda} {parseFloat(a.monto_pagar).toLocaleString()}</td>
                                            <td>{a.observaciones || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {datos && tipoReporte === 'gastos' && datos.gastos && (
                <div className={estilos.resultados}>
                    <div className={estilos.resumenCard}>
                        <h3>{tr('Total de Gastos:', 'Total Expenses:')} {moneda} {parseFloat(datos.total || 0).toLocaleString()}</h3>
                    </div>

                    {datos.por_tipo && datos.por_tipo.length > 0 && (
                        <div className={estilos.tablaCard}>
                            <h3>{tr('Por Tipo', 'By Type')}</h3>
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.por_tipo.map((t, i) => (
                                        <tr key={i}>
                                            <td>{t.tipo_gasto}</td>
                                            <td>{moneda} {parseFloat(t.total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className={estilos.tablaCard}>
                        <h3>{tr('Detalle de Gastos', 'Expense Detail')}</h3>
                        {datos.gastos.length === 0 ? (
                            <p>{tr('No hay gastos registrados en el periodo seleccionado', 'No expenses recorded in the selected period')}</p>
                        ) : (
                            <table className={estilos.tabla}>
                                <thead>
                                    <tr>
                                        <th>{tr('Fecha', 'Date')}</th>
                                        <th>{tr('Tipo', 'Type')}</th>
                                        <th>{tr('Concepto', 'Concept')}</th>
                                        <th>{tr('Monto', 'Amount')}</th>
                                        <th>{tr('Proveedor', 'Supplier')}</th>
                                        <th>{tr('Factura', 'Invoice')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datos.gastos.map((g, i) => (
                                        <tr key={i}>
                                            <td>{new Date(g.fecha).toLocaleDateString()}</td>
                                            <td>{g.tipo_gasto}</td>
                                            <td>{g.concepto}</td>
                                            <td>{moneda} {parseFloat(g.monto).toLocaleString()}</td>
                                            <td>{g.proveedor || '-'}</td>
                                            <td>{g.numero_factura || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {!datos && !cargando && (
                <div className={estilos.vacio}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    <h3>{tr('Genera un reporte', 'Generate a report')}</h3>
                    <p>{tr('Selecciona el tipo de reporte y haz click en Generar', 'Select the report type and click Generate')}</p>
                </div>
            )}
        </div>
    )
}
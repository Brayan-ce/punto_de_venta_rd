"use client"
import { obtenerTextoEstado, esVencida } from "../lib"
import { getEstadoBadge } from "../constants"
import estilos from "../cotizaciones.module.css"

/**
 * Componente de tabla para mostrar cotizaciones
 */
export default function TablaCotizaciones({
    cotizaciones,
    tema,
    router,
    formateadorMoneda,
    estilos: estilosProp,
    manejarEliminar,
    procesando,
    language,
    tr
}) {
    const estilosUsar = estilosProp || estilos

    const handleVer = (id) => {
        router.push(`/admin/cotizaciones/${id}`)
    }

    const handleEditar = (id) => {
        router.push(`/admin/cotizaciones/${id}/editar`)
    }

    const handleImprimir = (id) => {
        router.push(`/admin/cotizaciones/${id}/imprimir`)
    }

    const handleEliminar = (id, numero) => {
        manejarEliminar(id, numero)
    }

    return (
        <div className={estilosUsar.tablaContenedor}>
            <table className={estilosUsar.tabla}>
                <thead>
                <tr className={estilosUsar[tema]}>
                    <th>{tr('Numero', 'Number')}</th>
                    <th>{tr('Cliente', 'Customer')}</th>
                    <th>{tr('Fecha', 'Date')}</th>
                    <th>{tr('Vencimiento', 'Due date')}</th>
                    <th>{tr('Total', 'Total')}</th>
                    <th>{tr('Estado', 'Status')}</th>
                    <th>{tr('Acciones', 'Actions')}</th>
                </tr>
                </thead>
                <tbody>
                {cotizaciones.map((cot) => {
                    // Estados editables: borrador, enviada, aprobada, vencida
                    // Estados no editables: convertida, anulada, rechazada
                    const puedeEditar = !['convertida', 'anulada', 'rechazada'].includes(cot.estado)
                    const puedeEliminar = cot.estado !== 'convertida'

                    return (
                        <tr key={cot.id} className={`${estilosUsar.filaTabla} ${estilosUsar[tema]}`}>
                            <td className={estilosUsar.tdInfoPrincipal}>
                                <strong>{cot.numero_cotizacion}</strong>
                            </td>
                            <td>{cot.cliente_nombre || tr('Consumidor Final', 'Final Consumer')}</td>
                            <td>{new Date(cot.fecha_emision).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}</td>
                            <td>
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                    {new Date(cot.fecha_vencimiento).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO')}
                                    {esVencida(cot.fecha_vencimiento) && cot.estado !== 'vencida' && (
                                        <span style={{color: '#dc2626'}}>⚠️</span>
                                    )}
                                </div>
                            </td>
                            <td className={estilosUsar.tdTotal}>
                                {formateadorMoneda.format(cot.total)}
                            </td>
                            <td>
                                <span className={`${estilosUsar.badgeTabla} ${getEstadoBadge(cot.estado, estilosUsar)}`}>
                                    {obtenerTextoEstado(cot.estado, language)}
                                </span>
                            </td>
                            <td className={estilosUsar.tdAcciones}>
                                <div className={estilosUsar.accionesTabla}>
                                    <button
                                        onClick={() => handleVer(cot.id)}
                                        className={estilosUsar.btnTablaVer}
                                        title={tr('Ver detalle', 'View details')}
                                        aria-label={tr('Ver detalle', 'View details')}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                    </button>
                                    {puedeEditar && (
                                        <button
                                            onClick={() => handleEditar(cot.id)}
                                            className={estilosUsar.btnTablaEditar}
                                            title={tr('Editar', 'Edit')}
                                            aria-label={tr('Editar', 'Edit')}
                                        >
                                            <ion-icon name="create-outline"></ion-icon>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleImprimir(cot.id)}
                                        className={estilosUsar.btnTablaImprimir}
                                        title={tr('Imprimir', 'Print')}
                                        aria-label={tr('Imprimir', 'Print')}
                                    >
                                        <ion-icon name="print-outline"></ion-icon>
                                    </button>
                                    {puedeEliminar && (
                                        <button
                                            onClick={() => handleEliminar(cot.id, cot.numero_cotizacion)}
                                            className={estilosUsar.btnTablaEliminar || estilosUsar.btnTablaDanger}
                                            title={tr('Eliminar', 'Delete')}
                                            aria-label={tr('Eliminar', 'Delete')}
                                            disabled={procesando}
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}


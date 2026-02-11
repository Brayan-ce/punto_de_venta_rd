"use client"
import { obtenerTextoEstado, esVencida } from "../lib"
import { getEstadoBadge } from "../constants"
import estilos from "../cotizaciones.module.css"

/**
 * Componente de tarjeta para mostrar una cotización
 */
export default function CotizacionCard({
    cotizacion,
    tema,
    router,
    formateadorMoneda,
    estilos: estilosProp,
    manejarEliminar,
    procesando
}) {
    const estilosUsar = estilosProp || estilos

    const handleClick = () => {
        router.push(`/admin/cotizaciones/${cotizacion.id}`)
    }

    const handleVer = (e) => {
        e.stopPropagation()
        router.push(`/admin/cotizaciones/${cotizacion.id}`)
    }

    const handleEditar = (e) => {
        e.stopPropagation()
        router.push(`/admin/cotizaciones/${cotizacion.id}/editar`)
    }

    const handleImprimir = (e) => {
        e.stopPropagation()
        router.push(`/admin/cotizaciones/${cotizacion.id}/imprimir`)
    }

    const handleEliminar = (e) => {
        e.stopPropagation()
        manejarEliminar(cotizacion.id, cotizacion.numero_cotizacion)
    }

    // Estados editables: borrador, enviada, aprobada, vencida
    // Estados no editables: convertida, anulada, rechazada
    const puedeEditar = !['convertida', 'anulada', 'rechazada'].includes(cotizacion.estado)
    const puedeEliminar = cotizacion.estado !== 'convertida'
    
    const estaVencida = esVencida(cotizacion.fecha_vencimiento) && cotizacion.estado !== 'vencida'
    const fechaVencimiento = new Date(cotizacion.fecha_vencimiento)
    const hoy = new Date()
    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24))

    return (
        <div
            className={`${estilosUsar.cotizacionCard} ${estilosUsar[tema]} ${estaVencida ? estilosUsar.vencida : ''}`}
            onClick={handleClick}
        >
            {/* Header - Número y Estado */}
            <div className={estilosUsar.cardHeader}>
                <div className={estilosUsar.infoBasica}>
                    <span className={estilosUsar.numeroMuted}>
                        #{cotizacion.numero_cotizacion}
                    </span>
                    <h3 className={estilosUsar.clienteNombre}>
                        {cotizacion.cliente_nombre || 'Consumidor Final'}
                    </h3>
                </div>
                <span className={`${estilosUsar.badge} ${getEstadoBadge(cotizacion.estado, estilosUsar)}`}>
                    {obtenerTextoEstado(cotizacion.estado)}
                </span>
            </div>

            {/* Total como protagonista */}
            <div className={estilosUsar.totalHero}>
                {formateadorMoneda.format(cotizacion.total)}
            </div>

            {/* Meta información */}
            <div className={estilosUsar.meta}>
                <span className={estilosUsar.metaMuted}>
                    <ion-icon name="calendar-outline"></ion-icon>
                    Emitida: {new Date(cotizacion.fecha_emision).toLocaleDateString('es-DO')}
                </span>
                <span className={estaVencida ? estilosUsar.metaDanger : estilosUsar.metaMuted}>
                    <ion-icon name={estaVencida ? "warning-outline" : "time-outline"}></ion-icon>
                    {estaVencida 
                        ? `Vencida hace ${Math.abs(diasRestantes)} días`
                        : diasRestantes > 0 
                            ? `Vence en ${diasRestantes} días`
                            : 'Vence hoy'
                    }
                </span>
            </div>

            {/* Acciones siempre visibles con colores */}
            <div className={estilosUsar.cardActions}>
                <button
                    onClick={handleVer}
                    className={`${estilosUsar.btnAccionCompacto} ${estilosUsar.btnCardVer}`}
                    title="Ver detalle completo"
                >
                    <ion-icon name="eye-outline"></ion-icon>
                </button>
                {puedeEditar && (
                    <button
                        onClick={handleEditar}
                        className={`${estilosUsar.btnAccionCompacto} ${estilosUsar.btnCardEditar}`}
                        title="Editar cotización"
                    >
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                )}
                <button
                    onClick={handleImprimir}
                    className={`${estilosUsar.btnAccionCompacto} ${estilosUsar.btnCardImprimir}`}
                    title="Imprimir cotización"
                >
                    <ion-icon name="print-outline"></ion-icon>
                </button>
                {puedeEliminar && (
                    <button
                        onClick={handleEliminar}
                        className={`${estilosUsar.btnAccionCompacto} ${estilosUsar.btnCardEliminar}`}
                        title="Eliminar cotización"
                        disabled={procesando}
                    >
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                )}
            </div>
        </div>
    )
}


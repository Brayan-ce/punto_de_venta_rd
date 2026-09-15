"use client"
import { useRouter } from 'next/navigation'
import { ESTADOS_OBRA, formatearEstadoObra, formatearTipoObra } from '../../core/construction/estados'
import { calcularPorcentajeEjecutado, calcularDiasRestantes } from '../../core/construction/calculos'
import estilos from '../obras.module.css'

export default function VistaKanban({ obras, tema, router }) {
    const estados = [
        { key: 'activa', label: 'Activas', icon: 'checkmark-circle-outline' },
        { key: 'suspendida', label: 'Suspendidas', icon: 'time-outline' },
        { key: 'finalizada', label: 'Finalizadas', icon: 'checkmark-done-outline' },
        { key: 'cancelada', label: 'Canceladas', icon: 'close-circle-outline' }
    ]

    const obrasPorEstado = estados.map(estado => ({
        ...estado,
        obras: obras.filter(o => o.estado === estado.key)
    }))

    return (
        <div className={`${estilos.kanbanContainer} ${estilos[tema]}`}>
            <div className={estilos.kanbanGrid}>
                {obrasPorEstado.map(columna => (
                    <div key={columna.key} className={estilos.kanbanColumna}>
                        <div className={estilos.kanbanColumnaHeader}>
                            <div className={estilos.kanbanColumnaTitulo}>
                                <ion-icon name={columna.icon}></ion-icon>
                                <span>{columna.label}</span>
                            </div>
                            <span className={estilos.kanbanColumnaCount}>{columna.obras.length}</span>
                        </div>
                        <div className={estilos.kanbanColumnaBody}>
                            {columna.obras.length === 0 ? (
                                <div className={estilos.kanbanVacio}>
                                    <p>No hay obras en este estado</p>
                                </div>
                            ) : (
                                columna.obras.map(obra => {
                                    const porcentajeEjecutado = calcularPorcentajeEjecutado(
                                        obra.costo_real || obra.costo_ejecutado || 0,
                                        obra.presupuesto_aprobado || 0
                                    )
                                    const diasRestantes = obra.fecha_fin_estimada 
                                        ? calcularDiasRestantes(obra.fecha_fin_estimada)
                                        : null
                                    
                                    const getProgresoColor = () => {
                                        if (porcentajeEjecutado >= 90) return 'critico'
                                        if (porcentajeEjecutado >= 70) return 'atencion'
                                        return 'normal'
                                    }

                                    return (
                                        <div 
                                            key={obra.id} 
                                            className={estilos.kanbanCard}
                                            onClick={() => router.push(`/admin/obras/ver/${obra.id}`)}
                                        >
                                            <div className={estilos.kanbanCardHeader}>
                                                {(obra.codigo || obra.codigo_obra) && (
                                                    <span className={estilos.codigoObra}>
                                                        {obra.codigo || obra.codigo_obra}
                                                    </span>
                                                )}
                                                <h4>{obra.nombre}</h4>
                                            </div>
                                            
                                            {obra.ubicacion && (
                                                <div className={estilos.kanbanCardInfo}>
                                                    <ion-icon name="location-outline"></ion-icon>
                                                    <span>{obra.ubicacion}</span>
                                                </div>
                                            )}

                                            {porcentajeEjecutado > 0 && (
                                                <div className={estilos.kanbanProgreso}>
                                                    <div className={estilos.kanbanProgresoHeader}>
                                                        <span>{porcentajeEjecutado.toFixed(0)}%</span>
                                                    </div>
                                                    <div className={estilos.barraProgreso}>
                                                        <div 
                                                            className={`${estilos.progresoFill} ${estilos[getProgresoColor()]}`}
                                                            style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {diasRestantes !== null && (
                                                <div className={`${estilos.kanbanCardFooter} ${diasRestantes < 0 ? estilos.diasVencidos : ''}`}>
                                                    <ion-icon name="time-outline"></ion-icon>
                                                    <span>
                                                        {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


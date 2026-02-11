"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerControlPresupuestario, obtenerAlertasPresupuesto, obtenerCostosSemanales, marcarAlertaRevisada } from './servidor'
import { obtenerObras } from '../obras/servidor'
import { obtenerSeveridadAlerta, REGLAS_NEGOCIO } from '../core/construction/reglas'
import { formatearEstadoObra } from '../core/construction/estados'
import estilos from './presupuesto.module.css'

export default function PresupuestoAdmin() {
    const router = useRouter()
    const [obras, setObras] = useState([])
    const [obraSeleccionada, setObraSeleccionada] = useState('')
    const [control, setControl] = useState(null)
    const [alertas, setAlertas] = useState([])
    const [costosSemanales, setCostosSemanales] = useState([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarObras()
    }, [])

    useEffect(() => {
        if (obraSeleccionada) {
            cargarDatos()
        } else {
            setControl(null)
            setAlertas([])
            setCostosSemanales([])
        }
    }, [obraSeleccionada])

    async function cargarObras() {
        const res = await obtenerObras({ estado: 'activa' })
        if (res.success && res.obras.length > 0) {
            setObras(res.obras)
            setObraSeleccionada(res.obras[0].id)
        }
        setCargando(false)
    }

    async function cargarDatos() {
        setCargando(true)
        
        const [resControl, resAlertas, resCostos] = await Promise.all([
            obtenerControlPresupuestario(obraSeleccionada),
            obtenerAlertasPresupuesto({ obra_id: obraSeleccionada, estado: 'activa' }),
            obtenerCostosSemanales(obraSeleccionada)
        ])
        
        if (resControl.success) {
            setControl(resControl.control)
        }
        
        if (resAlertas.success) {
            setAlertas(resAlertas.alertas)
        }
        
        if (resCostos.success) {
            setCostosSemanales(resCostos.costos)
        }
        
        setCargando(false)
    }

    const getEstadoColor = (porcentaje) => {
        if (porcentaje >= REGLAS_NEGOCIO.UMBRAL_ALERTA_90) {
            return {
                bg: 'bg-red-500',
                text: 'text-red-600',
                border: 'border-red-500',
                bgLight: 'bg-red-50',
                label: 'Crítico'
            }
        }
        if (porcentaje >= REGLAS_NEGOCIO.UMBRAL_ALERTA_70) {
            return {
                bg: 'bg-yellow-500',
                text: 'text-yellow-600',
                border: 'border-yellow-500',
                bgLight: 'bg-yellow-50',
                label: 'Atención'
            }
        }
        return {
            bg: 'bg-green-500',
            text: 'text-green-600',
            border: 'border-green-500',
            bgLight: 'bg-green-50',
            label: 'Normal'
        }
    }

    const handleMarcarAlertaRevisada = async (alertaId) => {
        const res = await marcarAlertaRevisada(alertaId)
        if (res.success) {
            cargarDatos()
        }
    }

    if (cargando && !control) {
        return (
            <div className={estilos.contenedor}>
                <div className={estilos.cargando}>Cargando...</div>
            </div>
        )
    }

    if (!control) {
        return (
            <div className={estilos.contenedor}>
                <div className={estilos.vacio}>Seleccione una obra para ver el control presupuestario</div>
            </div>
        )
    }

    const estado = getEstadoColor(control.presupuesto.porcentaje)
    const distribucionCostos = [
        {
            nombre: 'Mano de Obra',
            valor: control.costos.mano_obra,
            porcentaje: control.costos.total > 0 ? (control.costos.mano_obra / control.costos.total * 100).toFixed(1) : 0,
            color: 'bg-blue-500',
            icon: 'people-outline'
        },
        {
            nombre: 'Materiales',
            valor: control.costos.materiales,
            porcentaje: control.costos.total > 0 ? (control.costos.materiales / control.costos.total * 100).toFixed(1) : 0,
            color: 'bg-purple-500',
            icon: 'cube-outline'
        },
        {
            nombre: 'Servicios',
            valor: control.costos.servicios,
            porcentaje: control.costos.total > 0 ? (control.costos.servicios / control.costos.total * 100).toFixed(1) : 0,
            color: 'bg-cyan-500',
            icon: 'construct-outline'
        },
        {
            nombre: 'Imprevistos',
            valor: control.costos.imprevistos,
            porcentaje: control.costos.total > 0 ? (control.costos.imprevistos / control.costos.total * 100).toFixed(1) : 0,
            color: 'bg-orange-500',
            icon: 'warning-outline'
        }
    ].filter(item => item.valor > 0)

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="calculator-outline"></ion-icon>
                        Control Presupuestario
                    </h1>
                    <p className={estilos.subtitulo}>Monitoreo en tiempo real de costos y presupuesto por obra</p>
                </div>
            </div>

            {/* Selector de Obra */}
            <div className={estilos.selectorObra}>
                <label>
                    <ion-icon name="business-outline" style={{ marginRight: '8px', fontSize: '18px' }}></ion-icon>
                    Seleccionar Obra
                </label>
                <select
                    value={obraSeleccionada}
                    onChange={(e) => setObraSeleccionada(e.target.value)}
                >
                    {obras.map(obra => (
                        <option key={obra.id} value={obra.id}>
                            {obra.codigo_obra} - {obra.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Alertas */}
            {alertas.length > 0 && (
                <div className={estilos.alertas}>
                    <h3>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        Alertas Activas
                    </h3>
                    {alertas.map(alerta => (
                        <div key={alerta.id} className={`${estilos.alerta} ${estilos[`alerta_${alerta.severidad}`]}`}>
                            <div>
                                <strong>{alerta.obra_nombre}</strong>
                                <p>{alerta.tipo_alerta === 'umbral_70' ? 'Ha alcanzado el 70% del presupuesto' :
                                    alerta.tipo_alerta === 'umbral_90' ? 'Ha alcanzado el 90% del presupuesto' :
                                    alerta.tipo_alerta === 'excedido' ? 'Ha excedido el presupuesto' :
                                    'Proyección de sobrecosto'}</p>
                            </div>
                            <button onClick={() => handleMarcarAlertaRevisada(alerta.id)}>
                                Marcar como revisada
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Tarjeta de Estado General */}
            <div className={`${estilos.estadoGeneral} ${estilos[estado.bgLight]}`}>
                <div className={estilos.estadoHeader}>
                    <div>
                        <span className={estilos.badgeEstado}>{estado.label}</span>
                        <span className={estilos.codigoObra}>{control.obra.codigo_obra}</span>
                        <h2>{control.obra.nombre}</h2>
                        <p>{control.obra.dias_restantes} días restantes de {control.obra.dias_totales}</p>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div className={estilos.progreso}>
                    <div className={estilos.progresoHeader}>
                        <span>Ejecución Presupuestaria</span>
                        <span className={estilos[estado.text]}>{control.presupuesto.porcentaje.toFixed(1)}%</span>
                    </div>
                    <div className={estilos.barraProgreso}>
                        <div 
                            className={estilos[estado.bg]}
                            style={{ width: `${Math.min(control.presupuesto.porcentaje, 100)}%` }}
                        />
                    </div>
                    <div className={estilos.progresoFooter}>
                        <span>RD$ 0</span>
                        <span>RD$ {control.presupuesto.total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Alerta de Sobrecosto */}
                {control.proyeccion.tiene_sobrecosto && (
                    <div className={estilos.alertaSobrecosto}>
                        <strong>
                            <ion-icon name="warning-outline" style={{ marginRight: '8px', fontSize: '20px', verticalAlign: 'middle' }}></ion-icon>
                            Proyección de Sobrecosto
                        </strong>
                        <p>
                            A la tasa actual de consumo (RD$ {control.proyeccion.tasa_consumo_diaria.toLocaleString()}/día),
                            se proyecta un sobrecosto de <strong>RD$ {control.proyeccion.sobrecosto.toLocaleString()}</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* Cards de Resumen */}
            <div className={estilos.cardsResumen}>
                <div className={estilos.card}>
                    <div className={`${estilos.cardIcon} ${estilos.primary}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div>
                        <p className={estilos.cardLabel}>Presupuesto Total</p>
                        <p className={estilos.cardValue}>RD$ {control.presupuesto.total.toLocaleString()}</p>
                    </div>
                </div>
                <div className={estilos.card}>
                    <div className={`${estilos.cardIcon} ${estilos.danger}`}>
                        <ion-icon name="trending-up-outline"></ion-icon>
                    </div>
                    <div>
                        <p className={estilos.cardLabel}>Costo Ejecutado</p>
                        <p className={estilos.cardValue} style={{ color: '#dc2626' }}>
                            RD$ {control.presupuesto.ejecutado.toLocaleString()}
                        </p>
                        <span className={estilos.badgePorcentaje}>{control.presupuesto.porcentaje.toFixed(1)}%</span>
                    </div>
                </div>
                <div className={estilos.card}>
                    <div className={`${estilos.cardIcon} ${estilos.success}`}>
                        <ion-icon name="trending-down-outline"></ion-icon>
                    </div>
                    <div>
                        <p className={estilos.cardLabel}>Saldo Disponible</p>
                        <p className={estilos.cardValue} style={{ color: '#16a34a' }}>
                            RD$ {control.presupuesto.saldo.toLocaleString()}
                        </p>
                        <span className={estilos.badgePorcentaje}>
                            {(100 - control.presupuesto.porcentaje).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className={estilos.grid}>
                {/* Distribución de Costos */}
                <div className={estilos.seccion}>
                    <h3>
                        <ion-icon name="pie-chart-outline"></ion-icon>
                        Distribución de Costos
                    </h3>
                    <div className={estilos.distribucion}>
                        {distribucionCostos.map((item, index) => (
                            <div key={index} className={estilos.itemDistribucion}>
                                <div className={estilos.itemHeader}>
                                    <div className={estilos.itemIcon}>
                                        <ion-icon name={item.icon} style={{ fontSize: '24px' }}></ion-icon>
                                        <span>{item.nombre}</span>
                                    </div>
                                    <div className={estilos.itemValor}>
                                        <strong>RD$ {item.valor.toLocaleString()}</strong>
                                        <span>{item.porcentaje}%</span>
                                    </div>
                                </div>
                                <div className={estilos.barraItem}>
                                    <div 
                                        className={estilos[item.color]}
                                        style={{ width: `${item.porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Costos Semanales */}
                {costosSemanales.length > 0 && (
                    <div className={estilos.seccion}>
                        <h3>
                            <ion-icon name="calendar-outline"></ion-icon>
                            Costos Semanales vs Presupuestado
                        </h3>
                        <div className={estilos.costosSemanales}>
                            {costosSemanales.map((semana, index) => {
                                const porcentajeReal = semana.presupuestado > 0 
                                    ? (semana.costo / semana.presupuestado) * 100 
                                    : 0
                                const excedio = semana.costo > semana.presupuestado
                                return (
                                    <div key={index} className={estilos.semana}>
                                        <div className={estilos.semanaHeader}>
                                            <span>{semana.semana}</span>
                                            <div>
                                                <strong className={excedio ? estilos.excedido : estilos.normal}>
                                                    RD$ {semana.costo.toLocaleString()}
                                                </strong>
                                                <span>Pres: RD$ {semana.presupuestado.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.barraSemana}>
                                            <div 
                                                className={excedio ? estilos.barraExcedido : estilos.barraNormal}
                                                style={{ width: `${Math.min(porcentajeReal, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Sidebar de Indicadores */}
                <div className={estilos.sidebar}>
                    {/* Índice CPI */}
                    <div className={estilos.cardCPI}>
                        <h3>
                            <ion-icon name="analytics-outline"></ion-icon>
                            Índice CPI
                        </h3>
                        <div className={estilos.cpiValue}>
                            <strong>{control.indicadores.cpi.toFixed(2)}</strong>
                            <span>
                                {control.indicadores.cpi > 1 ? (
                                    <>
                                        <ion-icon name="checkmark-circle-outline" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}></ion-icon>
                                        Eficiente
                                    </>
                                ) : control.indicadores.cpi === 1 ? (
                                    <>
                                        <ion-icon name="checkmark-outline" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}></ion-icon>
                                        Normal
                                    </>
                                ) : (
                                    <>
                                        <ion-icon name="warning-outline" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}></ion-icon>
                                        Ineficiente
                                    </>
                                )}
                            </span>
                        </div>
                        <div className={estilos.cpiInfo}>
                            <p><strong>CPI {'>'} 1:</strong> Eficiente</p>
                            <p><strong>CPI = 1:</strong> Según plan</p>
                            <p><strong>CPI {'<'} 1:</strong> Sobrecosto</p>
                        </div>
                    </div>

                    {/* Proyección */}
                    <div className={estilos.cardProyeccion}>
                        <h3>
                            <ion-icon name="trending-up-outline"></ion-icon>
                            Proyección Final
                        </h3>
                        <div className={estilos.proyeccionItems}>
                            <div>
                                <span>Días restantes</span>
                                <strong>{control.obra.dias_restantes}</strong>
                            </div>
                            <div>
                                <span>Tasa consumo/día</span>
                                <strong>RD$ {control.proyeccion.tasa_consumo_diaria.toLocaleString()}</strong>
                            </div>
                            <div>
                                <span>Costo proyectado</span>
                                <strong className={control.proyeccion.tiene_sobrecosto ? estilos.excedido : estilos.normal}>
                                    RD$ {control.proyeccion.costo_proyectado.toLocaleString()}
                                </strong>
                            </div>
                            {control.proyeccion.tiene_sobrecosto && (
                                <div className={estilos.sobrecosto}>
                                    <span>Sobrecosto estimado</span>
                                    <strong>RD$ {control.proyeccion.sobrecosto.toLocaleString()}</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className={estilos.cardAcciones}>
                        <h3>
                            <ion-icon name="flash-outline"></ion-icon>
                            Acciones
                        </h3>
                        <button onClick={() => router.push(`/admin/obras/ver/${control.obra.id}`)}>
                            <ion-icon name="eye-outline"></ion-icon>
                            <span>Ver detalle de obra</span>
                        </button>
                        <button onClick={() => router.push(`/admin/compras-obra?obra=${control.obra.id}`)}>
                            <ion-icon name="bag-outline"></ion-icon>
                            <span>Ver compras</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


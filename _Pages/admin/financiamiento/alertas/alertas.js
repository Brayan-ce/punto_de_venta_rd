"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerAlertas } from '../servidor'
import estilos from './alertas.module.css'

export default function AlertasFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [alertas, setAlertas] = useState([])
    const [filtroSeveridad, setFiltroSeveridad] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('activa')
    const [filtroTipo, setFiltroTipo] = useState('')

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
        cargarAlertas()
    }, [filtroSeveridad, filtroEstado, filtroTipo])

    const cargarAlertas = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerAlertas({
                severidad: filtroSeveridad || undefined,
                estado: filtroEstado || undefined,
                tipo_alerta: filtroTipo || undefined
            })

            if (resultado.success) {
                setAlertas(resultado.alertas)
            } else {
                alert(resultado.mensaje || 'Error al cargar alertas')
            }
        } catch (error) {
            console.error('Error al cargar alertas:', error)
            alert('Error al cargar alertas')
        } finally {
            setCargando(false)
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const obtenerColorSeveridad = (severidad) => {
        const colores = {
            critica: 'danger',
            alta: 'warning',
            media: 'info',
            baja: 'secondary'
        }
        return colores[severidad] || 'secondary'
    }

    const obtenerTextoAlerta = (tipo) => {
        const textos = {
            vence_10_dias: 'Vence en 10 días',
            vence_5_dias: 'Vence en 5 días',
            vence_3_dias: 'Vence en 3 días',
            vence_hoy: 'Vence hoy',
            vencida: 'Vencida',
            cliente_alto_riesgo: 'Cliente de alto riesgo',
            limite_excedido: 'Límite excedido',
            clasificacion_bajo: 'Clasificación bajó'
        }
        return textos[tipo] || tipo
    }

    const llamarCliente = (telefono) => {
        if (telefono) {
            window.open(`tel:${telefono}`, '_self')
        }
    }

    const enviarWhatsApp = (telefono, mensaje) => {
        if (telefono) {
            const texto = encodeURIComponent(mensaje || 'Hola, le contactamos sobre su financiamiento')
            window.open(`https://wa.me/${telefono.replace(/[^0-9]/g, '')}?text=${texto}`, '_blank')
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando alertas...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Alertas de Cobranza</h1>
                    <p className={estilos.subtitulo}>Gestiona alertas y notificaciones de financiamiento</p>
                </div>
                <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </Link>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <select
                    className={estilos.selectFiltro}
                    value={filtroSeveridad}
                    onChange={(e) => setFiltroSeveridad(e.target.value)}
                >
                    <option value="">Todas las severidades</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="activa">Activas</option>
                    <option value="vista">Vistas</option>
                    <option value="resuelta">Resueltas</option>
                    <option value="descartada">Descartadas</option>
                    <option value="">Todas</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                >
                    <option value="">Todos los tipos</option>
                    <option value="vence_10_dias">Vence en 10 días</option>
                    <option value="vence_5_dias">Vence en 5 días</option>
                    <option value="vence_3_dias">Vence en 3 días</option>
                    <option value="vence_hoy">Vence hoy</option>
                    <option value="vencida">Vencida</option>
                    <option value="cliente_alto_riesgo">Cliente alto riesgo</option>
                </select>
            </div>

            {/* Estadísticas rápidas */}
            <div className={estilos.estadisticas}>
                <div className={estilos.estadCard}>
                    <span className={estilos.estadLabel}>Total Alertas</span>
                    <span className={estilos.estadValor}>{alertas.length}</span>
                </div>
                <div className={estilos.estadCard}>
                    <span className={estilos.estadLabel}>Críticas</span>
                    <span className={`${estilos.estadValor} ${estilos.danger}`}>
                        {alertas.filter(a => a.severidad === 'critica').length}
                    </span>
                </div>
                <div className={estilos.estadCard}>
                    <span className={estilos.estadLabel}>Altas</span>
                    <span className={`${estilos.estadValor} ${estilos.warning}`}>
                        {alertas.filter(a => a.severidad === 'alta').length}
                    </span>
                </div>
                <div className={estilos.estadCard}>
                    <span className={estilos.estadLabel}>Activas</span>
                    <span className={`${estilos.estadValor} ${estilos.info}`}>
                        {alertas.filter(a => a.estado === 'activa').length}
                    </span>
                </div>
            </div>

            {/* Lista de alertas */}
            <div className={estilos.alertasLista}>
                {alertas.length === 0 ? (
                    <div className={estilos.sinDatos}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        <p>No hay alertas para mostrar</p>
                    </div>
                ) : (
                    alertas.map((alerta) => (
                        <div
                            key={alerta.id}
                            className={`${estilos.alertaCard} ${estilos[obtenerColorSeveridad(alerta.severidad)]}`}
                        >
                            <div className={estilos.alertaHeader}>
                                <div className={estilos.alertaIcono}>
                                    <ion-icon name="warning"></ion-icon>
                                </div>
                                <div className={estilos.alertaInfo}>
                                    <div className={estilos.alertaTitulo}>{alerta.titulo}</div>
                                    <div className={estilos.alertaDetalle}>
                                        <span>{alerta.cliente_nombre}</span>
                                        {alerta.numero_contrato && (
                                            <>
                                                <span>•</span>
                                                <span>{alerta.numero_contrato}</span>
                                            </>
                                        )}
                                        {alerta.cliente_telefono && (
                                            <>
                                                <span>•</span>
                                                <span>{alerta.cliente_telefono}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className={estilos.alertaMensaje}>{alerta.mensaje}</div>
                                </div>
                                <div className={estilos.alertaBadges}>
                                    <span className={`${estilos.badge} ${estilos[obtenerColorSeveridad(alerta.severidad)]}`}>
                                        {alerta.severidad}
                                    </span>
                                    <span className={`${estilos.badge} ${estilos[alerta.estado === 'activa' ? 'info' : 'secondary']}`}>
                                        {alerta.estado}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.alertaFooter}>
                                <div className={estilos.alertaFecha}>
                                    {formatearFecha(alerta.fecha_creacion)}
                                    {alerta.asignado_a_nombre && (
                                        <> • Asignado a: {alerta.asignado_a_nombre}</>
                                    )}
                                </div>
                                <div className={estilos.alertaAcciones}>
                                    {alerta.cliente_telefono && (
                                        <>
                                            <button
                                                className={estilos.btnAccion}
                                                onClick={() => llamarCliente(alerta.cliente_telefono)}
                                                title="Llamar"
                                            >
                                                <ion-icon name="call-outline"></ion-icon>
                                            </button>
                                            <button
                                                className={estilos.btnAccion}
                                                onClick={() => enviarWhatsApp(
                                                    alerta.cliente_telefono,
                                                    `Hola ${alerta.cliente_nombre}, ${alerta.mensaje}`
                                                )}
                                                title="WhatsApp"
                                            >
                                                <ion-icon name="logo-whatsapp"></ion-icon>
                                            </button>
                                        </>
                                    )}
                                    {alerta.contrato_id && (
                                        <Link
                                            href={`/admin/contratos/ver/${alerta.contrato_id}`}
                                            className={estilos.btnAccion}
                                            title="Ver contrato"
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}





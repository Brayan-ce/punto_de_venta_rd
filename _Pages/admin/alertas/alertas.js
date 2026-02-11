"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    obtenerAlertas,
    obtenerEstadisticasAlertas,
    marcarAlertaResuelta,
    marcarAlertaVista,
    descartarAlerta,
    asignarAlerta
} from './servidor'
import { SEVERIDAD_ALERTA } from '../core/finance/estados'
import estilos from './alertas.module.css'

export default function AlertasFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [alertas, setAlertas] = useState([])
    const [estadisticas, setEstadisticas] = useState(null)
    const [filtros, setFiltros] = useState({
        estado: 'activa',
        severidad: '',
        tipo_alerta: '',
        buscar: ''
    })
    const [mostrarModalResuelta, setMostrarModalResuelta] = useState(false)
    const [mostrarModalDescartar, setMostrarModalDescartar] = useState(false)
    const [alertaSeleccionada, setAlertaSeleccionada] = useState(null)
    const [accionRealizada, setAccionRealizada] = useState('')
    const [motivoDescartar, setMotivoDescartar] = useState('')
    const [procesando, setProcesando] = useState(false)

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
        cargarDatos()
    }, [filtros])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoAlertas, resultadoEstadisticas] = await Promise.all([
                obtenerAlertas({
                    estado: filtros.estado || undefined,
                    severidad: filtros.severidad || undefined,
                    tipo_alerta: filtros.tipo_alerta || undefined,
                    buscar: filtros.buscar || undefined
                }),
                obtenerEstadisticasAlertas()
            ])

            if (resultadoAlertas.success) {
                setAlertas(resultadoAlertas.alertas)
            } else {
                alert(resultadoAlertas.mensaje || 'Error al cargar alertas')
            }

            if (resultadoEstadisticas.success) {
                setEstadisticas(resultadoEstadisticas.estadisticas)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
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

    const manejarCambioFiltro = (e) => {
        const { name, value } = e.target
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const abrirModalResuelta = (alerta) => {
        setAlertaSeleccionada(alerta)
        setAccionRealizada('')
        setMostrarModalResuelta(true)
    }

    const cerrarModalResuelta = () => {
        setMostrarModalResuelta(false)
        setAlertaSeleccionada(null)
        setAccionRealizada('')
    }

    const abrirModalDescartar = (alerta) => {
        setAlertaSeleccionada(alerta)
        setMotivoDescartar('')
        setMostrarModalDescartar(true)
    }

    const cerrarModalDescartar = () => {
        setMostrarModalDescartar(false)
        setAlertaSeleccionada(null)
        setMotivoDescartar('')
    }

    const procesarResolucion = async () => {
        if (!alertaSeleccionada) return

        setProcesando(true)
        try {
            const resultado = await marcarAlertaResuelta(
                alertaSeleccionada.id,
                accionRealizada
            )

            if (resultado.success) {
                alert(resultado.mensaje || 'Alerta marcada como resuelta')
                cerrarModalResuelta()
                cargarDatos()
            } else {
                alert(resultado.mensaje || 'Error al resolver alerta')
            }
        } catch (error) {
            console.error('Error al resolver alerta:', error)
            alert('Error al resolver alerta')
        } finally {
            setProcesando(false)
        }
    }

    const procesarDescartar = async () => {
        if (!alertaSeleccionada) return

        setProcesando(true)
        try {
            const resultado = await descartarAlerta(
                alertaSeleccionada.id,
                motivoDescartar
            )

            if (resultado.success) {
                alert(resultado.mensaje || 'Alerta descartada')
                cerrarModalDescartar()
                cargarDatos()
            } else {
                alert(resultado.mensaje || 'Error al descartar alerta')
            }
        } catch (error) {
            console.error('Error al descartar alerta:', error)
            alert('Error al descartar alerta')
        } finally {
            setProcesando(false)
        }
    }

    const marcarVista = async (id) => {
        await marcarAlertaVista(id)
        cargarDatos()
    }

    const llamarCliente = (telefono) => {
        if (telefono) {
            window.open(`tel:${telefono}`, '_self')
        }
    }

    const enviarWhatsApp = (telefono, mensaje) => {
        if (telefono) {
            const mensajeEncoded = encodeURIComponent(mensaje || 'Hola, necesito contactarte sobre tu financiamiento.')
            window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensajeEncoded}`, '_blank')
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
                    <h1 className={estilos.titulo}>Alertas de Financiamiento</h1>
                    <p className={estilos.subtitulo}>Sistema de alertas y notificaciones</p>
                </div>
                <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Dashboard
                </Link>
            </div>

            {/* Estadísticas */}
            {estadisticas && (
                <div className={estilos.estadisticas}>
                    <div className={estilos.estadisticaCard}>
                        <div className={estilos.estadisticaValor}>{estadisticas.total_alertas}</div>
                        <div className={estilos.estadisticaLabel}>Total Alertas</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={`${estilos.estadisticaValor} ${estilos.warning}`}>
                            {estadisticas.alertas_activas}
                        </div>
                        <div className={estilos.estadisticaLabel}>Activas</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={`${estilos.estadisticaValor} ${estilos.danger}`}>
                            {estadisticas.alertas_criticas}
                        </div>
                        <div className={estilos.estadisticaLabel}>Críticas</div>
                    </div>
                    <div className={estilos.estadisticaCard}>
                        <div className={`${estilos.estadisticaValor} ${estilos.success}`}>
                            {estadisticas.alertas_resueltas}
                        </div>
                        <div className={estilos.estadisticaLabel}>Resueltas</div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className={estilos.filtros}>
                <input
                    type="text"
                    placeholder="Buscar por título, cliente, contrato..."
                    className={estilos.inputBuscar}
                    name="buscar"
                    value={filtros.buscar}
                    onChange={manejarCambioFiltro}
                />
                <select
                    className={estilos.selectFiltro}
                    name="estado"
                    value={filtros.estado}
                    onChange={manejarCambioFiltro}
                >
                    <option value="">Todos los estados</option>
                    <option value="activa">Activas</option>
                    <option value="vista">Vistas</option>
                    <option value="resuelta">Resueltas</option>
                    <option value="descartada">Descartadas</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    name="severidad"
                    value={filtros.severidad}
                    onChange={manejarCambioFiltro}
                >
                    <option value="">Todas las severidades</option>
                    <option value="critica">Crítica</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
                <select
                    className={estilos.selectFiltro}
                    name="tipo_alerta"
                    value={filtros.tipo_alerta}
                    onChange={manejarCambioFiltro}
                >
                    <option value="">Todos los tipos</option>
                    <option value="vence_10_dias">Vence en 10 días</option>
                    <option value="vence_5_dias">Vence en 5 días</option>
                    <option value="vence_3_dias">Vence en 3 días</option>
                    <option value="vence_hoy">Vence hoy</option>
                    <option value="vencida">Vencida</option>
                    <option value="cliente_alto_riesgo">Cliente alto riesgo</option>
                    <option value="limite_excedido">Límite excedido</option>
                </select>
            </div>

            {/* Lista de alertas */}
            <div className={estilos.listaAlertas}>
                {alertas.length === 0 ? (
                    <div className={estilos.sinDatos}>
                        No hay alertas para mostrar
                    </div>
                ) : (
                    alertas.map((alerta) => (
                        <div
                            key={alerta.id}
                            className={`${estilos.alertaCard} ${estilos[obtenerColorSeveridad(alerta.severidad)]}`}
                        >
                            <div className={estilos.alertaHeader}>
                                <div className={estilos.alertaTitulo}>
                                    <span className={`${estilos.badge} ${estilos[obtenerColorSeveridad(alerta.severidad)]}`}>
                                        {alerta.severidad}
                                    </span>
                                    <h3>{alerta.titulo}</h3>
                                </div>
                                <div className={estilos.alertaFecha}>
                                    {formatearFecha(alerta.fecha_creacion)}
                                </div>
                            </div>

                            <div className={estilos.alertaBody}>
                                <p className={estilos.alertaMensaje}>{alerta.mensaje}</p>

                                <div className={estilos.alertaInfo}>
                                    <div className={estilos.infoItem}>
                                        <span className={estilos.infoLabel}>Tipo:</span>
                                        <span className={estilos.infoValor}>
                                            {obtenerTextoAlerta(alerta.tipo_alerta)}
                                        </span>
                                    </div>
                                    {alerta.cliente_nombre && (
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Cliente:</span>
                                            <span className={estilos.infoValor}>
                                                {alerta.cliente_nombre} {alerta.cliente_apellidos || ''}
                                            </span>
                                        </div>
                                    )}
                                    {alerta.numero_contrato && (
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Contrato:</span>
                                            <span className={estilos.infoValor}>
                                                {alerta.numero_contrato}
                                            </span>
                                        </div>
                                    )}
                                    {alerta.asignado_a_nombre && (
                                        <div className={estilos.infoItem}>
                                            <span className={estilos.infoLabel}>Asignado a:</span>
                                            <span className={estilos.infoValor}>
                                                {alerta.asignado_a_nombre}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.alertaFooter}>
                                <div className={estilos.accionesContacto}>
                                    {alerta.cliente_telefono && (
                                        <>
                                            <button
                                                className={estilos.btnContacto}
                                                onClick={() => llamarCliente(alerta.cliente_telefono)}
                                                title="Llamar cliente"
                                            >
                                                <ion-icon name="call-outline"></ion-icon>
                                            </button>
                                            <button
                                                className={estilos.btnContacto}
                                                onClick={() => enviarWhatsApp(alerta.cliente_telefono, alerta.mensaje)}
                                                title="Enviar WhatsApp"
                                            >
                                                <ion-icon name="logo-whatsapp"></ion-icon>
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className={estilos.accionesAlerta}>
                                    {alerta.contrato_id && (
                                        <Link
                                            href={`/admin/contratos/ver/${alerta.contrato_id}`}
                                            className={estilos.btnVer}
                                            title="Ver contrato"
                                        >
                                            <ion-icon name="eye-outline"></ion-icon>
                                            Ver Contrato
                                        </Link>
                                    )}
                                    {alerta.estado === 'activa' && (
                                        <>
                                            <button
                                                className={estilos.btnVista}
                                                onClick={() => marcarVista(alerta.id)}
                                                title="Marcar como vista"
                                            >
                                                <ion-icon name="checkmark-outline"></ion-icon>
                                                Vista
                                            </button>
                                            <button
                                                className={estilos.btnResolver}
                                                onClick={() => abrirModalResuelta(alerta)}
                                                title="Resolver alerta"
                                            >
                                                <ion-icon name="checkmark-done-outline"></ion-icon>
                                                Resolver
                                            </button>
                                            <button
                                                className={estilos.btnDescartar}
                                                onClick={() => abrirModalDescartar(alerta)}
                                                title="Descartar alerta"
                                            >
                                                <ion-icon name="close-outline"></ion-icon>
                                                Descartar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Resolver */}
            {mostrarModalResuelta && (
                <div className={estilos.modalOverlay} onClick={cerrarModalResuelta}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Resolver Alerta</h2>
                            <button className={estilos.btnCerrarModal} onClick={cerrarModalResuelta}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalInfo}>
                                Describa la acción realizada para resolver esta alerta:
                            </p>
                            <div className={estilos.formGroup}>
                                <label>Acción realizada *</label>
                                <textarea
                                    className={estilos.textarea}
                                    value={accionRealizada}
                                    onChange={(e) => setAccionRealizada(e.target.value)}
                                    placeholder="Ej: Cliente contactado, pago comprometido para mañana..."
                                    rows="4"
                                />
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button
                                className={estilos.btnCancelar}
                                onClick={cerrarModalResuelta}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                className={estilos.btnConfirmar}
                                onClick={procesarResolucion}
                                disabled={procesando || !accionRealizada.trim()}
                            >
                                {procesando ? 'Procesando...' : 'Resolver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Descartar */}
            {mostrarModalDescartar && (
                <div className={estilos.modalOverlay} onClick={cerrarModalDescartar}>
                    <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Descartar Alerta</h2>
                            <button className={estilos.btnCerrarModal} onClick={cerrarModalDescartar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <p className={estilos.modalAdvertencia}>
                                ¿Está seguro de descartar esta alerta?
                            </p>
                            <div className={estilos.formGroup}>
                                <label>Motivo (opcional)</label>
                                <textarea
                                    className={estilos.textarea}
                                    value={motivoDescartar}
                                    onChange={(e) => setMotivoDescartar(e.target.value)}
                                    placeholder="Razón por la cual se descarta esta alerta..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button
                                className={estilos.btnCancelar}
                                onClick={cerrarModalDescartar}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                className={estilos.btnDescartar}
                                onClick={procesarDescartar}
                                disabled={procesando}
                            >
                                {procesando ? 'Procesando...' : 'Descartar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


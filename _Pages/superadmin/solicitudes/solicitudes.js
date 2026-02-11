"use client"
import { useEffect, useState } from 'react'
import { obtenerSolicitudes, aprobarSolicitud, rechazarSolicitud } from './servidor'
import estilos from './solicitudes.module.css'

export default function SolicitudesSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [solicitudes, setSolicitudes] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('pendiente')
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [modalNotas, setModalNotas] = useState(false)
    const [notas, setNotas] = useState('')

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
        cargarSolicitudes()
    }, [filtro])

    const cargarSolicitudes = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerSolicitudes(filtro)
            if (resultado.success) {
                setSolicitudes(resultado.solicitudes)
            }
        } catch (error) {
            console.error('Error al cargar solicitudes:', error)
        } finally {
            setCargando(false)
        }
    }

    const abrirWhatsapp = (telefono, nombre) => {
        const mensaje = `Hola ${nombre}, te contacto desde IziWeek sobre tu solicitud de registro.`
        const mensajeEncoded = encodeURIComponent(mensaje)
        window.open(`https://wa.me/${telefono}?text=${mensajeEncoded}`, '_blank')
    }

    const manejarAprobar = async (solicitudId) => {
        if (!confirm('Estas seguro de aprobar esta solicitud? Se creara la empresa y el usuario administrador.')) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await aprobarSolicitud(solicitudId)
            if (resultado.success) {
                alert('Solicitud aprobada exitosamente')
                cargarSolicitudes()
                setSolicitudSeleccionada(null)
            } else {
                alert(resultado.mensaje || 'Error al aprobar solicitud')
            }
        } catch (error) {
            console.error('Error al aprobar solicitud:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarRechazar = (solicitudId) => {
        setSolicitudSeleccionada(solicitudId)
        setModalNotas(true)
        setNotas('')
    }

    const confirmarRechazo = async () => {
        if (!notas.trim()) {
            alert('Debes ingresar una razon para el rechazo')
            return
        }

        setProcesando(true)
        try {
            const resultado = await rechazarSolicitud(solicitudSeleccionada, notas)
            if (resultado.success) {
                alert('Solicitud rechazada exitosamente')
                cargarSolicitudes()
                setModalNotas(false)
                setSolicitudSeleccionada(null)
                setNotas('')
            } else {
                alert(resultado.mensaje || 'Error al rechazar solicitud')
            }
        } catch (error) {
            console.error('Error al rechazar solicitud:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Solicitudes de Registro</h1>
                    <p className={estilos.subtitulo}>Gestiona las solicitudes de nuevas empresas</p>
                </div>
            </div>

            <div className={estilos.filtros}>
                <button
                    className={`${estilos.filtroBtn} ${filtro === 'pendiente' ? estilos.activo : ''}`}
                    onClick={() => setFiltro('pendiente')}
                >
                    <ion-icon name="time-outline"></ion-icon>
                    <span>Pendientes</span>
                </button>
                <button
                    className={`${estilos.filtroBtn} ${filtro === 'aprobada' ? estilos.activo : ''}`}
                    onClick={() => setFiltro('aprobada')}
                >
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                    <span>Aprobadas</span>
                </button>
                <button
                    className={`${estilos.filtroBtn} ${filtro === 'rechazada' ? estilos.activo : ''}`}
                    onClick={() => setFiltro('rechazada')}
                >
                    <ion-icon name="close-circle-outline"></ion-icon>
                    <span>Rechazadas</span>
                </button>
                <button
                    className={`${estilos.filtroBtn} ${filtro === 'todas' ? estilos.activo : ''}`}
                    onClick={() => setFiltro('todas')}
                >
                    <ion-icon name="list-outline"></ion-icon>
                    <span>Todas</span>
                </button>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando solicitudes...</span>
                </div>
            ) : solicitudes.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="folder-open-outline"></ion-icon>
                    <span>No hay solicitudes {filtro !== 'todas' ? filtro + 's' : ''}</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {solicitudes.map((solicitud) => (
                        <div key={solicitud.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <h3 className={estilos.nombre}>{solicitud.nombre}</h3>
                                <span className={`${estilos.badge} ${estilos[tema]} ${
                                    solicitud.estado === 'pendiente' ? estilos.badgePendiente :
                                    solicitud.estado === 'aprobada' ? estilos.badgeAprobada :
                                    estilos.badgeRechazada
                                }`}>
                                    {solicitud.estado === 'pendiente' ? 'Pendiente' :
                                     solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                                </span>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.fila}>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Cedula</span>
                                        <span className={estilos.valor}>{solicitud.cedula}</span>
                                    </div>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Telefono</span>
                                        <span className={estilos.valor}>{solicitud.telefono}</span>
                                    </div>
                                </div>

                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Email</span>
                                    <span className={estilos.valor}>{solicitud.email}</span>
                                </div>

                                <div className={estilos.separador}></div>

                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Empresa</span>
                                    <span className={estilos.valor}>{solicitud.nombre_empresa}</span>
                                </div>

                                <div className={estilos.fila}>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>RNC</span>
                                        <span className={estilos.valor}>{solicitud.rnc}</span>
                                    </div>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Razon Social</span>
                                        <span className={estilos.valor}>{solicitud.razon_social}</span>
                                    </div>
                                </div>

                                {solicitud.notas && (
                                    <>
                                        <div className={estilos.separador}></div>
                                        <div className={estilos.campo}>
                                            <span className={estilos.label}>Notas</span>
                                            <span className={estilos.valor}>{solicitud.notas}</span>
                                        </div>
                                    </>
                                )}

                                <div className={estilos.fecha}>{formatearFecha(solicitud.fecha_solicitud)}</div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    className={estilos.btnWhatsapp}
                                    onClick={() => abrirWhatsapp(solicitud.telefono, solicitud.nombre)}
                                >
                                    <ion-icon name="logo-whatsapp"></ion-icon>
                                </button>

                                {solicitud.estado === 'pendiente' && (
                                    <>
                                        <button
                                            className={estilos.btnAprobar}
                                            onClick={() => manejarAprobar(solicitud.id)}
                                            disabled={procesando}
                                        >
                                            <ion-icon name="checkmark-circle-outline"></ion-icon>
                                        </button>
                                        <button
                                            className={estilos.btnRechazar}
                                            onClick={() => manejarRechazar(solicitud.id)}
                                            disabled={procesando}
                                        >
                                            <ion-icon name="close-circle-outline"></ion-icon>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalNotas && (
                <>
                    <div className={estilos.overlay} onClick={() => !procesando && setModalNotas(false)}></div>
                    <div className={`${estilos.modal} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3 className={estilos.modalTitulo}>Rechazar Solicitud</h3>
                            <button
                                className={estilos.modalCerrar}
                                onClick={() => !procesando && setModalNotas(false)}
                                disabled={procesando}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <label className={estilos.modalLabel}>Razon del rechazo</label>
                            <textarea
                                className={estilos.modalTextarea}
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Explica la razon del rechazo..."
                                rows="4"
                                disabled={procesando}
                            />
                        </div>
                        <div className={estilos.modalFooter}>
                            <button
                                className={estilos.btnCancelar}
                                onClick={() => setModalNotas(false)}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>
                            <button
                                className={estilos.btnConfirmar}
                                onClick={confirmarRechazo}
                                disabled={procesando}
                            >
                                {procesando ? 'Procesando...' : 'Confirmar Rechazo'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
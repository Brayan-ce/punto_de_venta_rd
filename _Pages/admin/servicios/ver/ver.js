"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerServicioPorId } from './servidor'
import { obtenerDatosEmpresa } from '../servidor'
import { formatearEstadoServicio, formatearTipoServicio, formatearPrioridad } from '../../core/construction/estados'
import estilos from '../servicios.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function VerServicio() {
    const router = useRouter()
    const params = useParams()
    const [servicio, setServicio] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarServicio()
        cargarEmpresa()
    }, [params.id])

    async function cargarServicio() {
        const res = await obtenerServicioPorId(params.id)
        if (res.success) {
            setServicio(res.servicio)
        } else {
            alert(res.mensaje || 'Error al cargar servicio')
            router.push('/admin/servicios')
        }
        setCargando(false)
    }

    async function cargarEmpresa() {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const formatearMoneda = (monto) => {
        const simbolo = empresa?.simbolo_moneda || 'RD$'
        const locale = empresa?.locale || 'es-DO'
        try {
            const numero = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto || 0)
            return `${simbolo} ${numero}`
        } catch {
            return `${simbolo} ${Number(monto || 0).toFixed(2)}`
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    if (!servicio) {
        return <div className={estilos.vacio}>Servicio no encontrado</div>
    }

    const estadoFormateado = formatearEstadoServicio(servicio.estado)
    const prioridadFormateada = formatearPrioridad(servicio.prioridad)

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{servicio.nombre}</h1>
                    {servicio.codigo_servicio && (
                        <span className={estilos.codigo}>{servicio.codigo_servicio}</span>
                    )}
                </div>
                <button onClick={() => router.back()} className={estilos.btnVolver}>
                    ← Volver
                </button>
            </div>

            <div className={estilos.detalle}>
                <div className={estilos.seccion}>
                    <h2>Información General</h2>
                    <div className={estilos.infoGrid}>
                        <div>
                            <label>Estado</label>
                            <span className={`${estilos.badge} ${estilos[estadoFormateado.color]}`}>
                                {estadoFormateado.texto}
                            </span>
                        </div>
                        <div>
                            <label>Prioridad</label>
                            <span className={`${estilos.badge} ${estilos[`prioridad_${prioridadFormateada.color}`]}`}>
                                {prioridadFormateada.texto}
                            </span>
                        </div>
                        <div>
                            <label>Tipo de Servicio</label>
                            <span>{formatearTipoServicio(servicio.tipo_servicio)}</span>
                        </div>
                        {servicio.ubicacion && (
                            <div>
                                <label>Ubicación</label>
                                <span>{servicio.ubicacion}</span>
                            </div>
                        )}
                        {servicio.zona && (
                            <div>
                                <label>Zona</label>
                                <span>{servicio.zona}</span>
                            </div>
                        )}
                        {servicio.fecha_solicitud && (
                            <div>
                                <label>Fecha de Solicitud</label>
                                <span>{new Date(servicio.fecha_solicitud).toLocaleDateString()}</span>
                            </div>
                        )}
                        {servicio.fecha_inicio && (
                            <div>
                                <label>Fecha de Inicio</label>
                                <span>{new Date(servicio.fecha_inicio).toLocaleDateString()}</span>
                            </div>
                        )}
                        {servicio.fecha_fin_estimada && (
                            <div>
                                <label>Fecha Fin Estimada</label>
                                <span>{new Date(servicio.fecha_fin_estimada).toLocaleDateString()}</span>
                            </div>
                        )}
                        {servicio.fecha_programada && (
                            <div>
                                <label>Fecha Programada</label>
                                <span>{new Date(servicio.fecha_programada).toLocaleDateString()}</span>
                            </div>
                        )}
                        {servicio.duracion_estimada_horas && (
                            <div>
                                <label>Duración Estimada</label>
                                <span>{servicio.duracion_estimada_horas} horas</span>
                            </div>
                        )}
                        {servicio.plantilla_nombre && (
                            <div>
                                <label>Plantilla</label>
                                <span>{servicio.codigo_plantilla ? `${servicio.codigo_plantilla} - ` : ''}{servicio.plantilla_nombre}</span>
                            </div>
                        )}
                        {servicio.presupuesto_asignado > 0 && (
                            <div>
                                <label>Presupuesto Asignado</label>
                                <span>{formatearMoneda(servicio.presupuesto_asignado)}</span>
                            </div>
                        )}
                        {servicio.costo_estimado > 0 && (
                            <div>
                                <label>Costo Estimado</label>
                                <span>{formatearMoneda(servicio.costo_estimado)}</span>
                            </div>
                        )}
                        {servicio.cliente_nombre && (
                            <div>
                                <label>Cliente</label>
                                <span>{servicio.cliente_nombre}</span>
                            </div>
                        )}
                        {servicio.obra_nombre && (
                            <div>
                                <label>Obra Asociada</label>
                                <span>{servicio.codigo_obra} - {servicio.obra_nombre}</span>
                            </div>
                        )}
                        {servicio.responsable_nombre && (
                            <div>
                                <label>Responsable</label>
                                <span>{servicio.responsable_nombre}</span>
                            </div>
                        )}
                    </div>
                </div>

                {servicio.descripcion && (
                    <div className={estilos.seccion}>
                        <h2>Descripción</h2>
                        <p>{servicio.descripcion}</p>
                    </div>
                )}

                {servicio.notas_tecnicas && (
                    <div className={estilos.seccion}>
                        <h2>Notas Técnicas</h2>
                        <p>{servicio.notas_tecnicas}</p>
                    </div>
                )}

                {servicio.recursos && servicio.recursos.length > 0 && (
                    <div className={estilos.seccion}>
                        <h2>Recursos Utilizados</h2>
                        <div className={estilos.infoGrid}>
                            {servicio.recursos.map(recurso => (
                                <div key={recurso.id}>
                                    <label>{recurso.nombre}</label>
                                    <span>{recurso.cantidad_utilizada} {recurso.unidad || 'unidades'}</span>
                                    {recurso.costo_total > 0 && (
                                        <small>{formatearMoneda(recurso.costo_total)}</small>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {servicio.eventos && servicio.eventos.length > 0 && (
                    <div className={estilos.seccion}>
                        <h2>Historial de Eventos</h2>
                        <div className={estilos.eventosLista}>
                            {servicio.eventos.map(evento => (
                                <div key={evento.id} className={estilos.eventoItem}>
                                    <div className={estilos.eventoHeader}>
                                        <span className={estilos.eventoTipo}>{evento.tipo_evento}</span>
                                        <span className={estilos.eventoFecha}>
                                            {new Date(evento.fecha_evento).toLocaleString('es-DO')}
                                        </span>
                                    </div>
                                    {evento.descripcion && (
                                        <p className={estilos.eventoDescripcion}>{evento.descripcion}</p>
                                    )}
                                    {evento.usuario_nombre && (
                                        <small className={estilos.eventoUsuario}>
                                            Registrado por: {evento.usuario_nombre}
                                        </small>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


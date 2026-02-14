"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadorSimple } from '../servidor'
import estilos from './ver.module.css'

export default function Ver({ trabajadorId, onVolver }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [trabajador, setTrabajador] = useState(null)

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
        cargarTrabajador()
    }, [trabajadorId])

    async function cargarTrabajador() {
        setCargando(true)
        const res = await obtenerTrabajadorSimple(trabajadorId)
        if (res.success) {
            setTrabajador(res.trabajador)
        } else {
            alert('Error al cargar el trabajador')
            onVolver()
        }
        setCargando(false)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando trabajador...</span>
                </div>
            </div>
        )
    }

    if (!trabajador) {
        return null
    }

    const nombreCompleto = `${trabajador.nombre} ${trabajador.apellido || ''}`.trim()

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.btnVolver} onClick={onVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
                <h1 className={estilos.titulo}>
                    <ion-icon name="person-outline"></ion-icon>
                    Detalle del Trabajador
                </h1>
            </div>

            <div className={estilos.contenido}>
                <div className={estilos.headerCard}>
                    <div className={estilos.avatarSection}>
                        {trabajador.foto_url ? (
                            <img src={trabajador.foto_url} alt={nombreCompleto} className={estilos.avatar} />
                        ) : (
                            <div className={estilos.avatarPlaceholder}>
                                <ion-icon name="person-outline"></ion-icon>
                            </div>
                        )}
                    </div>
                    
                    <div className={estilos.infoBasica}>
                        <h2>{nombreCompleto}</h2>
                        {trabajador.codigo_trabajador && (
                            <span className={estilos.codigo}>{trabajador.codigo_trabajador}</span>
                        )}
                        {trabajador.especialidad && (
                            <span className={estilos.especialidad}>
                                <ion-icon name="construct-outline"></ion-icon>
                                {trabajador.especialidad}
                            </span>
                        )}
                        {trabajador.activo ? (
                            <span className={`${estilos.badge} ${estilos.activo}`}>
                                <ion-icon name="checkmark-circle"></ion-icon>
                                Activo
                            </span>
                        ) : (
                            <span className={`${estilos.badge} ${estilos.inactivo}`}>
                                <ion-icon name="close-circle"></ion-icon>
                                Inactivo
                            </span>
                        )}
                    </div>
                </div>

                <div className={estilos.estadisticasCard}>
                    <div className={estilos.stat}>
                        <ion-icon name="wallet-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>RD$ {(trabajador.salario_diario || 0).toLocaleString()}</span>
                            <span className={estilos.statLabel}>Salario {trabajador.tipo_pago || 'Diario'}</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="business-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajador.obras_activas || 0}</span>
                            <span className={estilos.statLabel}>Obras Activas</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="calendar-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajador.total_asistencias || 0}</span>
                            <span className={estilos.statLabel}>Asistencias</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="cash-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>RD$ {(trabajador.total_pagado || 0).toLocaleString()}</span>
                            <span className={estilos.statLabel}>Total Pagado</span>
                        </div>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Informacion Personal
                    </h3>

                    <div className={estilos.detallesGrid}>
                        {trabajador.cedula && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>Cedula</span>
                                <span className={estilos.detalleValor}>{trabajador.cedula}</span>
                            </div>
                        )}
                        {trabajador.telefono && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>Telefono</span>
                                <span className={estilos.detalleValor}>{trabajador.telefono}</span>
                            </div>
                        )}
                        {trabajador.direccion && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>Direccion</span>
                                <span className={estilos.detalleValor}>{trabajador.direccion}</span>
                            </div>
                        )}
                        {trabajador.fecha_ingreso && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>Fecha de Ingreso</span>
                                <span className={estilos.detalleValor}>
                                    {new Date(trabajador.fecha_ingreso).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {(trabajador.contacto_emergencia || trabajador.telefono_emergencia) && (
                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="call-outline"></ion-icon>
                            Contacto de Emergencia
                        </h3>

                        <div className={estilos.detallesGrid}>
                            {trabajador.contacto_emergencia && (
                                <div className={estilos.detalle}>
                                    <span className={estilos.detalleLabel}>Nombre</span>
                                    <span className={estilos.detalleValor}>{trabajador.contacto_emergencia}</span>
                                </div>
                            )}
                            {trabajador.telefono_emergencia && (
                                <div className={estilos.detalle}>
                                    <span className={estilos.detalleLabel}>Telefono</span>
                                    <span className={estilos.detalleValor}>{trabajador.telefono_emergencia}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {trabajador.notas && (
                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="document-text-outline"></ion-icon>
                            Notas
                        </h3>

                        <div className={estilos.notasContenido}>
                            {trabajador.notas}
                        </div>
                    </div>
                )}

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="time-outline"></ion-icon>
                        Informacion del Sistema
                    </h3>

                    <div className={estilos.detallesGrid}>
                        <div className={estilos.detalle}>
                            <span className={estilos.detalleLabel}>Fecha de Registro</span>
                            <span className={estilos.detalleValor}>
                                {new Date(trabajador.fecha_creacion).toLocaleString()}
                            </span>
                        </div>
                        <div className={estilos.detalle}>
                            <span className={estilos.detalleLabel}>Ultima Actualizacion</span>
                            <span className={estilos.detalleValor}>
                                {new Date(trabajador.fecha_actualizacion).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
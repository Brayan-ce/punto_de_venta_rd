"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadorSimple } from '../servidor'
import estilos from './ver.module.css'
import { useLanguage } from '@/_Pages/admin/i18n'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Ver({ trabajadorId, onVolver, moneda }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [trabajador, setTrabajador] = useState(null)
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
        cargarTrabajador()
    }, [trabajadorId])

    async function cargarTrabajador() {
        setCargando(true)
        const res = await obtenerTrabajadorSimple(trabajadorId)
        if (res.success) {
            setTrabajador(res.trabajador)
        } else {
            alert(tr('Error al cargar el trabajador', 'Error loading worker'))
            onVolver()
        }
        setCargando(false)
    }

    if (cargando) {
        return <LoadingScreen />
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
                    {tr('Volver', 'Back')}
                </button>
                <h1 className={estilos.titulo}>
                    <ion-icon name="person-outline"></ion-icon>
                    {tr('Detalle del Trabajador', 'Worker Detail')}
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
                                {tr('Activo', 'Active')}
                            </span>
                        ) : (
                            <span className={`${estilos.badge} ${estilos.inactivo}`}>
                                <ion-icon name="close-circle"></ion-icon>
                                {tr('Inactivo', 'Inactive')}
                            </span>
                        )}
                    </div>
                </div>

                <div className={estilos.estadisticasCard}>
                    <div className={estilos.stat}>
                        <ion-icon name="wallet-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{moneda} {(trabajador.salario_diario || 0).toLocaleString()}</span>
                            <span className={estilos.statLabel}>{tr('Salario', 'Salary')} {trabajador.tipo_pago || tr('Diario', 'Daily')}</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="business-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajador.obras_activas || 0}</span>
                            <span className={estilos.statLabel}>{tr('Obras Activas', 'Active Projects')}</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="calendar-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{trabajador.total_asistencias || 0}</span>
                            <span className={estilos.statLabel}>{tr('Asistencias', 'Attendances')}</span>
                        </div>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="cash-outline"></ion-icon>
                        <div>
                            <span className={estilos.statValor}>{moneda} {(trabajador.total_pagado || 0).toLocaleString()}</span>
                            <span className={estilos.statLabel}>{tr('Total Pagado', 'Total Paid')}</span>
                        </div>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        {tr('Informacion Personal', 'Personal Information')}
                    </h3>

                    <div className={estilos.detallesGrid}>
                        {trabajador.cedula && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>{tr('Cedula', 'ID')}</span>
                                <span className={estilos.detalleValor}>{trabajador.cedula}</span>
                            </div>
                        )}
                        {trabajador.telefono && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>{tr('Telefono', 'Phone')}</span>
                                <span className={estilos.detalleValor}>{trabajador.telefono}</span>
                            </div>
                        )}
                        {trabajador.direccion && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>{tr('Direccion', 'Address')}</span>
                                <span className={estilos.detalleValor}>{trabajador.direccion}</span>
                            </div>
                        )}
                        {trabajador.fecha_ingreso && (
                            <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>{tr('Fecha de Ingreso', 'Start Date')}</span>
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
                            {tr('Contacto de Emergencia', 'Emergency Contact')}
                        </h3>

                        <div className={estilos.detallesGrid}>
                            {trabajador.contacto_emergencia && (
                                <div className={estilos.detalle}>
                                    <span className={estilos.detalleLabel}>{tr('Nombre', 'Name')}</span>
                                    <span className={estilos.detalleValor}>{trabajador.contacto_emergencia}</span>
                                </div>
                            )}
                            {trabajador.telefono_emergencia && (
                                <div className={estilos.detalle}>
                                <span className={estilos.detalleLabel}>{tr('Telefono', 'Phone')}</span>
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
                            {tr('Notas', 'Notes')}
                        </h3>

                        <div className={estilos.notasContenido}>
                            {trabajador.notas}
                        </div>
                    </div>
                )}

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="time-outline"></ion-icon>
                        {tr('Informacion del Sistema', 'System Information')}
                    </h3>

                    <div className={estilos.detallesGrid}>
                        <div className={estilos.detalle}>
                            <span className={estilos.detalleLabel}>{tr('Fecha de Registro', 'Registration Date')}</span>
                            <span className={estilos.detalleValor}>
                                {new Date(trabajador.fecha_creacion).toLocaleString()}
                            </span>
                        </div>
                        <div className={estilos.detalle}>
                            <span className={estilos.detalleLabel}>{tr('Ultima Actualizacion', 'Last Update')}</span>
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
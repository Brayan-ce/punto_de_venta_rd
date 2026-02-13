"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerBitacoraPorId } from '../servidor'
import { formatearTipoDestino, formatearClima } from '../../core/construction/bitacora'
import estilos from './ver.module.css'

export default function VerBitacora({ id }) {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [bitacora, setBitacora] = useState(null)
    const [trabajadores, setTrabajadores] = useState([])
    const [fotos, setFotos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [fotoExpandida, setFotoExpandida] = useState(null)

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
        cargarBitacora()
    }, [id])

    async function cargarBitacora() {
        setCargando(true)
        const res = await obtenerBitacoraPorId(id)
        
        if (res.success) {
            setBitacora(res.bitacora)
            setTrabajadores(res.trabajadores || [])
            setFotos(res.fotos || [])
        } else {
            alert(res.mensaje || 'Error al cargar la bitácora')
            router.push('/admin/bitacora')
        }
        setCargando(false)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>Cargando bitácora...</span>
                </div>
            </div>
        )
    }

    if (!bitacora) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.vacio}>
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <span>Bitácora no encontrada</span>
                </div>
            </div>
        )
    }

    const tipoDestino = formatearTipoDestino(bitacora.tipo_destino)
    const clima = bitacora.condiciones_clima ? formatearClima(bitacora.condiciones_clima) : null
    const fecha = new Date(bitacora.fecha_bitacora)
    const fechaFormateada = fecha.toLocaleDateString('es-DO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.badges}>
                        <span className={`${estilos.badge} ${estilos[bitacora.tipo_destino]}`}>
                            <span className={estilos.badgeEmoji}>{tipoDestino.emoji}</span>
                            {tipoDestino.texto}
                        </span>
                        {clima && (
                            <span className={estilos.badgeClima}>
                                <span className={estilos.badgeEmoji}>{clima.emoji}</span>
                                {clima.texto}
                            </span>
                        )}
                    </div>
                    <h1 className={estilos.titulo}>Bitácora del Día</h1>
                    <p className={estilos.fecha}>
                        <ion-icon name="calendar-outline"></ion-icon>
                        {fechaFormateada}
                    </p>
                </div>
                <button 
                    className={estilos.btnVolver} 
                    onClick={() => router.back()}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <section className={estilos.seccionDestino}>
                <div className={estilos.destinoHeader}>
                    <ion-icon name="business-outline"></ion-icon>
                    <div>
                        <span className={estilos.destinoCodigo}>{bitacora.destino_codigo}</span>
                        <h2 className={estilos.destinoNombre}>{bitacora.destino_nombre}</h2>
                        {bitacora.destino_ubicacion && (
                            <div className={estilos.destinoUbicacion}>
                                <ion-icon name="location-outline"></ion-icon>
                                <span>{bitacora.destino_ubicacion}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className={estilos.seccion}>
                <h3 className={estilos.seccionTitulo}>
                    <ion-icon name="information-circle-outline"></ion-icon>
                    <span>Información General</span>
                </h3>
                <div className={estilos.gridInfo}>
                    {bitacora.zona_sitio && (
                        <div className={estilos.infoItem}>
                            <div className={estilos.infoIcono}>
                                <ion-icon name="location-outline"></ion-icon>
                            </div>
                            <div>
                                <label>Zona / Sitio</label>
                                <p>{bitacora.zona_sitio}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className={estilos.infoItem}>
                        <div className={estilos.infoIcono}>
                            <ion-icon name="person-outline"></ion-icon>
                        </div>
                        <div>
                            <label>Registrado por</label>
                            <p>{bitacora.usuario_nombre || 'Usuario'}</p>
                        </div>
                    </div>

                    <div className={estilos.infoItem}>
                        <div className={estilos.infoIcono}>
                            <ion-icon name="time-outline"></ion-icon>
                        </div>
                        <div>
                            <label>Fecha de registro</label>
                            <p>{new Date(bitacora.fecha_creacion).toLocaleString('es-DO')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {trabajadores.length > 0 && (
                <section className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        <span>Personal Presente ({trabajadores.length})</span>
                    </h3>
                    <div className={estilos.listaTrabajadores}>
                        {trabajadores.map(trabajador => (
                            <div key={trabajador.id} className={estilos.trabajadorCard}>
                                <div className={estilos.trabajadorAvatar}>
                                    {trabajador.nombre.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={estilos.trabajadorInfo}>
                                    <strong>
                                        {trabajador.nombre} {trabajador.apellidos || ''}
                                    </strong>
                                    <span>{trabajador.rol_especialidad}</span>
                                </div>
                                <div className={estilos.trabajadorPresente}>
                                    <ion-icon name="checkmark-circle"></ion-icon>
                                    <span>Presente</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className={estilos.seccion}>
                <h3 className={estilos.seccionTitulo}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>Trabajo Realizado</span>
                </h3>
                <div className={estilos.trabajoRealizado}>
                    <p>{bitacora.trabajo_realizado}</p>
                </div>
            </section>

            {bitacora.observaciones && (
                <section className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        <span>Observaciones</span>
                    </h3>
                    <div className={estilos.observaciones}>
                        <p>{bitacora.observaciones}</p>
                    </div>
                </section>
            )}

            {fotos.length > 0 && (
                <section className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="camera-outline"></ion-icon>
                        <span>Evidencia Fotográfica ({fotos.length})</span>
                    </h3>
                    <div className={estilos.galeriaFotos}>
                        {fotos.map(foto => (
                            <div 
                                key={foto.id} 
                                className={estilos.fotoItem}
                                onClick={() => setFotoExpandida(foto)}
                            >
                                <img 
                                    src={foto.url_foto} 
                                    alt={foto.descripcion || `Foto ${foto.orden}`}
                                />
                                {foto.descripcion && (
                                    <div className={estilos.fotoDescripcion}>
                                        {foto.descripcion}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {fotoExpandida && (
                <div 
                    className={estilos.modalFoto}
                    onClick={() => setFotoExpandida(null)}
                >
                    <div className={estilos.modalContenido}>
                        <button 
                            className={estilos.btnCerrarModal}
                            onClick={() => setFotoExpandida(null)}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        <img 
                            src={fotoExpandida.url_foto} 
                            alt={fotoExpandida.descripcion || 'Foto'}
                        />
                        {fotoExpandida.descripcion && (
                            <p className={estilos.modalDescripcion}>
                                {fotoExpandida.descripcion}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className={estilos.footer}>
                <div className={estilos.footerItem}>
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>Creado: {new Date(bitacora.fecha_creacion).toLocaleString('es-DO')}</span>
                </div>
                {bitacora.fecha_actualizacion && bitacora.fecha_actualizacion !== bitacora.fecha_creacion && (
                    <div className={estilos.footerItem}>
                        <ion-icon name="refresh-outline"></ion-icon>
                        <span>Actualizado: {new Date(bitacora.fecha_actualizacion).toLocaleString('es-DO')}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
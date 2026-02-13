"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerBitacoras, obtenerObrasActivas, obtenerServiciosActivos } from './servidor'
import { formatearTipoDestino, generarResumenTrabajo } from '../core/construction/bitacora'
import estilos from './bitacora.module.css'

export default function BitacoraAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [obras, setObras] = useState([])
    const [servicios, setServicios] = useState([])
    const [bitacoras, setBitacoras] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtros, setFiltros] = useState({
        tipo_destino: '',
        destino_id: '',
        fecha_desde: '',
        fecha_hasta: '',
        busqueda: ''
    })

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
        cargarObrasYServicios()
    }, [])

    useEffect(() => {
        cargarBitacoras()
    }, [filtros])

    async function cargarObrasYServicios() {
        const [resObras, resServicios] = await Promise.all([
            obtenerObrasActivas(),
            obtenerServiciosActivos()
        ])
        
        if (resObras.success) setObras(resObras.obras)
        if (resServicios.success) setServicios(resServicios.servicios)
    }

    async function cargarBitacoras() {
        setCargando(true)
        const res = await obtenerBitacoras(filtros)
        if (res.success) {
            setBitacoras(res.bitacoras)
        }
        setCargando(false)
    }

    function handleFiltroTipoDestino(tipo) {
        setFiltros({
            ...filtros,
            tipo_destino: tipo,
            destino_id: ''
        })
    }

    function handleLimpiarFiltros() {
        setFiltros({
            tipo_destino: '',
            destino_id: '',
            fecha_desde: '',
            fecha_hasta: '',
            busqueda: ''
        })
    }

    const destinosDisponibles = filtros.tipo_destino === 'obra' 
        ? obras 
        : filtros.tipo_destino === 'servicio' 
        ? servicios 
        : []

    const hayFiltrosActivos = filtros.tipo_destino || filtros.destino_id || 
                              filtros.fecha_desde || filtros.fecha_hasta || 
                              filtros.busqueda

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Bitácoras Diarias</h1>
                    <p className={estilos.subtitulo}>
                        Registro de actividades y personal en campo
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo} 
                    onClick={() => router.push('/admin/bitacora/nuevo')}
                >
                    <ion-icon name="add-outline"></ion-icon>
                    <span>Nueva Bitácora</span>
                </button>
            </div>

            <div className={estilos.seccionFiltros}>
                <div className={estilos.grupoTipos}>
                    <button
                        className={`${estilos.btnTipo} ${!filtros.tipo_destino ? estilos.activo : ''}`}
                        onClick={() => handleFiltroTipoDestino('')}
                    >
                        <ion-icon name="apps-outline"></ion-icon>
                        <span>Todas</span>
                    </button>
                    <button
                        className={`${estilos.btnTipo} ${filtros.tipo_destino === 'obra' ? estilos.activo : ''}`}
                        onClick={() => handleFiltroTipoDestino('obra')}
                    >
                        <span className={estilos.emoji}>🏗️</span>
                        <span>Obras</span>
                    </button>
                    <button
                        className={`${estilos.btnTipo} ${filtros.tipo_destino === 'servicio' ? estilos.activo : ''}`}
                        onClick={() => handleFiltroTipoDestino('servicio')}
                    >
                        <span className={estilos.emoji}>⚡</span>
                        <span>Servicios</span>
                    </button>
                </div>

                <div className={estilos.filtrosGrid}>
                    {filtros.tipo_destino && (
                        <div className={estilos.grupo}>
                            <label>
                                {filtros.tipo_destino === 'obra' ? 'Obra' : 'Servicio'}
                            </label>
                            <select 
                                value={filtros.destino_id}
                                onChange={(e) => setFiltros({ ...filtros, destino_id: e.target.value })}
                            >
                                <option value="">Todos</option>
                                {destinosDisponibles.map(destino => (
                                    <option key={destino.id} value={destino.id}>
                                        {filtros.tipo_destino === 'obra' 
                                            ? `${destino.codigo_obra} - ${destino.nombre}`
                                            : `${destino.codigo_servicio} - ${destino.nombre}`
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={estilos.grupo}>
                        <label>Fecha Desde</label>
                        <input
                            type="date"
                            value={filtros.fecha_desde}
                            onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                        />
                    </div>

                    <div className={estilos.grupo}>
                        <label>Fecha Hasta</label>
                        <input
                            type="date"
                            value={filtros.fecha_hasta}
                            onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                        />
                    </div>

                    <div className={estilos.grupo}>
                        <label>Buscar</label>
                        <div className={estilos.inputBusqueda}>
                            <ion-icon name="search-outline"></ion-icon>
                            <input
                                type="text"
                                placeholder="Buscar en trabajo realizado, zona..."
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {hayFiltrosActivos && (
                    <button 
                        className={estilos.btnLimpiar}
                        onClick={handleLimpiarFiltros}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Limpiar Filtros</span>
                    </button>
                )}
            </div>

            {bitacoras.length > 0 && (
                <div className={estilos.estadisticas}>
                    <div className={estilos.stat}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        <span>{bitacoras.length} {bitacoras.length === 1 ? 'bitácora' : 'bitácoras'}</span>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="people-outline"></ion-icon>
                        <span>
                            {bitacoras.reduce((sum, b) => sum + (parseInt(b.num_trabajadores) || 0), 0)} trabajadores
                        </span>
                    </div>
                    <div className={estilos.stat}>
                        <ion-icon name="camera-outline"></ion-icon>
                        <span>
                            {bitacoras.reduce((sum, b) => sum + (parseInt(b.num_fotos) || 0), 0)} fotos
                        </span>
                    </div>
                </div>
            )}

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>Cargando bitácoras...</span>
                </div>
            ) : bitacoras.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="document-text-outline"></ion-icon>
                    <p>
                        {hayFiltrosActivos 
                            ? 'No se encontraron bitácoras con los filtros aplicados'
                            : 'No hay bitácoras registradas'
                        }
                    </p>
                    {!hayFiltrosActivos && (
                        <button 
                            className={estilos.btnVacioAccion}
                            onClick={() => router.push('/admin/bitacora/nuevo')}
                        >
                            Crear primera bitácora
                        </button>
                    )}
                </div>
            ) : (
                <div className={estilos.lista}>
                    {bitacoras.map(bitacora => {
                        const tipoDestino = formatearTipoDestino(bitacora.tipo_destino)
                        const fecha = new Date(bitacora.fecha_bitacora)
                        const fechaFormateada = fecha.toLocaleDateString('es-DO', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })

                        return (
                            <div key={bitacora.id} className={estilos.tarjeta}>
                                <div className={estilos.tarjetaHeader}>
                                    <div className={estilos.tarjetaTitulo}>
                                        <h3>{fechaFormateada}</h3>
                                        <div className={estilos.badges}>
                                            <span className={`${estilos.badge} ${estilos[bitacora.tipo_destino]}`}>
                                                <span className={estilos.badgeEmoji}>{tipoDestino.emoji}</span>
                                                {tipoDestino.texto}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        className={estilos.btnVer}
                                        onClick={() => router.push(`/admin/bitacora/ver/${bitacora.id}`)}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        <span>Ver Detalle</span>
                                    </button>
                                </div>

                                <div className={estilos.tarjetaBody}>
                                    <div className={estilos.itemDestino}>
                                        <ion-icon name="business-outline"></ion-icon>
                                        <div>
                                            <span className={estilos.codigo}>{bitacora.destino_codigo}</span>
                                            <span className={estilos.nombre}>{bitacora.destino_nombre}</span>
                                        </div>
                                    </div>

                                    {bitacora.zona_sitio && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="location-outline"></ion-icon>
                                            <span>Zona: {bitacora.zona_sitio}</span>
                                        </div>
                                    )}

                                    {bitacora.num_trabajadores > 0 && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="people-outline"></ion-icon>
                                            <span>
                                                {bitacora.num_trabajadores} {bitacora.num_trabajadores === 1 ? 'trabajador' : 'trabajadores'}
                                            </span>
                                        </div>
                                    )}

                                    {bitacora.num_fotos > 0 && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="camera-outline"></ion-icon>
                                            <span>{bitacora.num_fotos} {bitacora.num_fotos === 1 ? 'foto' : 'fotos'}</span>
                                        </div>
                                    )}

                                    {bitacora.condiciones_clima && (
                                        <div className={estilos.itemInfo}>
                                            <ion-icon name="partly-sunny-outline"></ion-icon>
                                            <span>{bitacora.condiciones_clima}</span>
                                        </div>
                                    )}

                                    {bitacora.trabajo_realizado && (
                                        <div className={estilos.resumen}>
                                            <p>{generarResumenTrabajo(bitacora.trabajo_realizado, 200)}</p>
                                        </div>
                                    )}

                                    {bitacora.usuario_nombre && (
                                        <div className={estilos.itemFooter}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>Registrado por: {bitacora.usuario_nombre}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
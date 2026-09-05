"use client"
import { useEffect, useState } from 'react'
import { obtenerEstadisticasDashboard } from './servidor'
import estilos from './dashboard.module.css'

export default function DashboardSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [estadisticas, setEstadisticas] = useState(null)
    const [cargando, setCargando] = useState(true)

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
        const cargarEstadisticas = async () => {
            try {
                const resultado = await obtenerEstadisticasDashboard()
                if (resultado.success) {
                    setEstadisticas(resultado.estadisticas)
                }
            } catch (error) {
                console.error('Error al cargar estadisticas:', error)
            } finally {
                setCargando(false)
            }
        }
        cargarEstadisticas()
    }, [])

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando estadisticas...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Dashboard</h1>
                    <p className={estilos.subtitulo}>Bienvenido al panel de control del sistema</p>
                </div>
            </div>

            <div className={estilos.tarjetas}>
                <div className={`${estilos.tarjeta} ${estilos[tema]}`}>
                    <div className={estilos.tarjetaIcono} style={{ background: '#0ea5e9' }}>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.tarjetaContenido}>
                        <span className={estilos.tarjetaLabel}>Total Empresas</span>
                        <span className={estilos.tarjetaValor}>{estadisticas?.totalEmpresas || 0}</span>
                    </div>
                </div>

                <div className={`${estilos.tarjeta} ${estilos[tema]}`}>
                    <div className={estilos.tarjetaIcono} style={{ background: '#10b981' }}>
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                    </div>
                    <div className={estilos.tarjetaContenido}>
                        <span className={estilos.tarjetaLabel}>Empresas Activas</span>
                        <span className={estilos.tarjetaValor}>{estadisticas?.empresasActivas || 0}</span>
                    </div>
                </div>

                <div className={`${estilos.tarjeta} ${estilos[tema]}`}>
                    <div className={estilos.tarjetaIcono} style={{ background: '#f59e0b' }}>
                        <ion-icon name="document-text-outline"></ion-icon>
                    </div>
                    <div className={estilos.tarjetaContenido}>
                        <span className={estilos.tarjetaLabel}>Solicitudes Pendientes</span>
                        <span className={estilos.tarjetaValor}>{estadisticas?.solicitudesPendientes || 0}</span>
                    </div>
                </div>

                <div className={`${estilos.tarjeta} ${estilos[tema]}`}>
                    <div className={estilos.tarjetaIcono} style={{ background: '#8b5cf6' }}>
                        <ion-icon name="people-outline"></ion-icon>
                    </div>
                    <div className={estilos.tarjetaContenido}>
                        <span className={estilos.tarjetaLabel}>Total Usuarios</span>
                        <span className={estilos.tarjetaValor}>{estadisticas?.totalUsuarios || 0}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={`${estilos.card} ${estilos[tema]}`}>
                    <div className={estilos.cardHeader}>
                        <h2 className={estilos.cardTitulo}>Ultimas Empresas Registradas</h2>
                        <ion-icon name="business-outline"></ion-icon>
                    </div>
                    <div className={estilos.cardContenido}>
                        {estadisticas?.ultimasEmpresas && estadisticas.ultimasEmpresas.length > 0 ? (
                            <div className={estilos.lista}>
                                {estadisticas.ultimasEmpresas.map((empresa) => (
                                    <div key={empresa.id} className={estilos.listaItem}>
                                        <div className={estilos.listaItemIcono}>
                                            <ion-icon name="business"></ion-icon>
                                        </div>
                                        <div className={estilos.listaItemInfo}>
                                            <span className={estilos.listaItemNombre}>{empresa.nombre_empresa}</span>
                                            <span className={estilos.listaItemDetalle}>RNC: {empresa.rnc}</span>
                                        </div>
                                        <div className={`${estilos.badge} ${empresa.activo ? estilos.badgeActivo : estilos.badgeInactivo}`}>
                                            {empresa.activo ? 'Activa' : 'Inactiva'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={estilos.vacio}>
                                <ion-icon name="folder-open-outline"></ion-icon>
                                <span>No hay empresas registradas</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`${estilos.card} ${estilos[tema]}`}>
                    <div className={estilos.cardHeader}>
                        <h2 className={estilos.cardTitulo}>Solicitudes Recientes</h2>
                        <ion-icon name="document-text-outline"></ion-icon>
                    </div>
                    <div className={estilos.cardContenido}>
                        {estadisticas?.solicitudesRecientes && estadisticas.solicitudesRecientes.length > 0 ? (
                            <div className={estilos.lista}>
                                {estadisticas.solicitudesRecientes.map((solicitud) => (
                                    <div key={solicitud.id} className={estilos.listaItem}>
                                        <div className={estilos.listaItemIcono}>
                                            <ion-icon name="person"></ion-icon>
                                        </div>
                                        <div className={estilos.listaItemInfo}>
                                            <span className={estilos.listaItemNombre}>{solicitud.nombre}</span>
                                            <span className={estilos.listaItemDetalle}>{solicitud.nombre_empresa}</span>
                                        </div>
                                        <div className={`${estilos.badge} ${
                                            solicitud.estado === 'pendiente' ? estilos.badgePendiente :
                                            solicitud.estado === 'aprobada' ? estilos.badgeAprobada :
                                            estilos.badgeRechazada
                                        }`}>
                                            {solicitud.estado === 'pendiente' ? 'Pendiente' :
                                             solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={estilos.vacio}>
                                <ion-icon name="folder-open-outline"></ion-icon>
                                <span>No hay solicitudes recientes</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${estilos.card} ${estilos[tema]}`}>
                <div className={estilos.cardHeader}>
                    <h2 className={estilos.cardTitulo}>Distribucion de Usuarios</h2>
                    <ion-icon name="people-outline"></ion-icon>
                </div>
                <div className={estilos.cardContenido}>
                    <div className={estilos.distribucion}>
                        <div className={estilos.distribucionItem}>
                            <div className={estilos.distribucionInfo}>
                                <span className={estilos.distribucionLabel}>Super Administradores</span>
                                <span className={estilos.distribucionValor}>{estadisticas?.usuariosSuperAdmin || 0}</span>
                            </div>
                            <div className={estilos.distribucionBarra}>
                                <div 
                                    className={estilos.distribucionBarraProgreso}
                                    style={{ 
                                        width: `${estadisticas?.totalUsuarios > 0 ? (estadisticas.usuariosSuperAdmin / estadisticas.totalUsuarios * 100) : 0}%`,
                                        background: '#8b5cf6'
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className={estilos.distribucionItem}>
                            <div className={estilos.distribucionInfo}>
                                <span className={estilos.distribucionLabel}>Administradores</span>
                                <span className={estilos.distribucionValor}>{estadisticas?.usuariosAdmin || 0}</span>
                            </div>
                            <div className={estilos.distribucionBarra}>
                                <div 
                                    className={estilos.distribucionBarraProgreso}
                                    style={{ 
                                        width: `${estadisticas?.totalUsuarios > 0 ? (estadisticas.usuariosAdmin / estadisticas.totalUsuarios * 100) : 0}%`,
                                        background: '#0ea5e9'
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className={estilos.distribucionItem}>
                            <div className={estilos.distribucionInfo}>
                                <span className={estilos.distribucionLabel}>Vendedores</span>
                                <span className={estilos.distribucionValor}>{estadisticas?.usuariosVendedor || 0}</span>
                            </div>
                            <div className={estilos.distribucionBarra}>
                                <div 
                                    className={estilos.distribucionBarraProgreso}
                                    style={{ 
                                        width: `${estadisticas?.totalUsuarios > 0 ? (estadisticas.usuariosVendedor / estadisticas.totalUsuarios * 100) : 0}%`,
                                        background: '#10b981'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
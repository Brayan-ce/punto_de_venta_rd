"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerPlanesFinanciamiento } from '../../planes/servidor'
import estilos from './planes.module.css'

export default function PlanesFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [planes, setPlanes] = useState([])
    const [filtroActivo, setFiltroActivo] = useState('')
    const [buscar, setBuscar] = useState('')

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
        cargarPlanes()
    }, [filtroActivo, buscar])

    const cargarPlanes = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerPlanesFinanciamiento({
                activo: filtroActivo === 'activo' ? true : filtroActivo === 'inactivo' ? false : undefined,
                buscar: buscar || undefined
            })

            if (resultado.success) {
                setPlanes(resultado.planes)
            } else {
                alert(resultado.mensaje || 'Error al cargar planes')
            }
        } catch (error) {
            console.error('Error al cargar planes:', error)
            alert('Error al cargar planes')
        } finally {
            setCargando(false)
        }
    }

    const navegarANuevo = () => {
        router.push('/admin/planes/nuevo')
    }

    const navegarAEditar = (planId) => {
        router.push(`/admin/planes/editar/${planId}`)
    }

    const navegarAVer = (planId) => {
        router.push(`/admin/planes/ver/${planId}`)
    }
    const planesFiltrados = planes.filter(plan => {
        if (filtroActivo === 'activo' && plan.activo !== 1) return false
        if (filtroActivo === 'inactivo' && plan.activo !== 0) return false
        if (buscar && !plan.nombre.toLowerCase().includes(buscar.toLowerCase()) &&
            !plan.codigo.toLowerCase().includes(buscar.toLowerCase())) return false
        return true
    })

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando planes...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.tituloArea}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="card-outline"></ion-icon>
                        Planes de Financiamiento
                    </h1>
                    <p className={estilos.subtitulo}>Gestiona los planes disponibles para financiamiento</p>
                </div>
                <button className={estilos.btnPrimario} onClick={navegarANuevo}>
                    <ion-icon name="add-outline"></ion-icon>
                    Nuevo Plan
                </button>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className={estilos.inputBuscar}
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />
                <select
                    className={estilos.selectFiltro}
                    value={filtroActivo}
                    onChange={(e) => setFiltroActivo(e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                </select>
            </div>

            {/* Lista de planes */}
            <div className={estilos.listaPlanes}>
                {planesFiltrados.length === 0 ? (
                    <div className={estilos.sinDatos}>
                        <ion-icon name="document-outline"></ion-icon>
                        <p>No hay planes para mostrar</p>
                    </div>
                ) : (
                    planesFiltrados.map(plan => (
                        <div key={plan.id} className={`${estilos.planCard} ${plan.activo === 0 ? estilos.inactivo : ''}`}>
                            <div className={estilos.planHeader}>
                                <div>
                                    <h3 className={estilos.planNombre}>{plan.nombre}</h3>
                                    <span className={estilos.planCodigo}>{plan.codigo}</span>
                                </div>
                                <div className={estilos.planBadges}>
                                    {plan.activo === 1 ? (
                                        <span className={`${estilos.badge} ${estilos.success}`}>Activo</span>
                                    ) : (
                                        <span className={`${estilos.badge} ${estilos.secondary}`}>Inactivo</span>
                                    )}
                                </div>
                            </div>

                            {plan.descripcion && (
                                <p className={estilos.planDescripcion}>{plan.descripcion}</p>
                            )}

                            <div className={estilos.planDetalles}>
                                <div className={estilos.detalleItem}>
                                    <span className={estilos.detalleLabel}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        Plazo
                                    </span>
                                    <span className={estilos.detalleValor}>{plan.plazo_meses} meses</span>
                                </div>
                                <div className={estilos.detalleItem}>
                                    <span className={estilos.detalleLabel}>
                                        <ion-icon name="trending-up-outline"></ion-icon>
                                        Tasa Anual
                                    </span>
                                    <span className={estilos.detalleValor}>{plan.tasa_interes_anual}%</span>
                                </div>
                                <div className={estilos.detalleItem}>
                                    <span className={estilos.detalleLabel}>
                                        <ion-icon name="cash-outline"></ion-icon>
                                        Inicial Mínimo
                                    </span>
                                    <span className={estilos.detalleValor}>{plan.pago_inicial_minimo_pct}%</span>
                                </div>
                                <div className={estilos.detalleItem}>
                                    <span className={estilos.detalleLabel}>
                                        <ion-icon name="alert-circle-outline"></ion-icon>
                                        Mora
                                    </span>
                                    <span className={estilos.detalleValor}>{plan.penalidad_mora_pct}%</span>
                                </div>
                                <div className={estilos.detalleItem}>
                                    <span className={estilos.detalleLabel}>
                                        <ion-icon name="time-outline"></ion-icon>
                                        Días Gracia
                                    </span>
                                    <span className={estilos.detalleValor}>{plan.dias_gracia}</span>
                                </div>
                            </div>

                            <div className={estilos.planAcciones}>
                                <button
                                    className={estilos.btnVer}
                                    onClick={() => navegarAVer(plan.id)}
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                    Ver
                                </button>
                                <button
                                    className={estilos.btnEditar}
                                    onClick={() => navegarAEditar(plan.id)}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    )
}





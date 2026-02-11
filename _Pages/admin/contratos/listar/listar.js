"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { obtenerContratos } from '../servidor'
import estilos from './listar.module.css'

export default function ListarContratos() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [contratos, setContratos] = useState([])
    const [paginacion, setPaginacion] = useState({
        pagina: 1,
        limite: 20,
        total: 0,
        totalPaginas: 1
    })
    const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || '')
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
        cargarContratos()
    }, [paginacion.pagina, filtroEstado, buscar])

    const cargarContratos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerContratos({
                pagina: paginacion.pagina,
                limite: paginacion.limite,
                estado: filtroEstado || undefined,
                buscar: buscar || undefined
            })

            if (resultado.success) {
                setContratos(resultado.contratos)
                setPaginacion(resultado.paginacion)
            } else {
                console.error(resultado.mensaje || 'Error al cargar contratos')
            }
        } catch (error) {
            console.error('Error al cargar contratos:', error)
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'
        return new Date(fecha).toLocaleDateString('es-DO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const obtenerColorEstado = (estado) => {
        const colores = {
            activo: 'success',
            pagado: 'info',
            incumplido: 'danger',
            reestructurado: 'warning',
            cancelado: 'secondary'
        }
        return colores[estado] || 'secondary'
    }

    const cambiarPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }))
    }

    const calcularProgreso = (pagadas, total) => {
        if (!total) return 0
        return ((pagadas / total) * 100).toFixed(0)
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* Header */}
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <div className={estilos.headerIcono}>
                        <Image 
                            src="/financias/bank-statement.svg" 
                            alt="Contratos" 
                            width={32} 
                            height={32}
                        />
                    </div>
                    <div>
                        <h1 className={estilos.titulo}>Listado de Contratos</h1>
                        <p className={estilos.subtitulo}>
                            {paginacion.total} contrato{paginacion.total !== 1 ? 's' : ''} encontrado{paginacion.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className={estilos.headerAcciones}>
                    <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                        <ion-icon name="add-circle-outline"></ion-icon>
                        <span>Nuevo Contrato</span>
                    </Link>
                    <Link href="/admin/contratos" className={estilos.btnSecundario}>
                        <ion-icon name="grid-outline"></ion-icon>
                        <span>Dashboard</span>
                    </Link>
                </div>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
                <div className={estilos.filtrosBusqueda}>
                    <div className={estilos.inputBuscarWrapper}>
                        <ion-icon name="search-outline"></ion-icon>
                        <input
                            type="text"
                            placeholder="Buscar por contrato, cliente, NCF..."
                            className={estilos.inputBuscar}
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    setPaginacion(prev => ({ ...prev, pagina: 1 }))
                                    cargarContratos()
                                }
                            }}
                        />
                        {buscar && (
                            <button 
                                className={estilos.btnLimpiar}
                                onClick={() => {
                                    setBuscar('')
                                    setPaginacion(prev => ({ ...prev, pagina: 1 }))
                                }}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        )}
                    </div>
                </div>

                <div className={estilos.filtrosEstado}>
                    <button
                        className={`${estilos.filtroBtn} ${filtroEstado === '' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        Todos
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${estilos.success} ${filtroEstado === 'activo' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('activo')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        <ion-icon name="checkmark-circle-outline"></ion-icon>
                        Activos
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${estilos.info} ${filtroEstado === 'pagado' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('pagado')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        <ion-icon name="checkmark-done-outline"></ion-icon>
                        Pagados
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${estilos.danger} ${filtroEstado === 'incumplido' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('incumplido')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        <ion-icon name="alert-circle-outline"></ion-icon>
                        Incumplidos
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${estilos.warning} ${filtroEstado === 'reestructurado' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('reestructurado')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        <ion-icon name="refresh-outline"></ion-icon>
                        Reestructurados
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${estilos.secondary} ${filtroEstado === 'cancelado' ? estilos.activo : ''}`}
                        onClick={() => {
                            setFiltroEstado('cancelado')
                            setPaginacion(prev => ({ ...prev, pagina: 1 }))
                        }}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        Cancelados
                    </button>
                </div>
            </div>

            {/* Contenido */}
            {cargando ? (
                <div className={estilos.cargando}>
                    <div className={estilos.cargandoSpinner}></div>
                    <span>Cargando contratos...</span>
                </div>
            ) : contratos.length === 0 ? (
                <div className={estilos.vacio}>
                    <div className={estilos.vacioIcono}>
                        <Image 
                            src="/financias/credit-card.svg" 
                            alt="Sin contratos" 
                            width={80} 
                            height={80}
                        />
                    </div>
                    <h3 className={estilos.vacioTitulo}>
                        {buscar || filtroEstado 
                            ? 'No se encontraron contratos'
                            : 'No hay contratos registrados'
                        }
                    </h3>
                    <p className={estilos.vacioTexto}>
                        {buscar || filtroEstado 
                            ? 'Intenta con otros filtros de búsqueda'
                            : 'Comienza creando tu primer contrato de financiamiento'
                        }
                    </p>
                    {!buscar && !filtroEstado && (
                        <Link href="/admin/contratos/nuevo" className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>Crear Contrato</span>
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    {/* Grid de contratos */}
                    <div className={estilos.gridContratos}>
                        {contratos.map((contrato) => (
                            <div key={contrato.id} className={estilos.contratoCard}>
                                <div className={estilos.contratoHeader}>
                                    <div className={`${estilos.contratoIcono} ${estilos[contrato.estado]}`}>
                                        <Image 
                                            src="/financias/tarjetas/Isometric 30°.svg" 
                                            alt="Contrato" 
                                            width={32} 
                                            height={32}
                                        />
                                    </div>
                                    <div className={estilos.contratoHeaderInfo}>
                                        <span className={estilos.contratoNumero}>
                                            {contrato.numero_contrato}
                                        </span>
                                        <span className={estilos.contratoFecha}>
                                            {formatearFecha(contrato.fecha_contrato)}
                                        </span>
                                    </div>
                                    <span className={`${estilos.badge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                                        {contrato.estado}
                                    </span>
                                </div>

                                <div className={estilos.contratoCliente}>
                                    <ion-icon name="person-outline"></ion-icon>
                                    <div>
                                        <span className={estilos.clienteNombre}>{contrato.cliente_nombre}</span>
                                        <span className={estilos.clienteDoc}>{contrato.cliente_documento}</span>
                                    </div>
                                </div>

                                <div className={estilos.contratoMontos}>
                                    <div className={estilos.montoItem}>
                                        <span className={estilos.montoLabel}>Financiado</span>
                                        <span className={estilos.montoValor}>
                                            {formatearMoneda(contrato.monto_financiado)}
                                        </span>
                                    </div>
                                    <div className={estilos.montoItem}>
                                        <span className={estilos.montoLabel}>Pendiente</span>
                                        <span className={`${estilos.montoValor} ${estilos.pendiente}`}>
                                            {formatearMoneda(contrato.saldo_pendiente)}
                                        </span>
                                    </div>
                                </div>

                                <div className={estilos.contratoProgreso}>
                                    <div className={estilos.progresoInfo}>
                                        <span>Cuotas: {contrato.cuotas_pagadas}/{contrato.numero_cuotas}</span>
                                        <span>{calcularProgreso(contrato.cuotas_pagadas, contrato.numero_cuotas)}%</span>
                                    </div>
                                    <div className={estilos.progresoBarra}>
                                        <div 
                                            className={estilos.progresoRelleno}
                                            style={{ 
                                                width: `${calcularProgreso(contrato.cuotas_pagadas, contrato.numero_cuotas)}%` 
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className={estilos.contratoAcciones}>
                                    <Link 
                                        href={`/admin/contratos/ver/${contrato.id}`}
                                        className={estilos.btnVer}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        Ver detalles
                                    </Link>
                                    {contrato.estado === 'activo' && (
                                        <Link 
                                            href={`/admin/contratos/editar/${contrato.id}`}
                                            className={estilos.btnEditar}
                                        >
                                            <ion-icon name="create-outline"></ion-icon>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación */}
                    {paginacion.totalPaginas > 1 && (
                        <div className={estilos.paginacion}>
                            <button
                                className={estilos.btnPaginacion}
                                onClick={() => cambiarPagina(1)}
                                disabled={paginacion.pagina === 1}
                            >
                                <ion-icon name="play-back-outline"></ion-icon>
                            </button>
                            <button
                                className={estilos.btnPaginacion}
                                onClick={() => cambiarPagina(paginacion.pagina - 1)}
                                disabled={paginacion.pagina === 1}
                            >
                                <ion-icon name="chevron-back-outline"></ion-icon>
                                Anterior
                            </button>
                            
                            <div className={estilos.paginacionNumeros}>
                                {Array.from({ length: Math.min(5, paginacion.totalPaginas) }, (_, i) => {
                                    let pagina
                                    if (paginacion.totalPaginas <= 5) {
                                        pagina = i + 1
                                    } else if (paginacion.pagina <= 3) {
                                        pagina = i + 1
                                    } else if (paginacion.pagina >= paginacion.totalPaginas - 2) {
                                        pagina = paginacion.totalPaginas - 4 + i
                                    } else {
                                        pagina = paginacion.pagina - 2 + i
                                    }
                                    return (
                                        <button
                                            key={pagina}
                                            className={`${estilos.btnNumero} ${paginacion.pagina === pagina ? estilos.activo : ''}`}
                                            onClick={() => cambiarPagina(pagina)}
                                        >
                                            {pagina}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                className={estilos.btnPaginacion}
                                onClick={() => cambiarPagina(paginacion.pagina + 1)}
                                disabled={paginacion.pagina === paginacion.totalPaginas}
                            >
                                Siguiente
                                <ion-icon name="chevron-forward-outline"></ion-icon>
                            </button>
                            <button
                                className={estilos.btnPaginacion}
                                onClick={() => cambiarPagina(paginacion.totalPaginas)}
                                disabled={paginacion.pagina === paginacion.totalPaginas}
                            >
                                <ion-icon name="play-forward-outline"></ion-icon>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}


"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerContratos } from './servidor'
import estilos from './contratos.module.css'

export default function ContratosFinanciamiento() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [contratos, setContratos] = useState([])
    const [paginacion, setPaginacion] = useState({
        pagina: 1,
        limite: 20,
        total: 0,
        totalPaginas: 1
    })
    const [filtroEstado, setFiltroEstado] = useState('')
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
                alert(resultado.mensaje || 'Error al cargar contratos')
            }
        } catch (error) {
            console.error('Error al cargar contratos:', error)
            alert('Error al cargar contratos')
        } finally {
            setCargando(false)
        }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    const formatearFecha = (fecha) => {
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

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando contratos...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Contratos de Financiamiento</h1>
                    <p className={estilos.subtitulo}>Gestiona todos los contratos activos</p>
                </div>
                <Link href="/admin/financiamiento" className={estilos.btnSecundario}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </Link>
            </div>

            {/* Filtros */}
            <div className={estilos.filtros}>
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
                <select
                    className={estilos.selectFiltro}
                    value={filtroEstado}
                    onChange={(e) => {
                        setFiltroEstado(e.target.value)
                        setPaginacion(prev => ({ ...prev, pagina: 1 }))
                    }}
                >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="pagado">Pagados</option>
                    <option value="incumplido">Incumplidos</option>
                    <option value="reestructurado">Reestructurados</option>
                    <option value="cancelado">Cancelados</option>
                </select>
            </div>

            {/* Tabla de contratos */}
            <div className={estilos.tablaContenedor}>
                <table className={estilos.tabla}>
                    <thead>
                        <tr>
                            <th>Contrato</th>
                            <th>Cliente</th>
                            <th>Plan</th>
                            <th>Monto Financiado</th>
                            <th>Saldo Pendiente</th>
                            <th>Cuotas</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contratos.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={estilos.sinDatos}>
                                    No hay contratos para mostrar
                                </td>
                            </tr>
                        ) : (
                            contratos.map((contrato) => (
                                <tr key={contrato.id}>
                                    <td>
                                        <div className={estilos.contratoNumero}>
                                            {contrato.numero_contrato}
                                        </div>
                                        <div className={estilos.contratoFecha}>
                                            {formatearFecha(contrato.fecha_contrato)}
                                        </div>
                                        {contrato.ncf && (
                                            <div className={estilos.contratoNCF}>
                                                NCF: {contrato.ncf}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className={estilos.clienteNombre}>
                                            {contrato.cliente_nombre}
                                        </div>
                                        <div className={estilos.clienteDoc}>
                                            {contrato.cliente_documento}
                                        </div>
                                        {contrato.cliente_telefono && (
                                            <div className={estilos.clienteTelefono}>
                                                {contrato.cliente_telefono}
                                            </div>
                                        )}
                                    </td>
                                    <td>{contrato.plan_nombre}</td>
                                    <td className={estilos.monto}>
                                        {formatearMoneda(contrato.monto_financiado)}
                                    </td>
                                    <td className={estilos.monto}>
                                        {formatearMoneda(contrato.saldo_pendiente)}
                                    </td>
                                    <td>
                                        <div className={estilos.cuotasInfo}>
                                            <span>{contrato.cuotas_pagadas}/{contrato.numero_cuotas}</span>
                                            <div className={estilos.progresoCuotas}>
                                                <div
                                                    className={estilos.progresoBarra}
                                                    style={{
                                                        width: `${(contrato.cuotas_pagadas / contrato.numero_cuotas) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${estilos.badge} ${estilos[obtenerColorEstado(contrato.estado)]}`}>
                                            {contrato.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/admin/contratos/ver/${contrato.id}`}
                                            className={estilos.btnVer}
                                        >
                                            Ver detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
                <div className={estilos.paginacion}>
                    <button
                        className={estilos.btnPaginacion}
                        onClick={() => cambiarPagina(paginacion.pagina - 1)}
                        disabled={paginacion.pagina === 1}
                    >
                        <ion-icon name="chevron-back-outline"></ion-icon>
                        Anterior
                    </button>
                    <span className={estilos.infoPaginacion}>
                        Página {paginacion.pagina} de {paginacion.totalPaginas}
                    </span>
                    <button
                        className={estilos.btnPaginacion}
                        onClick={() => cambiarPagina(paginacion.pagina + 1)}
                        disabled={paginacion.pagina === paginacion.totalPaginas}
                    >
                        Siguiente
                        <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                </div>
            )}
        </div>
    )
}





"use client"
import { useEffect, useState } from 'react'
import { obtenerTodosModulos, obtenerModulosEmpresa, toggleModuloEmpresa } from './servidor'
import estilos from './modulos.module.css'

export default function ModulosEmpresa({ empresaId, nombreEmpresa }) {
    const [todosModulos, setTodosModulos] = useState([])
    const [modulosEmpresa, setModulosEmpresa] = useState([])
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [tema, setTema] = useState('light')

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
        if (empresaId) {
            cargarModulos()
        }
    }, [empresaId])

    const cargarModulos = async () => {
        setCargando(true)
        try {
            const [todos, empresa] = await Promise.all([
                obtenerTodosModulos(),
                obtenerModulosEmpresa(empresaId)
            ])

            if (todos.success) {
                setTodosModulos(todos.modulos || [])
            }

            if (empresa.success) {
                setModulosEmpresa(empresa.modulos || [])
            }
        } catch (error) {
            console.error('Error al cargar módulos:', error)
            setMensaje({ tipo: 'error', texto: 'Error al cargar módulos' })
        } finally {
            setCargando(false)
        }
    }

    const manejarToggleModulo = async (moduloId, habilitado) => {
        setProcesando(true)
        setMensaje(null)

        try {
            const resultado = await toggleModuloEmpresa(empresaId, moduloId, habilitado)

            if (resultado.success) {
                setMensaje({ tipo: 'exito', texto: resultado.mensaje })
                await cargarModulos()
            } else {
                setMensaje({ tipo: 'error', texto: resultado.mensaje })
            }
        } catch (error) {
            console.error('Error al toggle módulo:', error)
            setMensaje({ tipo: 'error', texto: 'Error al actualizar módulo' })
        } finally {
            setProcesando(false)
        }
    }

    const obtenerEstadoModulo = (moduloId) => {
        const moduloEmpresa = modulosEmpresa.find(m => m.id === moduloId)
        return moduloEmpresa ? Boolean(moduloEmpresa.habilitado) : false
    }

    const agruparPorCategoria = (modulos) => {
        const categorias = {}
        modulos.forEach(modulo => {
            if (!categorias[modulo.categoria]) {
                categorias[modulo.categoria] = []
            }
            categorias[modulo.categoria].push(modulo)
        })
        return categorias
    }

    const categoriasOrdenadas = ['core', 'pos', 'credito', 'financiamiento', 'constructora', 'catalogo']
    const nombresCategorias = {
        core: 'Core (Sistema Base)',
        pos: 'Punto de Venta',
        credito: 'Control de Crédito',
        financiamiento: 'Financiamiento',
        constructora: 'Construcción',
        catalogo: 'Catálogo Online'
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>Cargando módulos...</div>
            </div>
        )
    }

    const modulosAgrupados = agruparPorCategoria(todosModulos)

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <h2 className={estilos.titulo}>Módulos Habilitados</h2>
                <p className={estilos.subtitulo}>
                    Gestiona los módulos disponibles para: <strong>{nombreEmpresa}</strong>
                </p>
            </div>

            {mensaje && (
                <div className={`${estilos.mensaje} ${estilos[mensaje.tipo]}`}>
                    {mensaje.texto}
                </div>
            )}

            <div className={estilos.modulos}>
                {categoriasOrdenadas.map(categoria => {
                    const modulosCategoria = modulosAgrupados[categoria] || []
                    if (modulosCategoria.length === 0) return null

                    return (
                        <div key={categoria} className={estilos.categoria}>
                            <h3 className={estilos.categoriaTitulo}>
                                {nombresCategorias[categoria] || categoria}
                            </h3>
                            <div className={estilos.listaModulos}>
                                {modulosCategoria.map(modulo => {
                                    const habilitado = obtenerEstadoModulo(modulo.id)
                                    const esSiempreHabilitado = Boolean(modulo.siempre_habilitado)

                                    return (
                                        <div
                                            key={modulo.id}
                                            className={`${estilos.moduloItem} ${habilitado ? estilos.habilitado : ''} ${esSiempreHabilitado ? estilos.siempreHabilitado : ''}`}
                                        >
                                            <div className={estilos.moduloInfo}>
                                                <div className={estilos.moduloHeader}>
                                                    <h4 className={estilos.moduloNombre}>{modulo.nombre}</h4>
                                                    {esSiempreHabilitado && (
                                                        <span className={estilos.badgeSiempre}>Siempre habilitado</span>
                                                    )}
                                                </div>
                                                {modulo.descripcion && (
                                                    <p className={estilos.moduloDescripcion}>{modulo.descripcion}</p>
                                                )}
                                                <div className={estilos.moduloMeta}>
                                                    <span className={estilos.moduloCodigo}>Código: {modulo.codigo}</span>
                                                    {modulo.ruta_base && (
                                                        <span className={estilos.moduloRuta}>Ruta: {modulo.ruta_base}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={estilos.moduloAcciones}>
                                                <label className={estilos.switch}>
                                                    <input
                                                        type="checkbox"
                                                        checked={habilitado || esSiempreHabilitado}
                                                        disabled={esSiempreHabilitado || procesando}
                                                        onChange={(e) => {
                                                            if (!esSiempreHabilitado) {
                                                                manejarToggleModulo(modulo.id, e.target.checked)
                                                            }
                                                        }}
                                                    />
                                                    <span className={estilos.slider}></span>
                                                </label>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className={estilos.footer}>
                <p className={estilos.nota}>
                    <strong>Nota:</strong> Los módulos marcados como "Siempre habilitado" son esenciales 
                    para el funcionamiento del sistema y no pueden ser deshabilitados.
                </p>
            </div>
        </div>
    )
}


"use client"
import { useEffect, useState } from 'react'
import { analizarInconsistencias, ejecutarMigracion, recargarAnalisis } from './servidor'
import estilos from './migracion.module.css'

export default function MigracionEmpresas() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [paso, setPaso] = useState('analisis')
    const [usuariosSinEmpresa, setUsuariosSinEmpresa] = useState([])
    const [resultado, setResultado] = useState(null)
    const [mostrarDetalle, setMostrarDetalle] = useState(null)

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
        cargarAnalisis()
    }, [])

    const cargarAnalisis = async () => {
        setCargando(true)
        try {
            const resultado = await analizarInconsistencias()
            if (resultado.success) {
                setUsuariosSinEmpresa(resultado.usuarios)
            }
        } catch (error) {
            console.error('Error al analizar:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarRecargar = async () => {
        setCargando(true)
        try {
            const resultado = await recargarAnalisis()
            if (resultado.success) {
                setUsuariosSinEmpresa(resultado.usuarios)
                setResultado(null)
                setPaso('analisis')
            }
        } catch (error) {
            console.error('Error al recargar:', error)
        } finally {
            setCargando(false)
        }
    }

    const manejarMigracion = async () => {
        if (!confirm(`Estas seguro de migrar ${usuariosSinEmpresa.length} usuarios a sus propias empresas? Esta accion creara nuevas empresas y actualizara las relaciones.`)) {
            return
        }

        setProcesando(true)
        setPaso('procesando')

        try {
            const resultado = await ejecutarMigracion()
            
            if (resultado.success) {
                setResultado(resultado)
                setPaso('completado')
            } else {
                alert(resultado.mensaje || 'Error en la migracion')
                setPaso('analisis')
            }
        } catch (error) {
            console.error('Error en migracion:', error)
            alert('Error al ejecutar la migracion')
            setPaso('analisis')
        } finally {
            setProcesando(false)
        }
    }

    const toggleDetalle = (usuarioId) => {
        setMostrarDetalle(mostrarDetalle === usuarioId ? null : usuarioId)
    }

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'success': return 'success'
            case 'error': return 'error'
            case 'warning': return 'warning'
            default: return 'info'
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Migracion de Empresas</h1>
                    <p className={estilos.subtitulo}>
                        Detecta y corrige usuarios admin sin empresa propia
                    </p>
                </div>
                
                {paso === 'analisis' && (
                    <button 
                        className={estilos.btnRecargar}
                        onClick={manejarRecargar}
                        disabled={cargando}
                    >
                        <ion-icon name="reload-outline"></ion-icon>
                        <span>Recargar Analisis</span>
                    </button>
                )}
            </div>

            {paso === 'analisis' && (
                <>
                    {cargando ? (
                        <div className={estilos.cargando}>
                            <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                            <span>Analizando base de datos...</span>
                        </div>
                    ) : usuariosSinEmpresa.length === 0 ? (
                        <div className={`${estilos.estadoVacio} ${estilos[tema]}`}>
                            <div className={estilos.iconoGrande}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                            </div>
                            <h2>No hay inconsistencias</h2>
                            <p>Todos los usuarios admin tienen su empresa correctamente asignada</p>
                        </div>
                    ) : (
                        <>
                            <div className={`${estilos.alerta} ${estilos.warning}`}>
                                <ion-icon name="warning-outline"></ion-icon>
                                <div>
                                    <strong>Se detectaron {usuariosSinEmpresa.length} usuarios con problemas</strong>
                                    <p>Estos usuarios tipo admin estan asociados a la Empresa SuperAdmin y necesitan su propia empresa</p>
                                </div>
                            </div>

                            <div className={estilos.listaProblemas}>
                                {usuariosSinEmpresa.map((usuario) => (
                                    <div key={usuario.id} className={`${estilos.itemProblema} ${estilos[tema]}`}>
                                        <div className={estilos.itemHeader}>
                                            <div className={estilos.itemInfo}>
                                                <div className={estilos.itemIcono}>
                                                    <ion-icon name="person-outline"></ion-icon>
                                                </div>
                                                <div>
                                                    <h3 className={estilos.itemNombre}>{usuario.nombre}</h3>
                                                    <div className={estilos.itemMeta}>
                                                        <span className={estilos.metaItem}>
                                                            <ion-icon name="card-outline"></ion-icon>
                                                            {usuario.cedula}
                                                        </span>
                                                        <span className={estilos.metaItem}>
                                                            <ion-icon name="mail-outline"></ion-icon>
                                                            {usuario.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                className={estilos.btnDetalle}
                                                onClick={() => toggleDetalle(usuario.id)}
                                            >
                                                <ion-icon name={mostrarDetalle === usuario.id ? 'chevron-up-outline' : 'chevron-down-outline'}></ion-icon>
                                            </button>
                                        </div>

                                        {mostrarDetalle === usuario.id && (
                                            <div className={estilos.itemDetalle}>
                                                <div className={estilos.detalleSeccion}>
                                                    <h4>Datos a Migrar</h4>
                                                    <ul>
                                                        {usuario.total_productos > 0 && (
                                                            <li>Productos: <strong>{usuario.total_productos}</strong></li>
                                                        )}
                                                        {usuario.total_ventas > 0 && (
                                                            <li>Ventas: <strong>{usuario.total_ventas}</strong></li>
                                                        )}
                                                        {usuario.total_clientes > 0 && (
                                                            <li>Clientes: <strong>{usuario.total_clientes}</strong></li>
                                                        )}
                                                        {usuario.total_categorias > 0 && (
                                                            <li>Categorias: <strong>{usuario.total_categorias}</strong></li>
                                                        )}
                                                        {usuario.total_cajas > 0 && (
                                                            <li>Cajas: <strong>{usuario.total_cajas}</strong></li>
                                                        )}
                                                        {usuario.total_compras > 0 && (
                                                            <li>Compras: <strong>{usuario.total_compras}</strong></li>
                                                        )}
                                                    </ul>
                                                </div>
                                                
                                                <div className={estilos.detalleSeccion}>
                                                    <h4>Problema Detectado</h4>
                                                    <ul>
                                                        <li>Usuario tipo: <strong>admin</strong></li>
                                                        <li>Empresa actual: <strong>Empresa SuperAdmin (ID: 1)</strong></li>
                                                        <li>Estado: <strong className={estilos.textoError}>Sin empresa propia</strong></li>
                                                    </ul>
                                                </div>
                                                
                                                <div className={estilos.detalleSeccion}>
                                                    <h4>Accion a Realizar</h4>
                                                    <ul>
                                                        <li>Crear nueva empresa con nombre: <strong>{usuario.nombre}</strong></li>
                                                        <li>Asignar RNC: <strong>{usuario.cedula}</strong></li>
                                                        <li>Actualizar empresa_id del usuario a la nueva empresa</li>
                                                        <li>Activar empresa automaticamente</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className={estilos.accionesFooter}>
                                <div className={estilos.infoResumen}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <span>Se crearan {usuariosSinEmpresa.length} nuevas empresas y se actualizaran las relaciones</span>
                                </div>
                                <button 
                                    className={estilos.btnMigrar}
                                    onClick={manejarMigracion}
                                    disabled={procesando}
                                >
                                    <ion-icon name="git-merge-outline"></ion-icon>
                                    <span>Ejecutar Migracion</span>
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}

            {paso === 'procesando' && (
                <div className={estilos.estadoProcesando}>
                    <div className={estilos.spinnerGrande}>
                        <ion-icon name="sync-outline" className={estilos.iconoSpinner}></ion-icon>
                    </div>
                    <h2>Procesando Migracion...</h2>
                    <p>Por favor espera mientras se crean las empresas y se actualizan las relaciones</p>
                    <div className={estilos.barraProgreso}>
                        <div className={estilos.barraProgresoFill}></div>
                    </div>
                </div>
            )}

            {paso === 'completado' && resultado && (
                <div className={estilos.estadoCompletado}>
                    {resultado.exitosos > 0 ? (
                        <>
                            <div className={`${estilos.iconoGrande} ${estilos.success}`}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                            </div>
                            <h2>Migracion Completada</h2>
                            <div className={estilos.estadisticas}>
                                <div className={estilos.estadisticaItem}>
                                    <span className={estilos.estadisticaValor}>{resultado.exitosos}</span>
                                    <span className={estilos.estadisticaLabel}>Empresas Creadas</span>
                                </div>
                                <div className={estilos.estadisticaItem}>
                                    <span className={estilos.estadisticaValor}>{resultado.actualizados}</span>
                                    <span className={estilos.estadisticaLabel}>Usuarios Actualizados</span>
                                </div>
                                {resultado.fallidos > 0 && (
                                    <div className={`${estilos.estadisticaItem} ${estilos.error}`}>
                                        <span className={estilos.estadisticaValor}>{resultado.fallidos}</span>
                                        <span className={estilos.estadisticaLabel}>Fallidos</span>
                                    </div>
                                )}
                            </div>

                            {resultado.detalles && resultado.detalles.length > 0 && (
                                <div className={estilos.detallesResultado}>
                                    <h3>Detalle de la Migracion</h3>
                                    <div className={estilos.listaResultados}>
                                        {resultado.detalles.map((detalle, index) => (
                                            <div 
                                                key={index} 
                                                className={`${estilos.resultadoItem} ${estilos[obtenerColorEstado(detalle.estado)]}`}
                                            >
                                                <ion-icon name={
                                                    detalle.estado === 'success' ? 'checkmark-circle-outline' :
                                                    detalle.estado === 'error' ? 'close-circle-outline' :
                                                    'alert-circle-outline'
                                                }></ion-icon>
                                                <div className={estilos.resultadoInfo}>
                                                    <strong>{detalle.usuario}</strong>
                                                    <span>Empresa creada: {detalle.empresa_nombre}</span>
                                                    <span>RNC: {detalle.rnc}</span>
                                                    {detalle.empresa_id && (
                                                        <span>ID Empresa: {detalle.empresa_id}</span>
                                                    )}
                                                    {detalle.productos_migrados > 0 && (
                                                        <span>Productos migrados: {detalle.productos_migrados}</span>
                                                    )}
                                                    {detalle.ventas_migradas > 0 && (
                                                        <span>Ventas migradas: {detalle.ventas_migradas}</span>
                                                    )}
                                                    {detalle.despachos_migrados > 0 && (
                                                        <span>Despachos migrados: {detalle.despachos_migrados}</span>
                                                    )}
                                                    {detalle.clientes_migrados > 0 && (
                                                        <span>Clientes migrados: {detalle.clientes_migrados}</span>
                                                    )}
                                                    {detalle.categorias_migradas > 0 && (
                                                        <span>Categorias migradas: {detalle.categorias_migradas}</span>
                                                    )}
                                                    {detalle.marcas_migradas > 0 && (
                                                        <span>Marcas migradas: {detalle.marcas_migradas}</span>
                                                    )}
                                                    {detalle.compras_migradas > 0 && (
                                                        <span>Compras migradas: {detalle.compras_migradas}</span>
                                                    )}
                                                    {detalle.cajas_migradas > 0 && (
                                                        <span>Cajas migradas: {detalle.cajas_migradas}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={estilos.accionesCompletado}>
                                <button 
                                    className={estilos.btnSecundario}
                                    onClick={manejarRecargar}
                                >
                                    <ion-icon name="reload-outline"></ion-icon>
                                    <span>Verificar Nuevamente</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={`${estilos.iconoGrande} ${estilos.error}`}>
                                <ion-icon name="close-circle-outline"></ion-icon>
                            </div>
                            <h2>Error en la Migracion</h2>
                            <p>{resultado.mensaje || 'Ocurrio un error durante el proceso'}</p>
                            <button 
                                className={estilos.btnPrimario}
                                onClick={() => setPaso('analisis')}
                            >
                                <ion-icon name="arrow-back-outline"></ion-icon>
                                <span>Volver al Analisis</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
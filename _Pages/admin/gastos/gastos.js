"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerGastos, obtenerGasto, crearGasto, actualizarGasto, eliminarGasto } from './servidor'
import estilos from './gastos.module.css'

export default function GastosAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [gastos, setGastos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('todos')
    const [filtroFecha, setFiltroFecha] = useState('todos')
    
    const [vistaActual, setVistaActual] = useState('listado')
    const [gastoSeleccionado, setGastoSeleccionado] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)

    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        categoria: '',
        comprobante_numero: '',
        notas: ''
    })

    const categorias = [
        'Servicios Publicos',
        'Alquiler',
        'Nomina',
        'Mantenimiento',
        'Publicidad',
        'Transporte',
        'Suministros',
        'Impuestos',
        'Otros'
    ]

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
        cargarGastos()
    }, [])

    const cargarGastos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerGastos()
            if (resultado.success) {
                setGastos(resultado.gastos)
            } else {
                alert(resultado.mensaje || 'Error al cargar gastos')
            }
        } catch (error) {
            console.error('Error al cargar gastos:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const limpiarFormulario = () => {
        setFormData({
            concepto: '',
            monto: '',
            categoria: '',
            comprobante_numero: '',
            notas: ''
        })
        setModoEdicion(false)
        setGastoSeleccionado(null)
    }

    const abrirFormularioNuevo = () => {
        limpiarFormulario()
        setVistaActual('formulario')
    }

    const abrirFormularioEditar = (gasto) => {
        setFormData({
            concepto: gasto.concepto,
            monto: gasto.monto.toString(),
            categoria: gasto.categoria || '',
            comprobante_numero: gasto.comprobante_numero || '',
            notas: gasto.notas || ''
        })
        setGastoSeleccionado(gasto)
        setModoEdicion(true)
        setVistaActual('formulario')
    }

    const abrirDetalles = async (id) => {
        setProcesando(true)
        try {
            const resultado = await obtenerGasto(id)
            if (resultado.success) {
                setGastoSeleccionado(resultado.gasto)
                setVistaActual('detalles')
            } else {
                alert(resultado.mensaje || 'Error al cargar gasto')
            }
        } catch (error) {
            console.error('Error al cargar gasto:', error)
            alert('Error al cargar datos')
        } finally {
            setProcesando(false)
        }
    }

    const volverListado = () => {
        setVistaActual('listado')
        limpiarFormulario()
        setGastoSeleccionado(null)
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const validarFormulario = () => {
        if (!formData.concepto.trim()) {
            alert('El concepto es obligatorio')
            return false
        }

        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            alert('El monto debe ser mayor a 0')
            return false
        }

        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) return

        setProcesando(true)
        try {
            let resultado

            if (modoEdicion) {
                resultado = await actualizarGasto(gastoSeleccionado.id, formData)
            } else {
                resultado = await crearGasto(formData)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarGastos()
                volverListado()
            } else {
                alert(resultado.mensaje || 'Error al guardar gasto')
            }
        } catch (error) {
            console.error('Error al guardar gasto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (id, concepto) => {
        if (!confirm(`¿Estas seguro de eliminar el gasto "${concepto}"?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await eliminarGasto(id)
            if (resultado.success) {
                await cargarGastos()
                alert(resultado.mensaje)
                if (vistaActual === 'detalles') {
                    volverListado()
                }
            } else {
                alert(resultado.mensaje || 'Error al eliminar gasto')
            }
        } catch (error) {
            console.error('Error al eliminar gasto:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const gastosFiltrados = gastos.filter(gasto => {
        const cumpleBusqueda = busqueda === '' ||
            gasto.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
            (gasto.categoria && gasto.categoria.toLowerCase().includes(busqueda.toLowerCase()))

        const cumpleCategoria = filtroCategoria === 'todos' || 
            (filtroCategoria === 'sin_categoria' && !gasto.categoria) ||
            gasto.categoria === filtroCategoria

        let cumpleFecha = true
        if (filtroFecha !== 'todos') {
            const fechaGasto = new Date(gasto.fecha_gasto)
            const hoy = new Date()
            
            if (filtroFecha === 'hoy') {
                cumpleFecha = fechaGasto.toDateString() === hoy.toDateString()
            } else if (filtroFecha === 'semana') {
                const inicioSemana = new Date(hoy)
                inicioSemana.setDate(hoy.getDate() - 7)
                cumpleFecha = fechaGasto >= inicioSemana
            } else if (filtroFecha === 'mes') {
                cumpleFecha = fechaGasto.getMonth() === hoy.getMonth() && 
                              fechaGasto.getFullYear() === hoy.getFullYear()
            }
        }

        return cumpleBusqueda && cumpleCategoria && cumpleFecha
    })

    const calcularEstadisticas = () => {
        const total = gastos.length
        const totalMonto = gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
        
        const hoy = new Date()
        const gastosMes = gastos.filter(g => {
            const fecha = new Date(g.fecha_gasto)
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
        })
        const montoMes = gastosMes.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
        
        const categoriasMasUsadas = {}
        gastos.forEach(g => {
            const cat = g.categoria || 'Sin Categoria'
            categoriasMasUsadas[cat] = (categoriasMasUsadas[cat] || 0) + 1
        })
        const categoriaPrincipal = Object.keys(categoriasMasUsadas).length > 0 
            ? Object.keys(categoriasMasUsadas).reduce((a, b) => 
                categoriasMasUsadas[a] > categoriasMasUsadas[b] ? a : b
            ) 
            : 'N/A'

        return { total, totalMonto, montoMes, categoriaPrincipal }
    }

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP'
        }).format(monto)
    }

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const estadisticas = calcularEstadisticas()

    if (vistaActual === 'formulario') {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>{modoEdicion ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
                        <p className={estilos.subtitulo}>{modoEdicion ? 'Modifica los datos del gasto' : 'Registra un nuevo gasto'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={volverListado}
                        className={estilos.btnVolver}
                        disabled={procesando}
                    >
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver</span>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion del Gasto</h2>
                        
                        <div className={estilos.grupoInput}>
                            <label>Concepto *</label>
                            <input
                                type="text"
                                name="concepto"
                                value={formData.concepto}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Ej: Pago de luz, Compra de papeleria..."
                                required
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoDoble}>
                            <div className={estilos.grupoInput}>
                                <label>Monto *</label>
                                <input
                                    type="number"
                                    name="monto"
                                    value={formData.monto}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    required
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Categoria</label>
                                <select
                                    name="categoria"
                                    value={formData.categoria}
                                    onChange={manejarCambio}
                                    className={estilos.input}
                                    disabled={procesando}
                                >
                                    <option value="">Seleccionar categoria</option>
                                    {categorias.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Numero de Comprobante</label>
                            <input
                                type="text"
                                name="comprobante_numero"
                                value={formData.comprobante_numero}
                                onChange={manejarCambio}
                                className={estilos.input}
                                placeholder="Numero de factura o recibo"
                                disabled={procesando}
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Notas</label>
                            <textarea
                                name="notas"
                                value={formData.notas}
                                onChange={manejarCambio}
                                className={estilos.textarea}
                                placeholder="Detalles adicionales del gasto..."
                                rows="4"
                                disabled={procesando}
                            />
                        </div>
                    </div>

                    <div className={estilos.botonesFormulario}>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnCancelar}
                            disabled={procesando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? 'Guardando...' : modoEdicion ? 'Actualizar Gasto' : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    if (vistaActual === 'detalles' && gastoSeleccionado) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <div>
                        <h1 className={estilos.titulo}>Detalles del Gasto</h1>
                        <p className={estilos.subtitulo}>Informacion completa</p>
                    </div>
                    <div className={estilos.headerAcciones}>
                        <button
                            type="button"
                            onClick={() => abrirFormularioEditar(gastoSeleccionado)}
                            className={estilos.btnEditar}
                            disabled={procesando}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => manejarEliminar(gastoSeleccionado.id, gastoSeleccionado.concepto)}
                            className={estilos.btnEliminar}
                            disabled={procesando}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>Eliminar</span>
                        </button>
                        <button
                            type="button"
                            onClick={volverListado}
                            className={estilos.btnVolver}
                            disabled={procesando}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            <span>Volver</span>
                        </button>
                    </div>
                </div>

                <div className={estilos.detallesGrid}>
                    <div className={`${estilos.panel} ${estilos[tema]}`}>
                        <h2 className={estilos.panelTitulo}>Informacion del Gasto</h2>

                        <div className={estilos.infoGrid}>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Concepto</span>
                                <span className={estilos.infoValor}>{gastoSeleccionado.concepto}</span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Monto</span>
                                <span className={`${estilos.infoValor} ${estilos.monto}`}>
                                    {formatearMoneda(gastoSeleccionado.monto)}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Categoria</span>
                                <span className={estilos.infoValor}>
                                    {gastoSeleccionado.categoria || 'Sin categoria'}
                                </span>
                            </div>
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Fecha</span>
                                <span className={estilos.infoValor}>{formatearFecha(gastoSeleccionado.fecha_gasto)}</span>
                            </div>
                            {gastoSeleccionado.comprobante_numero && (
                                <div className={estilos.infoItem}>
                                    <span className={estilos.infoLabel}>Comprobante</span>
                                    <span className={estilos.infoValor}>{gastoSeleccionado.comprobante_numero}</span>
                                </div>
                            )}
                            <div className={estilos.infoItem}>
                                <span className={estilos.infoLabel}>Registrado por</span>
                                <span className={estilos.infoValor}>{gastoSeleccionado.usuario_nombre}</span>
                            </div>
                            {gastoSeleccionado.notas && (
                                <div className={`${estilos.infoItem} ${estilos.full}`}>
                                    <span className={estilos.infoLabel}>Notas</span>
                                    <span className={estilos.infoValor}>{gastoSeleccionado.notas}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Gastos</h1>
                    <p className={estilos.subtitulo}>Gestiona los gastos del negocio</p>
                </div>
                <button
                    onClick={abrirFormularioNuevo}
                    className={estilos.btnNuevo}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nuevo Gasto</span>
                </button>
            </div>

            <div className={estilos.estadisticas}>
                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={estilos.estadIcono}>
                        <ion-icon name="wallet-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Total Gastos</span>
                        <span className={estilos.estadValor}>{estadisticas.total}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.danger}`}>
                        <ion-icon name="cash-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Monto Total</span>
                        <span className={estilos.estadValor}>{formatearMoneda(estadisticas.totalMonto)}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.warning}`}>
                        <ion-icon name="calendar-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Gastos del Mes</span>
                        <span className={estilos.estadValor}>{formatearMoneda(estadisticas.montoMes)}</span>
                    </div>
                </div>

                <div className={`${estilos.estadCard} ${estilos[tema]}`}>
                    <div className={`${estilos.estadIcono} ${estilos.primary}`}>
                        <ion-icon name="pie-chart-outline"></ion-icon>
                    </div>
                    <div className={estilos.estadInfo}>
                        <span className={estilos.estadLabel}>Categoria Principal</span>
                        <span className={estilos.estadValor}>{estadisticas.categoriaPrincipal}</span>
                    </div>
                </div>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar gasto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todas las categorias</option>
                    <option value="sin_categoria">Sin categoria</option>
                    {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className={estilos.selectFiltro}
                >
                    <option value="todos">Todas las fechas</option>
                    <option value="hoy">Hoy</option>
                    <option value="semana">Ultimos 7 dias</option>
                    <option value="mes">Este mes</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando gastos...</span>
                </div>
            ) : gastosFiltrados.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="wallet-outline"></ion-icon>
                    <span>No hay gastos que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {gastosFiltrados.map((gasto) => (
                        <div key={gasto.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <div className={estilos.cardIcono}>
                                    <ion-icon name="wallet-outline"></ion-icon>
                                </div>
                                <div className={estilos.cardTitulo}>
                                    <h3>{gasto.concepto}</h3>
                                    <span className={estilos.cardMonto}>
                                        {formatearMoneda(gasto.monto)}
                                    </span>
                                </div>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.cardInfo}>
                                    {gasto.categoria && (
                                        <div className={estilos.cardCategoria}>
                                            <ion-icon name="pricetag-outline"></ion-icon>
                                            <span>{gasto.categoria}</span>
                                        </div>
                                    )}
                                    <div className={estilos.cardFecha}>
                                        <ion-icon name="calendar-outline"></ion-icon>
                                        <span>{new Date(gasto.fecha_gasto).toLocaleDateString('es-DO')}</span>
                                    </div>
                                    <div className={estilos.cardUsuario}>
                                        <ion-icon name="person-outline"></ion-icon>
                                        <span>{gasto.usuario_nombre}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    onClick={() => abrirDetalles(gasto.id)}
                                    className={estilos.btnIcono}
                                    title="Ver detalles"
                                >
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button
                                    onClick={() => abrirFormularioEditar(gasto)}
                                    className={estilos.btnIcono}
                                    title="Editar"
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                </button>
                                <button
                                    className={`${estilos.btnIcono} ${estilos.eliminar}`}
                                    onClick={() => manejarEliminar(gasto.id, gasto.concepto)}
                                    disabled={procesando}
                                    title="Eliminar"
                                >
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
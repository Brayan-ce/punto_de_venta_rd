"use client"
import { useState, useEffect } from 'react'
import { obtenerObrasActivas, obtenerGastosObra, crearGasto, eliminarGasto, actualizarGasto, obtenerGastoPorId, obtenerUsuariosEmpresa, obtenerMonedaEmpresa } from './servidor'
import estilos from './gastos.module.css'

const TIPOS_GASTO = [
    { value: 'materiales', label: 'Materiales', icon: 'cube-outline' },
    { value: 'herramientas', label: 'Herramientas', icon: 'hammer-outline' },
    { value: 'transporte', label: 'Transporte', icon: 'car-outline' },
    { value: 'alimentacion', label: 'Alimentación', icon: 'restaurant-outline' },
    { value: 'servicios', label: 'Servicios', icon: 'construct-outline' },
    { value: 'otros', label: 'Otros', icon: 'ellipsis-horizontal-outline' }
]

const METODOS_PAGO = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' }
]

export default function Gastos() {
    const [tema, setTema] = useState('light')
    const [obras, setObras] = useState([])
    const [obraSeleccionada, setObraSeleccionada] = useState('')
    const [gastos, setGastos] = useState([])
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [filtroTipo, setFiltroTipo] = useState('')
    const [moneda, setMoneda] = useState('DOP RD$')
    const [usuarios, setUsuarios] = useState([])
    const [gastoVer, setGastoVer] = useState(null)
    const [gastoEditar, setGastoEditar] = useState(null)
    const [modoEditar, setModoEditar] = useState(false)
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipo_gasto: 'materiales',
        concepto: '',
        descripcion: '',
        monto: '',
        proveedor: '',
        numero_factura: '',
        metodo_pago: 'efectivo',
        notas: '',
        quien_compro_id: ''
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
        cargarMoneda()
        cargarObras()
    }, [])

    useEffect(() => {
        if (obraSeleccionada) {
            cargarGastos()
        }
    }, [obraSeleccionada])

    async function cargarMoneda() {
        const res = await obtenerMonedaEmpresa()
        if (res.success) {
            setMoneda(`${res.codigo_moneda} ${res.simbolo_moneda}`)
        }
    }

    async function cargarObras() {
        const res = await obtenerObrasActivas()
        if (res.success) {
            setObras(res.obras)
            if (res.obras.length > 0) {
                setObraSeleccionada(res.obras[0].id.toString())
            }
        }
    }

    async function cargarGastos() {
        setCargando(true)
        const res = await obtenerGastosObra(obraSeleccionada)
        if (res.success) {
            setGastos(res.gastos)
        }
        setCargando(false)
    }

    function resetFormulario() {
        setFormData({
            fecha: new Date().toISOString().split('T')[0],
            tipo_gasto: 'materiales',
            concepto: '',
            descripcion: '',
            monto: '',
            proveedor: '',
            numero_factura: '',
            metodo_pago: 'efectivo',
            notas: '',
            quien_compro_id: ''
        })
        setMostrarFormulario(false)
        setModoEditar(false)
        setGastoEditar(null)
        setGastoVer(null)
    }

    async function cargarUsuarios() {
        const res = await obtenerUsuariosEmpresa()
        if (res.success && res.usuarios) setUsuarios(res.usuarios)
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!formData.concepto.trim()) {
            alert('El concepto es requerido')
            return
        }

        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            alert('El monto debe ser mayor a 0')
            return
        }

        setGuardando(true)
        const res = modoEditar && gastoEditar
            ? await actualizarGasto(gastoEditar.id, obraSeleccionada, formData)
            : await crearGasto(obraSeleccionada, formData)
        setGuardando(false)

        if (res.success) {
            resetFormulario()
            cargarGastos()
        } else {
            alert(res.mensaje || (modoEditar ? 'Error al actualizar' : 'Error al crear el gasto'))
        }
    }

    async function handleEliminar(id, concepto) {
        if (!confirm(`¿Eliminar gasto: ${concepto}?`)) {
            return
        }

        const res = await eliminarGasto(id, obraSeleccionada)
        if (res.success) {
            cargarGastos()
        } else {
            alert(res.mensaje || 'Error al eliminar')
        }
    }

    function abrirEditar(gasto) {
        setGastoEditar(gasto)
        setModoEditar(true)
        setFormData({
            fecha: gasto.fecha ? new Date(gasto.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            tipo_gasto: gasto.tipo_gasto || 'materiales',
            concepto: gasto.concepto || '',
            descripcion: gasto.descripcion || '',
            monto: gasto.monto ?? '',
            proveedor: gasto.proveedor || '',
            numero_factura: gasto.numero_factura || '',
            metodo_pago: gasto.metodo_pago || 'efectivo',
            notas: gasto.notas || '',
            quien_compro_id: gasto.quien_compro_id ? String(gasto.quien_compro_id) : ''
        })
        setMostrarFormulario(true)
        cargarUsuarios()
    }

    const gastosFiltrados = filtroTipo 
        ? gastos.filter(g => g.tipo_gasto === filtroTipo)
        : gastos

    const totalGastos = gastosFiltrados.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)

    const gastosPorTipo = TIPOS_GASTO.map(tipo => ({
        ...tipo,
        total: gastos
            .filter(g => g.tipo_gasto === tipo.value)
            .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
    }))

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="wallet-outline"></ion-icon>
                        Gastos de Obra
                    </h1>
                    <p className={estilos.subtitulo}>
                        Control de gastos y compras
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={() => { setModoEditar(false); setGastoEditar(null); setMostrarFormulario(true); cargarUsuarios(); }}
                >
                    <ion-icon name="add-outline"></ion-icon>
                    Nuevo Gasto
                </button>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.campo}>
                    <label>Obra</label>
                    <select
                        value={obraSeleccionada}
                        onChange={(e) => setObraSeleccionada(e.target.value)}
                        className={estilos.select}
                    >
                        <option value="">Seleccionar obra</option>
                        {obras.map(obra => (
                            <option key={obra.id} value={obra.id}>
                                {obra.codigo_obra} - {obra.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={estilos.campo}>
                    <label>Filtrar por tipo</label>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className={estilos.select}
                    >
                        <option value="">Todos los tipos</option>
                        {TIPOS_GASTO.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {obraSeleccionada && (
                <>
                    <div className={estilos.resumenTipos}>
                        {gastosPorTipo.map(tipo => (
                            <div 
                                key={tipo.value} 
                                className={`${estilos.tipoCard} ${filtroTipo === tipo.value ? estilos.tipoActivo : ''}`}
                                onClick={() => setFiltroTipo(filtroTipo === tipo.value ? '' : tipo.value)}
                            >
                                <ion-icon name={tipo.icon}></ion-icon>
                                <div>
                                    <span className={estilos.tipoLabel}>{tipo.label}</span>
                                    <span className={estilos.tipoMonto}>{moneda} {tipo.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={estilos.totalGeneral}>
                        <span>Total General:</span>
                        <span className={estilos.totalMonto}>{moneda} {totalGastos.toLocaleString()}</span>
                    </div>
                </>
            )}

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando gastos...</span>
                </div>
            ) : !obraSeleccionada ? (
                <div className={estilos.vacio}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>Selecciona una obra</h3>
                    <p>Elige una obra para ver sus gastos</p>
                </div>
            ) : gastosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="wallet-outline"></ion-icon>
                    <h3>No hay gastos registrados</h3>
                    <p>Registra el primer gasto de esta obra</p>
                    <button 
                        className={estilos.btnCrear}
                        onClick={() => { setModoEditar(false); setGastoEditar(null); setMostrarFormulario(true); cargarUsuarios(); }}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        Crear Primer Gasto
                    </button>
                </div>
            ) : (
                <div className={estilos.listaGastos}>
                    {gastosFiltrados.map(gasto => {
                        const tipoInfo = TIPOS_GASTO.find(t => t.value === gasto.tipo_gasto)
                        
                        return (
                            <div key={gasto.id} className={estilos.gastoCard}>
                                <div className={estilos.gastoHeader}>
                                    <div className={estilos.gastoIcono}>
                                        <ion-icon name={tipoInfo?.icon || 'cube-outline'}></ion-icon>
                                    </div>
                                    <div className={estilos.gastoInfo}>
                                        <h3>{gasto.concepto}</h3>
                                        <span className={estilos.gastoTipo}>{tipoInfo?.label || gasto.tipo_gasto}</span>
                                    </div>
                                    <div className={estilos.gastoMonto}>
                                        {moneda} {parseFloat(gasto.monto).toLocaleString()}
                                    </div>
                                </div>

                                <div className={estilos.gastoBody}>
                                    {gasto.descripcion && (
                                        <p className={estilos.descripcion}>{gasto.descripcion}</p>
                                    )}

                                    <div className={estilos.gastoDetalles}>
                                        <div className={estilos.detalle}>
                                            <ion-icon name="person-outline"></ion-icon>
                                            <span>Quien compró: {gasto.quien_compro_nombre || gasto.registrado_por_nombre || '-'}</span>
                                        </div>
                                        <div className={estilos.detalle}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            <span>{new Date(gasto.fecha).toLocaleDateString()}</span>
                                        </div>
                                        {gasto.proveedor && (
                                            <div className={estilos.detalle}>
                                                <ion-icon name="business-outline"></ion-icon>
                                                <span>{gasto.proveedor}</span>
                                            </div>
                                        )}
                                        {gasto.numero_factura && (
                                            <div className={estilos.detalle}>
                                                <ion-icon name="receipt-outline"></ion-icon>
                                                <span>Factura: {gasto.numero_factura}</span>
                                            </div>
                                        )}
                                        <div className={estilos.detalle}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            <span>{METODOS_PAGO.find(m => m.value === gasto.metodo_pago)?.label || gasto.metodo_pago}</span>
                                        </div>
                                    </div>

                                    {gasto.notas && (
                                        <div className={estilos.notas}>
                                            <ion-icon name="document-text-outline"></ion-icon>
                                            <span>{gasto.notas}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={estilos.gastoFooter}>
                                    <button 
                                        type="button"
                                        className={estilos.btnVer}
                                        onClick={() => setGastoVer(gasto)}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        Ver
                                    </button>
                                    <button 
                                        type="button"
                                        className={estilos.btnEditar}
                                        onClick={() => abrirEditar(gasto)}
                                    >
                                        <ion-icon name="pencil-outline"></ion-icon>
                                        Editar
                                    </button>
                                    <button 
                                        className={estilos.btnEliminar}
                                        onClick={() => handleEliminar(gasto.id, gasto.concepto)}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {gastoVer && (
                <div className={estilos.modal} onClick={() => setGastoVer(null)}>
                    <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>Detalle del Gasto</h3>
                            <button 
                                type="button"
                                className={estilos.btnCerrar}
                                onClick={() => setGastoVer(null)}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.formulario}>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Concepto</span>
                                <span className={estilos.detalleValor}>{gastoVer.concepto}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Tipo</span>
                                <span className={estilos.detalleValor}>{TIPOS_GASTO.find(t => t.value === gastoVer.tipo_gasto)?.label || gastoVer.tipo_gasto}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Monto</span>
                                <span className={estilos.detalleValor}>{moneda} {parseFloat(gastoVer.monto).toLocaleString()}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Fecha</span>
                                <span className={estilos.detalleValor}>{gastoVer.fecha ? new Date(gastoVer.fecha).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Quien compró</span>
                                <span className={estilos.detalleValor}>{gastoVer.quien_compro_nombre || gastoVer.registrado_por_nombre || '-'}</span>
                            </div>
                            {gastoVer.descripcion && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>Descripción</span>
                                    <span className={estilos.detalleValor}>{gastoVer.descripcion}</span>
                                </div>
                            )}
                            {gastoVer.proveedor && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>Proveedor</span>
                                    <span className={estilos.detalleValor}>{gastoVer.proveedor}</span>
                                </div>
                            )}
                            {gastoVer.numero_factura && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>Número factura</span>
                                    <span className={estilos.detalleValor}>{gastoVer.numero_factura}</span>
                                </div>
                            )}
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>Método de pago</span>
                                <span className={estilos.detalleValor}>{METODOS_PAGO.find(m => m.value === gastoVer.metodo_pago)?.label || gastoVer.metodo_pago}</span>
                            </div>
                            {gastoVer.notas && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>Notas</span>
                                    <span className={estilos.detalleValor}>{gastoVer.notas}</span>
                                </div>
                            )}
                            <div className={estilos.modalAcciones}>
                                <button type="button" className={estilos.btnEditar} onClick={() => { setGastoVer(null); abrirEditar(gastoVer); }}>
                                    <ion-icon name="pencil-outline"></ion-icon>
                                    Editar
                                </button>
                                <button type="button" className={estilos.btnCancelar} onClick={() => setGastoVer(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mostrarFormulario && (
                <div className={estilos.modal} onClick={() => resetFormulario()}>
                    <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>{modoEditar ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
                            <button 
                                className={estilos.btnCerrar}
                                onClick={() => resetFormulario()}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={estilos.formulario}>
                            <div className={estilos.grid}>
                                <div className={estilos.campo}>
                                    <label>Fecha <span className={estilos.requerido}>*</span></label>
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData(prev => ({...prev, fecha: e.target.value}))}
                                        required
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>Tipo de Gasto <span className={estilos.requerido}>*</span></label>
                                    <select
                                        className={estilos.select}
                                        value={formData.tipo_gasto}
                                        onChange={(e) => setFormData(prev => ({...prev, tipo_gasto: e.target.value}))}
                                        required
                                    >
                                        {TIPOS_GASTO.map(tipo => (
                                            <option key={tipo.value} value={tipo.value}>
                                                {tipo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>Concepto <span className={estilos.requerido}>*</span></label>
                                <input
                                    type="text"
                                    value={formData.concepto}
                                    onChange={(e) => setFormData(prev => ({...prev, concepto: e.target.value}))}
                                    placeholder="Ej: Compra de cemento"
                                    required
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>Descripcion</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                                    placeholder="Detalles adicionales..."
                                    rows="2"
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>Monto <span className={estilos.requerido}>*</span></label>
                                <div className={estilos.inputGroup}>
                                    <span className={estilos.inputPrefix}>{moneda}</span>
                                    <input
                                        type="number"
                                        value={formData.monto}
                                        onChange={(e) => setFormData(prev => ({...prev, monto: e.target.value}))}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={estilos.grid}>
                                <div className={estilos.campo}>
                                    <label>Proveedor</label>
                                    <input
                                        type="text"
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData(prev => ({...prev, proveedor: e.target.value}))}
                                        placeholder="Nombre del proveedor"
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>Numero de Factura</label>
                                    <input
                                        type="text"
                                        value={formData.numero_factura}
                                        onChange={(e) => setFormData(prev => ({...prev, numero_factura: e.target.value}))}
                                        placeholder="Numero factura"
                                    />
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>Quien compró</label>
                                <select
                                    className={estilos.select}
                                    value={formData.quien_compro_id}
                                    onChange={(e) => setFormData(prev => ({...prev, quien_compro_id: e.target.value}))}
                                >
                                    <option value="">Quien registra</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label>Metodo de Pago <span className={estilos.requerido}>*</span></label>
                                <select
                                    className={estilos.select}
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData(prev => ({...prev, metodo_pago: e.target.value}))}
                                    required
                                >
                                    {METODOS_PAGO.map(metodo => (
                                        <option key={metodo.value} value={metodo.value}>
                                            {metodo.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label>Notas Adicionales</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData(prev => ({...prev, notas: e.target.value}))}
                                    placeholder="Notas u observaciones..."
                                    rows="2"
                                />
                            </div>

                            <div className={estilos.modalAcciones}>
                                <button 
                                    type="button" 
                                    className={estilos.btnCancelar}
                                    onClick={() => resetFormulario()}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                                    {guardando ? (
                                        <>
                                            <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="save-outline"></ion-icon>
                                            Guardar Gasto
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
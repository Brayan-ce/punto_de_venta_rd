"use client"
import { useState, useEffect } from 'react'
import { obtenerObrasActivas, obtenerGastosObra, crearGasto, eliminarGasto, actualizarGasto, obtenerGastoPorId, obtenerUsuariosEmpresa, obtenerMonedaEmpresa } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './gastos.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

const TIPOS_GASTO = [
    { value: 'materiales', label: 'Materiales', labelEn: 'Materials', icon: 'cube-outline' },
    { value: 'herramientas', label: 'Herramientas', labelEn: 'Tools', icon: 'hammer-outline' },
    { value: 'transporte', label: 'Transporte', labelEn: 'Transport', icon: 'car-outline' },
    { value: 'alimentacion', label: 'Alimentación', labelEn: 'Food', icon: 'restaurant-outline' },
    { value: 'servicios', label: 'Servicios', labelEn: 'Services', icon: 'construct-outline' },
    { value: 'otros', label: 'Otros', labelEn: 'Other', icon: 'ellipsis-horizontal-outline' }
]

const METODOS_PAGO = [
    { value: 'efectivo', label: 'Efectivo', labelEn: 'Cash' },
    { value: 'transferencia', label: 'Transferencia', labelEn: 'Transfer' },
    { value: 'cheque', label: 'Cheque', labelEn: 'Check' },
    { value: 'tarjeta', label: 'Tarjeta', labelEn: 'Card' }
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
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
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
            alert(tr('El concepto es requerido', 'Concept is required'))
            return
        }

        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            alert(tr('El monto debe ser mayor a 0', 'Amount must be greater than 0'))
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
            alert(res.mensaje || (modoEditar ? tr('Error al actualizar', 'Error updating') : tr('Error al crear el gasto', 'Error creating expense')))
        }
    }

    async function handleEliminar(id, concepto) {
        if (!confirm(tr(`¿Eliminar gasto: ${concepto}?`, `Delete expense: ${concepto}?`))) {
            return
        }

        const res = await eliminarGasto(id, obraSeleccionada)
        if (res.success) {
            cargarGastos()
        } else {
            alert(res.mensaje || tr('Error al eliminar', 'Error deleting'))
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
                        {tr('Gastos de Obra', 'Project Expenses')}
                    </h1>
                    <p className={estilos.subtitulo}>
                        {tr('Control de gastos y compras', 'Expense and purchase tracking')}
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={() => { setModoEditar(false); setGastoEditar(null); setMostrarFormulario(true); cargarUsuarios(); }}
                >
                    <ion-icon name="add-outline"></ion-icon>
                    {tr('Nuevo Gasto', 'New Expense')}
                </button>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.campo}>
                    <label>{tr('Obra', 'Project')}</label>
                    <select
                        value={obraSeleccionada}
                        onChange={(e) => setObraSeleccionada(e.target.value)}
                        className={estilos.select}
                    >
                        <option value="">{tr('Seleccionar obra', 'Select project')}</option>
                        {obras.map(obra => (
                            <option key={obra.id} value={obra.id}>
                                {obra.codigo_obra} - {obra.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={estilos.campo}>
                    <label>{tr('Filtrar por tipo', 'Filter by type')}</label>
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className={estilos.select}
                    >
                        <option value="">{tr('Todos los tipos', 'All types')}</option>
                        {TIPOS_GASTO.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                                {language === 'en' ? tipo.labelEn : tipo.label}
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
                                    <span className={estilos.tipoLabel}>{language === 'en' ? tipo.labelEn : tipo.label}</span>
                                    <span className={estilos.tipoMonto}>{moneda} {tipo.total.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={estilos.totalGeneral}>
                        <span>{tr('Total General:', 'Grand Total:')}</span>
                        <span className={estilos.totalMonto}>{moneda} {totalGastos.toLocaleString()}</span>
                    </div>
                </>
            )}

            {cargando ? <LoadingScreen /> : !obraSeleccionada ? (
                <div className={estilos.vacio}>
                    <ion-icon name="business-outline"></ion-icon>
                    <h3>{tr('Selecciona una obra', 'Select a project')}</h3>
                    <p>{tr('Elige una obra para ver sus gastos', 'Choose a project to view its expenses')}</p>
                </div>
            ) : gastosFiltrados.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="wallet-outline"></ion-icon>
                    <h3>{tr('No hay gastos registrados', 'No expenses recorded')}</h3>
                    <p>{tr('Registra el primer gasto de esta obra', 'Record the first expense for this project')}</p>
                    <button 
                        className={estilos.btnCrear}
                        onClick={() => { setModoEditar(false); setGastoEditar(null); setMostrarFormulario(true); cargarUsuarios(); }}
                    >
                        <ion-icon name="add-outline"></ion-icon>
                        {tr('Crear Primer Gasto', 'Create First Expense')}
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
                                        <span className={estilos.gastoTipo}>{(language === 'en' ? tipoInfo?.labelEn : tipoInfo?.label) || gasto.tipo_gasto}</span>
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
                                            <span>{tr('Quien compró:', 'Purchased by:')} {gasto.quien_compro_nombre || gasto.registrado_por_nombre || '-'}</span>
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
                                                <span>{tr('Factura:', 'Invoice:')} {gasto.numero_factura}</span>
                                            </div>
                                        )}
                                        <div className={estilos.detalle}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            <span>{(language === 'en' ? METODOS_PAGO.find(m => m.value === gasto.metodo_pago)?.labelEn : METODOS_PAGO.find(m => m.value === gasto.metodo_pago)?.label) || gasto.metodo_pago}</span>
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
                                        {tr('Ver', 'View')}
                                    </button>
                                    <button 
                                        type="button"
                                        className={estilos.btnEditar}
                                        onClick={() => abrirEditar(gasto)}
                                    >
                                        <ion-icon name="pencil-outline"></ion-icon>
                                        {tr('Editar', 'Edit')}
                                    </button>
                                    <button 
                                        className={estilos.btnEliminar}
                                        onClick={() => handleEliminar(gasto.id, gasto.concepto)}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                        {tr('Eliminar', 'Delete')}
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
                            <h3>{tr('Detalle del Gasto', 'Expense Details')}</h3>
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
                                <span className={estilos.detalleLabel}>{tr('Concepto', 'Concept')}</span>
                                <span className={estilos.detalleValor}>{gastoVer.concepto}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>{tr('Tipo', 'Type')}</span>
                                <span className={estilos.detalleValor}>{(language === 'en' ? TIPOS_GASTO.find(t => t.value === gastoVer.tipo_gasto)?.labelEn : TIPOS_GASTO.find(t => t.value === gastoVer.tipo_gasto)?.label) || gastoVer.tipo_gasto}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>{tr('Monto', 'Amount')}</span>
                                <span className={estilos.detalleValor}>{moneda} {parseFloat(gastoVer.monto).toLocaleString()}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>{tr('Fecha', 'Date')}</span>
                                <span className={estilos.detalleValor}>{gastoVer.fecha ? new Date(gastoVer.fecha).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>{tr('Quien compró', 'Purchased by')}</span>
                                <span className={estilos.detalleValor}>{gastoVer.quien_compro_nombre || gastoVer.registrado_por_nombre || '-'}</span>
                            </div>
                            {gastoVer.descripcion && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>{tr('Descripción', 'Description')}</span>
                                    <span className={estilos.detalleValor}>{gastoVer.descripcion}</span>
                                </div>
                            )}
                            {gastoVer.proveedor && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>{tr('Proveedor', 'Supplier')}</span>
                                    <span className={estilos.detalleValor}>{gastoVer.proveedor}</span>
                                </div>
                            )}
                            {gastoVer.numero_factura && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>{tr('Número factura', 'Invoice number')}</span>
                                    <span className={estilos.detalleValor}>{gastoVer.numero_factura}</span>
                                </div>
                            )}
                            <div className={estilos.detalleFila}>
                                <span className={estilos.detalleLabel}>{tr('Método de pago', 'Payment method')}</span>
                                <span className={estilos.detalleValor}>{(language === 'en' ? METODOS_PAGO.find(m => m.value === gastoVer.metodo_pago)?.labelEn : METODOS_PAGO.find(m => m.value === gastoVer.metodo_pago)?.label) || gastoVer.metodo_pago}</span>
                            </div>
                            {gastoVer.notas && (
                                <div className={estilos.detalleFila}>
                                    <span className={estilos.detalleLabel}>{tr('Notas', 'Notes')}</span>
                                    <span className={estilos.detalleValor}>{gastoVer.notas}</span>
                                </div>
                            )}
                            <div className={estilos.modalAcciones}>
                                <button type="button" className={estilos.btnEditar} onClick={() => { setGastoVer(null); abrirEditar(gastoVer); }}>
                                    <ion-icon name="pencil-outline"></ion-icon>
                                    {tr('Editar', 'Edit')}
                                </button>
                                <button type="button" className={estilos.btnCancelar} onClick={() => setGastoVer(null)}>
                                    {tr('Cerrar', 'Close')}
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
                            <h3>{modoEditar ? tr('Editar Gasto', 'Edit Expense') : tr('Nuevo Gasto', 'New Expense')}</h3>
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
                                    <label>{tr('Fecha', 'Date')} <span className={estilos.requerido}>*</span></label>
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData(prev => ({...prev, fecha: e.target.value}))}
                                        required
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>{tr('Tipo de Gasto', 'Expense Type')} <span className={estilos.requerido}>*</span></label>
                                    <select
                                        className={estilos.select}
                                        value={formData.tipo_gasto}
                                        onChange={(e) => setFormData(prev => ({...prev, tipo_gasto: e.target.value}))}
                                        required
                                    >
                                        {TIPOS_GASTO.map(tipo => (
                                            <option key={tipo.value} value={tipo.value}>
                                                {language === 'en' ? tipo.labelEn : tipo.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Concepto', 'Concept')} <span className={estilos.requerido}>*</span></label>
                                <input
                                    type="text"
                                    value={formData.concepto}
                                    onChange={(e) => setFormData(prev => ({...prev, concepto: e.target.value}))}
                                    placeholder="Ej: Compra de cemento"
                                    required
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Descripcion', 'Description')}</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData(prev => ({...prev, descripcion: e.target.value}))}
                                    placeholder="Detalles adicionales..."
                                    rows="2"
                                />
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Monto', 'Amount')} <span className={estilos.requerido}>*</span></label>
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
                                    <label>{tr('Proveedor', 'Supplier')}</label>
                                    <input
                                        type="text"
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData(prev => ({...prev, proveedor: e.target.value}))}
                                        placeholder="Nombre del proveedor"
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>{tr('Numero de Factura', 'Invoice Number')}</label>
                                    <input
                                        type="text"
                                        value={formData.numero_factura}
                                        onChange={(e) => setFormData(prev => ({...prev, numero_factura: e.target.value}))}
                                        placeholder="Numero factura"
                                    />
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Quien compró', 'Purchased by')}</label>
                                <select
                                    className={estilos.select}
                                    value={formData.quien_compro_id}
                                    onChange={(e) => setFormData(prev => ({...prev, quien_compro_id: e.target.value}))}
                                >
                                    <option value="">{tr('Quien registra', 'Who registers')}</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Metodo de Pago', 'Payment Method')} <span className={estilos.requerido}>*</span></label>
                                <select
                                    className={estilos.select}
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData(prev => ({...prev, metodo_pago: e.target.value}))}
                                    required
                                >
                                    {METODOS_PAGO.map(metodo => (
                                        <option key={metodo.value} value={metodo.value}>
                                            {language === 'en' ? metodo.labelEn : metodo.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('Notas Adicionales', 'Additional Notes')}</label>
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
                                    {tr('Cancelar', 'Cancel')}
                                </button>
                                <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                                    {guardando ? (
                                        <>
                                            <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                            {tr('Guardando...', 'Saving...')}
                                        </>
                                    ) : (
                                        <>
                                            <ion-icon name="save-outline"></ion-icon>
                                            {modoEditar ? tr('Actualizar Gasto', 'Update Expense') : tr('Registrar Gasto', 'Register Expense')}
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
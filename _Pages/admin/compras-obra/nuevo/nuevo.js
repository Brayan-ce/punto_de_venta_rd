"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearCompraObra, obtenerObrasParaCompra, obtenerServiciosParaCompra, obtenerProveedores } from '../servidor'
import { crearProveedor } from '../../proveedores/servidor'
import { AutocompletadoMaterial, MaterialesRecientes, SelectorPlantilla, SubidaArchivos, ModalCrearProveedor } from './components'
import estilos from './nuevo.module.css'

export default function NuevaCompraObra() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [formData, setFormData] = useState({
        tipo_destino: 'obra',
        destino_id: '',
        proveedor_id: '',
        numero_factura: '',
        tipo_comprobante: '',
        subtotal: '',
        impuesto: '',
        total: '',
        forma_pago: 'efectivo',
        tipo_compra: 'planificada',
        fecha_compra: new Date().toISOString().split('T')[0],
        notas: ''
    })
    const [detalle, setDetalle] = useState([])
    const [obras, setObras] = useState([])
    const [servicios, setServicios] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [errors, setErrors] = useState({})
    const [procesando, setProcesando] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [mostrarPlantillas, setMostrarPlantillas] = useState(false)
    const [archivos, setArchivos] = useState([])
    const [showModalProveedor, setShowModalProveedor] = useState(false)

    const [nuevoItem, setNuevoItem] = useState({
        material_nombre: '',
        material_descripcion: '',
        unidad_medida: '',
        cantidad: '',
        precio_unitario: '',
        categoria_material_id: null,
        material_id: null
    })

    useEffect(() => {
        // Cargar tema desde localStorage
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
        cargarDatos()
    }, [])

    async function cargarDatos() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:68',message:'cargarDatos ENTRY',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const [resObras, resServicios, resProveedores] = await Promise.all([
            obtenerObrasParaCompra(),
            obtenerServiciosParaCompra(),
            obtenerProveedores()
        ])
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:74',message:'cargarDatos RESPONSES',data:{obras:resObras?.success,obrasCount:resObras?.obras?.length,servicios:resServicios?.success,serviciosCount:resServicios?.servicios?.length,proveedores:resProveedores?.success,proveedoresCount:resProveedores?.proveedores?.length,proveedoresError:resProveedores?.mensaje},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
        // #endregion
        
        if (resObras.success) {
            setObras(resObras.obras || [])
        }
        if (resServicios.success) {
            setServicios(resServicios.servicios || [])
        }
        if (resProveedores.success) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:82',message:'setProveedores CALL',data:{proveedores:resProveedores.proveedores?.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            setProveedores(resProveedores.proveedores || [])
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:85',message:'proveedores FAILED',data:{error:resProveedores?.mensaje},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
            // #endregion
        }
        setCargando(false)
    }

    const handleProveedorCreado = async (nuevoProveedor) => {
        console.log('handleProveedorCreado llamado con:', nuevoProveedor)
        try {
            // Recargar lista de proveedores
            const resProveedores = await obtenerProveedores()
            console.log('Proveedores recargados:', resProveedores)
            if (resProveedores.success) {
                setProveedores(resProveedores.proveedores || [])
                // Seleccionar automáticamente el nuevo proveedor
                setFormData(prev => ({
                    ...prev,
                    proveedor_id: nuevoProveedor.id.toString()
                }))
                console.log('Proveedor seleccionado:', nuevoProveedor.id)
            } else {
                console.error('Error al recargar proveedores:', resProveedores.mensaje)
            }
        } catch (error) {
            console.error('Error en handleProveedorCreado:', error)
        }
        setShowModalProveedor(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => {
            const nuevo = { ...prev, [name]: value }
            // Si cambia tipo_destino, limpiar destino_id
            if (name === 'tipo_destino') {
                nuevo.destino_id = ''
            }
            return nuevo
        })
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleMaterialSelect = (materialData) => {
        setNuevoItem(prev => ({
            ...prev,
            material_nombre: materialData.material_nombre,
            unidad_medida: materialData.unidad_medida || prev.unidad_medida,
            categoria_material_id: materialData.categoria_id || null,
            material_id: materialData.material_id || null,
            precio_unitario: materialData.precio_sugerido ? materialData.precio_sugerido.toString() : prev.precio_unitario
        }))
    }

    const handleMaterialRecienteSelect = (materialData) => {
        setNuevoItem(prev => ({
            ...prev,
            material_nombre: materialData.material_nombre,
            unidad_medida: materialData.unidad_medida || prev.unidad_medida,
            categoria_material_id: materialData.categoria_id || null
        }))
    }

    const handlePlantillaSelect = (materiales) => {
        setDetalle(materiales.map(m => ({
            ...m,
            cantidad: m.cantidad || 0,
            precio_unitario: m.precio_unitario || 0,
            subtotal: (m.cantidad || 0) * (m.precio_unitario || 0)
        })))
        calcularTotales()
    }

    const agregarItem = () => {
        if (!nuevoItem.material_nombre || !nuevoItem.cantidad || !nuevoItem.precio_unitario) {
            setErrors(prev => ({ ...prev, detalle: 'Complete todos los campos obligatorios del material' }))
            return
        }

        const cantidad = parseFloat(nuevoItem.cantidad)
        const precio = parseFloat(nuevoItem.precio_unitario)

        if (cantidad <= 0 || precio <= 0) {
            setErrors(prev => ({ ...prev, detalle: 'La cantidad y el precio deben ser mayores a cero' }))
            return
        }

        const subtotal = cantidad * precio
        setDetalle([...detalle, {
            material_nombre: nuevoItem.material_nombre,
            material_descripcion: nuevoItem.material_descripcion || '',
            unidad_medida: nuevoItem.unidad_medida || '',
            cantidad: cantidad,
            precio_unitario: precio,
            subtotal: subtotal,
            categoria_material_id: nuevoItem.categoria_material_id || null,
            material_id: nuevoItem.material_id || null
        }])

        // Limpiar errores
        if (errors.detalle) {
            setErrors(prev => ({ ...prev, detalle: '' }))
        }

        setNuevoItem({
            material_nombre: '',
            material_descripcion: '',
            unidad_medida: '',
            cantidad: '',
            precio_unitario: '',
            categoria_material_id: null,
            material_id: null
        })
    }

    const eliminarItem = (index) => {
        setDetalle(detalle.filter((_, i) => i !== index))
        calcularTotales()
    }

    const calcularTotales = () => {
        const subtotal = detalle.reduce((sum, item) => sum + (item.subtotal || 0), 0)
        const impuesto = subtotal * 0.18 // ITBIS 18%
        const total = subtotal + impuesto
        
        setFormData(prev => ({
            ...prev,
            subtotal: subtotal.toFixed(2),
            impuesto: impuesto.toFixed(2),
            total: total.toFixed(2)
        }))
    }

    useEffect(() => {
        calcularTotales()
    }, [detalle])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validaciones mejoradas
        const nuevosErrores = {}
        
        if (!formData.tipo_destino) {
            nuevosErrores.tipo_destino = 'Debe seleccionar un tipo de destino'
        }
        
        if (formData.tipo_destino !== 'stock_general' && !formData.destino_id) {
            const tipoTexto = formData.tipo_destino === 'obra' ? 'una obra' : 'un servicio'
            nuevosErrores.destino_id = `Debe seleccionar ${tipoTexto}`
        }
        
        if (!formData.proveedor_id) {
            nuevosErrores.proveedor_id = 'Debe seleccionar un proveedor'
        }
        
        if (!formData.numero_factura || formData.numero_factura.trim() === '') {
            nuevosErrores.numero_factura = 'El número de factura es obligatorio'
        }
        
        if (detalle.length === 0) {
            nuevosErrores.detalle = 'Debe agregar al menos un material'
        }

        setErrors(nuevosErrores)
        
        if (Object.keys(nuevosErrores).length > 0) {
            return
        }

        setProcesando(true)
        try {
            const datos = {
                ...formData,
                destino_id: formData.tipo_destino === 'stock_general' ? null : parseInt(formData.destino_id),
                proveedor_id: parseInt(formData.proveedor_id),
                subtotal: parseFloat(formData.subtotal),
                impuesto: parseFloat(formData.impuesto),
                total: parseFloat(formData.total),
                detalle,
                archivos
            }
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:232',message:'handleSubmit BEFORE API CALL',data:{tipo_destino:datos.tipo_destino,destino_id:datos.destino_id,proveedor_id:datos.proveedor_id,numero_factura:datos.numero_factura,detalleCount:datos.detalle?.length,total:datos.total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
            // #endregion
            
            const res = await crearCompraObra(datos)
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:243',message:'handleSubmit API RESPONSE',data:{success:res?.success,mensaje:res?.mensaje,id:res?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
            // #endregion
            
            if (res.success) {
                alert('Compra registrada exitosamente')
                router.push('/admin/compras-obra')
            } else {
                alert(res.mensaje || 'Error al registrar compra')
            }
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/105a53c3-dc11-4849-aa2d-b5ff204596b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'nuevo.js:251',message:'handleSubmit EXCEPTION',data:{error:error?.message,stack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
            // #endregion
            console.error('Error:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const destinosDisponibles = formData.tipo_destino === 'obra' ? obras : 
                                formData.tipo_destino === 'servicio' ? servicios : []

    const formatearMoneda = (monto) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency',
            currency: 'DOP',
            minimumFractionDigits: 2
        }).format(monto || 0)
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <p>Cargando formulario...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <h1 className={estilos.titulo}>
                    <ion-icon name="cart-outline"></ion-icon>
                    Nueva Compra de Obra
                </h1>
                <button onClick={() => router.back()} className={estilos.btnVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                {/* Sección Destino */}
                <div className={estilos.seccion}>
                    <h2>
                        <ion-icon name="location-outline"></ion-icon>
                        Destino de la Compra
                    </h2>
                    
                    <div className={estilos.radioGroup}>
                        <label className={`${estilos.radioLabel} ${formData.tipo_destino === 'obra' ? estilos.radioActivo : ''}`}>
                            <input
                                type="radio"
                                name="tipo_destino"
                                value="obra"
                                checked={formData.tipo_destino === 'obra'}
                                onChange={handleChange}
                            />
                            <ion-icon name="construct-outline"></ion-icon>
                            <span>Obra</span>
                        </label>
                        <label className={`${estilos.radioLabel} ${formData.tipo_destino === 'servicio' ? estilos.radioActivo : ''}`}>
                            <input
                                type="radio"
                                name="tipo_destino"
                                value="servicio"
                                checked={formData.tipo_destino === 'servicio'}
                                onChange={handleChange}
                            />
                            <ion-icon name="flash-outline"></ion-icon>
                            <span>Servicio</span>
                        </label>
                        <label className={`${estilos.radioLabel} ${formData.tipo_destino === 'stock_general' ? estilos.radioActivo : ''}`}>
                            <input
                                type="radio"
                                name="tipo_destino"
                                value="stock_general"
                                checked={formData.tipo_destino === 'stock_general'}
                                onChange={handleChange}
                            />
                            <ion-icon name="cube-outline"></ion-icon>
                            <span>Stock General</span>
                        </label>
                    </div>

                    {formData.tipo_destino !== 'stock_general' && (
                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                {formData.tipo_destino === 'obra' ? 'Obra' : 'Servicio'} <span className={estilos.requerido}>*</span>
                            </label>
                            <select
                                name="destino_id"
                                value={formData.destino_id}
                                onChange={handleChange}
                                className={`${estilos.select} ${errors.destino_id ? estilos.inputError : ''}`}
                            >
                                <option value="">Seleccionar {formData.tipo_destino === 'obra' ? 'obra' : 'servicio'}...</option>
                                {destinosDisponibles.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.codigo_obra || item.codigo_servicio} - {item.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.destino_id && (
                                <span className={estilos.errorMsg}>{errors.destino_id}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Datos de la Compra */}
                <div className={estilos.grid}>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>
                            Proveedor <span className={estilos.requerido}>*</span>
                        </label>
                        {proveedores.length === 0 ? (
                            <div className={estilos.alertaError}>
                                <ion-icon name="alert-circle-outline"></ion-icon>
                                <div>
                                    <strong>No hay proveedores disponibles</strong>
                                    <p>Debes crear al menos un proveedor antes de registrar una compra.</p>
                                    <button
                                        type="button"
                                        className={estilos.btnCrearProveedor}
                                        onClick={() => setShowModalProveedor(true)}
                                    >
                                        <ion-icon name="add-circle-outline"></ion-icon>
                                        Crear Proveedor
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <select
                                    name="proveedor_id"
                                    value={formData.proveedor_id}
                                    onChange={handleChange}
                                    className={`${estilos.select} ${errors.proveedor_id ? estilos.inputError : ''}`}
                                >
                                    <option value="">Seleccionar proveedor...</option>
                                    {proveedores.map(prov => (
                                        <option key={prov.id} value={prov.id}>
                                            {prov.nombre_comercial || prov.razon_social}
                                        </option>
                                    ))}
                                </select>
                                {errors.proveedor_id && (
                                    <span className={estilos.errorMsg}>{errors.proveedor_id}</span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className={estilos.grid}>
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>
                            Número de Factura <span className={estilos.requerido}>*</span>
                        </label>
                        <input
                            type="text"
                            name="numero_factura"
                            value={formData.numero_factura}
                            onChange={handleChange}
                            className={`${estilos.input} ${errors.numero_factura ? estilos.inputError : ''}`}
                            placeholder="NCF o número de factura"
                        />
                        {errors.numero_factura && (
                            <span className={estilos.errorMsg}>{errors.numero_factura}</span>
                        )}
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Fecha de Compra</label>
                        <input
                            type="date"
                            name="fecha_compra"
                            value={formData.fecha_compra}
                            onChange={handleChange}
                            className={estilos.input}
                        />
                    </div>
                </div>

                <div className={estilos.grid}>
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Forma de Pago</label>
                        <select
                            name="forma_pago"
                            value={formData.forma_pago}
                            onChange={handleChange}
                            className={estilos.select}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="tarjeta_debito">Tarjeta Débito</option>
                            <option value="tarjeta_credito">Tarjeta Crédito</option>
                            <option value="cheque">Cheque</option>
                            <option value="credito">Crédito</option>
                        </select>
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Tipo de Compra</label>
                        <select
                            name="tipo_compra"
                            value={formData.tipo_compra}
                            onChange={handleChange}
                            className={estilos.select}
                        >
                            <option value="planificada">Planificada</option>
                            <option value="imprevista">Imprevista</option>
                        </select>
                    </div>
                </div>

                {/* Detalle de Materiales */}
                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h2>
                            <ion-icon name="cube-outline"></ion-icon>
                            Materiales
                        </h2>
                        {formData.tipo_destino && formData.tipo_destino !== 'stock_general' && (
                            <button
                                type="button"
                                className={estilos.btnPlantilla}
                                onClick={() => setMostrarPlantillas(true)}
                            >
                                <ion-icon name="document-text-outline"></ion-icon>
                                <span>Usar Plantilla</span>
                            </button>
                        )}
                    </div>

                    {errors.detalle && (
                        <div className={estilos.alertaError}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <span>{errors.detalle}</span>
                        </div>
                    )}

                    <MaterialesRecientes
                        onSelect={handleMaterialRecienteSelect}
                        tema={tema}
                    />
                    
                    <div className={estilos.agregarItem}>
                        <div className={estilos.inputMaterial}>
                            <AutocompletadoMaterial
                                value={nuevoItem.material_nombre}
                                onChange={(value) => setNuevoItem(prev => ({ ...prev, material_nombre: value }))}
                                onSelect={handleMaterialSelect}
                                proveedorId={formData.proveedor_id ? parseInt(formData.proveedor_id) : null}
                                tema={tema}
                                placeholder="Buscar material..."
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Unidad (ej: m², kg)"
                            value={nuevoItem.unidad_medida}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, unidad_medida: e.target.value }))}
                            className={estilos.input}
                        />
                        <input
                            type="number"
                            placeholder="Cantidad *"
                            value={nuevoItem.cantidad}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad: e.target.value }))}
                            className={estilos.input}
                            step="0.01"
                            min="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Precio unit. *"
                            value={nuevoItem.precio_unitario}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, precio_unitario: e.target.value }))}
                            className={estilos.input}
                            step="0.01"
                            min="0.01"
                        />
                        <button type="button" onClick={agregarItem} className={estilos.btnAgregar}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>Agregar</span>
                        </button>
                    </div>

                    {detalle.length > 0 ? (
                        <div className={estilos.tablaDetalle}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Unidad</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unit.</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.map((item, index) => (
                                        <tr key={index}>
                                            <td><strong>{item.material_nombre}</strong></td>
                                            <td>{item.unidad_medida || '-'}</td>
                                            <td>{item.cantidad}</td>
                                            <td>{formatearMoneda(item.precio_unitario)}</td>
                                            <td><strong>{formatearMoneda(item.subtotal)}</strong></td>
                                            <td>
                                                <button 
                                                    type="button" 
                                                    onClick={() => eliminarItem(index)}
                                                    className={estilos.btnEliminar}
                                                >
                                                    <ion-icon name="trash-outline"></ion-icon>
                                                    <span>Eliminar</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={estilos.vacio}>
                            <div className={estilos.ilustracionWrapper}>
                                <img 
                                    src="/illustrations3D/_0006.svg" 
                                    alt="Ilustración materiales" 
                                    className={estilos.ilustracion3D}
                                />
                            </div>
                            <p>No hay materiales agregados</p>
                            <small>Agrega materiales usando el formulario de arriba</small>
                        </div>
                    )}
                </div>

                {/* Totales */}
                {detalle.length > 0 && (
                    <div className={estilos.totales}>
                        <div>
                            <label>Subtotal:</label>
                            <span>{formatearMoneda(formData.subtotal)}</span>
                        </div>
                        <div>
                            <label>ITBIS (18%):</label>
                            <span>{formatearMoneda(formData.impuesto)}</span>
                        </div>
                        <div className={estilos.total}>
                            <label>Total a Pagar:</label>
                            <span>{formatearMoneda(formData.total)}</span>
                        </div>
                    </div>
                )}

                {/* Archivos */}
                <div className={estilos.seccion}>
                    <h2>
                        <ion-icon name="document-attach-outline"></ion-icon>
                        Documentos Adjuntos
                    </h2>
                    <SubidaArchivos
                        archivos={archivos}
                        onChange={setArchivos}
                        tema={tema}
                    />
                </div>

                <div className={estilos.grupo}>
                    <label className={estilos.label}>Notas</label>
                    <textarea
                        name="notas"
                        value={formData.notas}
                        onChange={handleChange}
                        className={estilos.textarea}
                        rows="3"
                        placeholder="Observaciones adicionales..."
                    />
                </div>

                {/* Modal de Plantillas */}
                <SelectorPlantilla
                    tipoDestino={formData.tipo_destino}
                    onSelect={handlePlantillaSelect}
                    tema={tema}
                    isOpen={mostrarPlantillas}
                    onClose={() => setMostrarPlantillas(false)}
                />

                {/* Modal de Crear Proveedor */}
                <ModalCrearProveedor
                    isOpen={showModalProveedor}
                    onClose={() => setShowModalProveedor(false)}
                    onProveedorCreado={handleProveedorCreado}
                    tema={tema}
                />

                <div className={estilos.acciones}>
                    <button type="button" onClick={() => router.back()} className={estilos.btnCancelar}>
                        <ion-icon name="close-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>
                    <button type="submit" disabled={procesando || detalle.length === 0} className={estilos.btnGuardar}>
                        <ion-icon name={procesando ? "hourglass-outline" : "checkmark-circle-outline"}></ion-icon>
                        <span>{procesando ? 'Guardando...' : 'Guardar Compra'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}


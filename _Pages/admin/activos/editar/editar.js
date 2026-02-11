"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerActivoPorId, obtenerProductosRastreables, actualizarActivo } from './servidor'
import estilos from './editar.module.css'

export default function EditarActivoAdmin() {
    const router = useRouter()
    const params = useParams()
    const activoId = params.id
    
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    const [productos, setProductos] = useState([])
    const [productoId, setProductoId] = useState('')
    const [numeroSerie, setNumeroSerie] = useState('')
    const [color, setColor] = useState('')
    const [anioFabricacion, setAnioFabricacion] = useState('')
    const [precioCompra, setPrecioCompra] = useState('')
    const [fechaCompra, setFechaCompra] = useState('')
    const [estado, setEstado] = useState('en_stock')
    const [ubicacion, setUbicacion] = useState('')
    
    // Campos opcionales
    const [vin, setVin] = useState('')
    const [numeroMotor, setNumeroMotor] = useState('')
    const [numeroPlaca, setNumeroPlaca] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [mostrarOpcionales, setMostrarOpcionales] = useState(false)

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
        cargarDatos()
    }, [activoId])

    const cargarDatos = async () => {
        try {
            const [resultadoActivo, resultadoProductos] = await Promise.all([
                obtenerActivoPorId(activoId),
                obtenerProductosRastreables()
            ])

            if (resultadoActivo.success) {
                const activo = resultadoActivo.activo
                setProductoId(activo.producto_id?.toString() || '')
                setNumeroSerie(activo.numero_serie || '')
                setColor(activo.color || '')
                setAnioFabricacion(activo.anio_fabricacion?.toString() || '')
                setPrecioCompra(activo.precio_compra?.toString() || '')
                setFechaCompra(activo.fecha_compra || '')
                setEstado(activo.estado || 'en_stock')
                setUbicacion(activo.ubicacion || '')
                setVin(activo.vin || '')
                setNumeroMotor(activo.numero_motor || '')
                setNumeroPlaca(activo.numero_placa || '')
                setObservaciones(activo.observaciones || '')
                
                // Mostrar opcionales si hay datos
                if (activo.vin || activo.numero_motor || activo.numero_placa || activo.observaciones) {
                    setMostrarOpcionales(true)
                }
            } else {
                alert(resultadoActivo.mensaje || 'Error al cargar activo')
                router.push('/admin/activos')
            }

            if (resultadoProductos.success) {
                setProductos(resultadoProductos.productos)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/activos')
        } finally {
            setCargando(false)
        }
    }

    const coloresComunes = ['Negro', 'Blanco', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo']

    const manejarSubmit = async (e) => {
        e.preventDefault()
        
        if (!productoId) {
            alert('El producto es obligatorio')
            return
        }

        if (!numeroSerie.trim()) {
            alert('El número de serie es obligatorio')
            return
        }

        // Validar precio de compra
        const precioCompraNum = precioCompra ? parseFloat(precioCompra) : null
        if (precioCompraNum !== null && (isNaN(precioCompraNum) || precioCompraNum < 0)) {
            alert('El precio de compra debe ser un número válido mayor o igual a 0')
            return
        }

        // Validar año de fabricación
        const anioFabricacionNum = anioFabricacion ? parseInt(anioFabricacion) : null
        if (anioFabricacionNum !== null && (isNaN(anioFabricacionNum) || anioFabricacionNum < 1900 || anioFabricacionNum > new Date().getFullYear() + 1)) {
            alert('El año de fabricación debe ser un número válido')
            return
        }

        setProcesando(true)
        try {
            const datos = {
                producto_id: parseInt(productoId),
                numero_serie: numeroSerie.trim(),
                color: color.trim() || null,
                anio_fabricacion: anioFabricacionNum,
                precio_compra: precioCompraNum,
                fecha_compra: fechaCompra || null,
                estado,
                ubicacion: ubicacion.trim() || null,
                vin: vin.trim() || null,
                numero_motor: numeroMotor.trim() || null,
                numero_placa: numeroPlaca.trim() || null,
                observaciones: observaciones.trim() || null
            }

            const resultado = await actualizarActivo(activoId, datos)

            if (resultado.success) {
                alert(resultado.mensaje || 'Activo actualizado exitosamente')
                router.push('/admin/activos')
            } else {
                alert(resultado.mensaje || 'Error al actualizar activo')
            }
        } catch (error) {
            console.error('Error al actualizar activo:', error)
            alert('Error al actualizar activo')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando activo...</span>
                </div>
            </div>
        )
    }

    const productoSeleccionado = productos?.find(p => p.id === parseInt(productoId))

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Editar Activo</h1>
                    <p className={estilos.subtitulo}>Actualiza la información del activo</p>
                </div>
                <button
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/activos')}
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                {/* Campos principales */}
                <div className={estilos.seccionPrincipal}>
                    <div className={estilos.grupoInput}>
                        <label className={estilos.label}>
                            Producto *
                            <span className={estilos.requerido}>Obligatorio</span>
                        </label>
                        <select
                            value={productoId}
                            onChange={(e) => setProductoId(e.target.value)}
                            className={estilos.select}
                            required
                            disabled
                        >
                            <option value="">Seleccione un producto</option>
                            {productos?.map(producto => (
                                <option key={producto.id} value={producto.id}>
                                    {producto.nombre} {producto.sku ? `(${producto.sku})` : ''}
                                </option>
                            ))}
                        </select>
                        <small className={estilos.ayuda}>El producto no se puede cambiar después de crear el activo</small>
                    </div>

                    <div className={estilos.grupoInput}>
                        <label className={estilos.label}>
                            Número de Serie/Chasis *
                            <span className={estilos.requerido}>Obligatorio</span>
                        </label>
                        <input
                            type="text"
                            value={numeroSerie}
                            onChange={(e) => setNumeroSerie(e.target.value)}
                            className={estilos.input}
                            required
                            placeholder="Ej: CHS-2024-001 o IMEI"
                        />
                    </div>

                    <div className={estilos.gridDos}>
                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Color</label>
                            <div className={estilos.inputConSugerencias}>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className={estilos.input}
                                    placeholder="Ej: Negro"
                                    list="colores-comunes"
                                />
                                <datalist id="colores-comunes">
                                    {coloresComunes.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Año de Fabricación</label>
                            <input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                value={anioFabricacion}
                                onChange={(e) => setAnioFabricacion(e.target.value)}
                                className={estilos.input}
                                placeholder={new Date().getFullYear().toString()}
                            />
                        </div>
                    </div>

                    <div className={estilos.gridDos}>
                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Precio de Compra *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={precioCompra}
                                onChange={(e) => setPrecioCompra(e.target.value)}
                                className={estilos.input}
                                required
                                placeholder="0.00"
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Fecha de Compra</label>
                            <input
                                type="date"
                                value={fechaCompra}
                                onChange={(e) => setFechaCompra(e.target.value)}
                                className={estilos.input}
                            />
                        </div>
                    </div>

                    <div className={estilos.gridDos}>
                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Estado *</label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className={estilos.select}
                                required
                            >
                                <option value="en_stock">✓ En Stock</option>
                                <option value="asignado">Asignado</option>
                                <option value="financiado">💳 Financiado</option>
                                <option value="vendido">💰 Vendido</option>
                                <option value="mantenimiento">🔧 Mantenimiento</option>
                                <option value="devuelto">↩ Devuelto</option>
                                <option value="dado_baja">❌ Dado de Baja</option>
                            </select>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Ubicación</label>
                            <input
                                type="text"
                                value={ubicacion}
                                onChange={(e) => setUbicacion(e.target.value)}
                                className={estilos.input}
                                placeholder={productoSeleccionado?.ubicacion_bodega || "Bodega Principal"}
                            />
                        </div>
                    </div>
                </div>

                {/* Botón para mostrar campos opcionales */}
                <button
                    type="button"
                    className={estilos.btnMostrarOpcionales}
                    onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
                >
                    <ion-icon name={mostrarOpcionales ? "chevron-up-outline" : "chevron-down-outline"}></ion-icon>
                    <span>{mostrarOpcionales ? 'Ocultar' : 'Mostrar'} Detalles Adicionales (Opcional)</span>
                </button>

                {/* Campos opcionales (colapsables) */}
                {mostrarOpcionales && (
                    <div className={estilos.seccionOpcional}>
                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>VIN (Vehicle Identification Number)</label>
                            <input
                                type="text"
                                value={vin}
                                onChange={(e) => setVin(e.target.value)}
                                className={estilos.input}
                                placeholder="Ej: 1HGBH41JXMN109186"
                            />
                        </div>

                        <div className={estilos.gridDos}>
                            <div className={estilos.grupoInput}>
                                <label className={estilos.label}>Número de Motor</label>
                                <input
                                    type="text"
                                    value={numeroMotor}
                                    onChange={(e) => setNumeroMotor(e.target.value)}
                                    className={estilos.input}
                                    placeholder="Ej: MOT123456"
                                />
                            </div>

                            <div className={estilos.grupoInput}>
                                <label className={estilos.label}>Número de Placa</label>
                                <input
                                    type="text"
                                    value={numeroPlaca}
                                    onChange={(e) => setNumeroPlaca(e.target.value)}
                                    className={estilos.input}
                                    placeholder="Ej: ABC-1234"
                                />
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label className={estilos.label}>Observaciones</label>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                className={estilos.textarea}
                                rows="3"
                                placeholder="Notas adicionales sobre este activo..."
                            />
                        </div>
                    </div>
                )}

                <div className={estilos.footerFormulario}>
                    <button
                        type="button"
                        className={estilos.btnCancelarForm}
                        onClick={() => router.push('/admin/activos')}
                        disabled={procesando}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={estilos.btnGuardar}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline"></ion-icon>
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                Actualizar Activo
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}


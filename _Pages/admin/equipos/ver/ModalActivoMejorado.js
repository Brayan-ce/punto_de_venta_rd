import { useState } from 'react'
import estilos from './ver.module.css'

export default function ModalActivoMejorado({ 
    activoEditando, 
    equipo,
    tema,
    onCerrar, 
    onGuardar,
    procesando 
}) {
    const [numeroSerie, setNumeroSerie] = useState(activoEditando?.numero_serie || '')
    const [color, setColor] = useState(activoEditando?.color || '')
    const [anioFabricacion, setAnioFabricacion] = useState(activoEditando?.anio_fabricacion || '')
    const [precioCompra, setPrecioCompra] = useState(activoEditando?.precio_compra || equipo?.precio_compra || '')
    const [fechaCompra, setFechaCompra] = useState(activoEditando?.fecha_compra || '')
    const [estado, setEstado] = useState(activoEditando?.estado || 'en_stock')
    const [ubicacion, setUbicacion] = useState(activoEditando?.ubicacion || equipo?.ubicacion_bodega || '')
    
    // Campos opcionales
    const [vin, setVin] = useState(activoEditando?.vin || '')
    const [numeroMotor, setNumeroMotor] = useState(activoEditando?.numero_motor || '')
    const [numeroPlaca, setNumeroPlaca] = useState(activoEditando?.numero_placa || '')
    const [observaciones, setObservaciones] = useState(activoEditando?.observaciones || '')
    const [mostrarOpcionales, setMostrarOpcionales] = useState(false)

    const coloresComunes = ['Negro', 'Blanco', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo']

    const manejarSubmit = (e) => {
        e.preventDefault()
        
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

        const datos = {
            producto_id: equipo.id,
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

        onGuardar(datos, activoEditando?.id)
    }

    return (
        <div className={estilos.modal} onClick={onCerrar}>
            <div className={`${estilos.modalContenido} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h3 className={estilos.modalTitulo}>
                        <ion-icon name="cube-outline"></ion-icon>
                        {activoEditando ? 'Editar Activo' : 'Nuevo Activo'}
                    </h3>
                    <button className={estilos.btnCerrarModal} onClick={onCerrar} type="button">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.modalForm}>
                    {/* Campos principales */}
                    <div className={estilos.seccionPrincipal}>
                        <div className={estilos.modalGrupoInput}>
                            <label className={estilos.modalLabel}>
                                Número de Serie/Chasis *
                                <span className={estilos.requerido}>Obligatorio</span>
                            </label>
                            <input
                                type="text"
                                value={numeroSerie}
                                onChange={(e) => setNumeroSerie(e.target.value)}
                                className={estilos.modalInput}
                                required
                                placeholder="Ej: CHS-2024-001 o IMEI"
                                autoFocus
                            />
                        </div>

                        <div className={estilos.gridDos}>
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Color</label>
                                <div className={estilos.inputConSugerencias}>
                                    <input
                                        type="text"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className={estilos.modalInput}
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

                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Año de Fabricación</label>
                                <input
                                    type="number"
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    value={anioFabricacion}
                                    onChange={(e) => setAnioFabricacion(e.target.value)}
                                    className={estilos.modalInput}
                                    placeholder={new Date().getFullYear().toString()}
                                />
                            </div>
                        </div>

                        <div className={estilos.gridDos}>
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Precio de Compra *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={precioCompra}
                                    onChange={(e) => setPrecioCompra(e.target.value)}
                                    className={estilos.modalInput}
                                    required
                                    placeholder="0.00"
                                />
                            </div>

                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Fecha de Compra</label>
                                <input
                                    type="date"
                                    value={fechaCompra}
                                    onChange={(e) => setFechaCompra(e.target.value)}
                                    className={estilos.modalInput}
                                />
                            </div>
                        </div>

                        <div className={estilos.gridDos}>
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Estado *</label>
                                <select
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    className={estilos.modalSelect}
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

                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Ubicación</label>
                                <input
                                    type="text"
                                    value={ubicacion}
                                    onChange={(e) => setUbicacion(e.target.value)}
                                    className={estilos.modalInput}
                                    placeholder={equipo?.ubicacion_bodega || "Bodega Principal"}
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
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>VIN (Vehicle Identification Number)</label>
                                <input
                                    type="text"
                                    value={vin}
                                    onChange={(e) => setVin(e.target.value)}
                                    className={estilos.modalInput}
                                    placeholder="Ej: 1HGBH41JXMN109186"
                                />
                            </div>

                            <div className={estilos.gridDos}>
                                <div className={estilos.modalGrupoInput}>
                                    <label className={estilos.modalLabel}>Número de Motor</label>
                                    <input
                                        type="text"
                                        value={numeroMotor}
                                        onChange={(e) => setNumeroMotor(e.target.value)}
                                        className={estilos.modalInput}
                                        placeholder="Ej: MOT123456"
                                    />
                                </div>

                                <div className={estilos.modalGrupoInput}>
                                    <label className={estilos.modalLabel}>Número de Placa</label>
                                    <input
                                        type="text"
                                        value={numeroPlaca}
                                        onChange={(e) => setNumeroPlaca(e.target.value)}
                                        className={estilos.modalInput}
                                        placeholder="Ej: ABC-1234"
                                    />
                                </div>
                            </div>

                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Observaciones</label>
                                <textarea
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className={estilos.modalTextarea}
                                    rows="3"
                                    placeholder="Notas adicionales sobre este activo..."
                                />
                            </div>
                        </div>
                    )}

                    <div className={estilos.modalFooter}>
                        <button
                            type="button"
                            className={estilos.modalBtnCancelar}
                            onClick={onCerrar}
                            disabled={procesando}
                        >
                            <ion-icon name="close-circle-outline"></ion-icon>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={estilos.modalBtnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    {activoEditando ? 'Actualizar' : 'Guardar Activo'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


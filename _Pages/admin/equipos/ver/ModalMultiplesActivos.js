import { useState } from 'react'
import estilos from './ver.module.css'

export default function ModalMultiplesActivos({ 
    equipo,
    tema,
    onCerrar, 
    onGuardarMultiples,
    procesando 
}) {
    const [cantidad, setCantidad] = useState(1)
    const [seriesTexto, setSeriesTexto] = useState('')
    const [prefijoSerie, setPrefijoSerie] = useState('')
    const [numeroInicio, setNumeroInicio] = useState(1)
    const [color, setColor] = useState('')
    const [anioFabricacion, setAnioFabricacion] = useState(new Date().getFullYear().toString())
    const [precioCompra, setPrecioCompra] = useState(equipo?.precio_compra || '')
    const [fechaCompra, setFechaCompra] = useState('')
    const [ubicacion, setUbicacion] = useState(equipo?.ubicacion_bodega || '')
    const [modoIngreso, setModoIngreso] = useState('auto') // 'auto' o 'manual'

    const coloresComunes = ['Negro', 'Blanco', 'Gris', 'Plata', 'Azul', 'Rojo', 'Verde', 'Amarillo']

    const generarVistaPreviaSeries = () => {
        if (modoIngreso === 'manual') {
            const series = seriesTexto.split('\n').filter(s => s.trim())
            return series
        } else {
            const series = []
            for (let i = 0; i < cantidad; i++) {
                const numero = (parseInt(numeroInicio) + i).toString().padStart(4, '0')
                series.push(`${prefijoSerie}${numero}`)
            }
            return series
        }
    }

    const seriesGeneradas = generarVistaPreviaSeries()

    const manejarSubmit = (e) => {
        e.preventDefault()

        if (seriesGeneradas.length === 0) {
            alert('Debes ingresar al menos un número de serie')
            return
        }

        if (!precioCompra) {
            alert('El precio de compra es obligatorio')
            return
        }

        const datosComunes = {
            producto_id: equipo.id,
            color: color.trim() || null,
            anio_fabricacion: anioFabricacion ? parseInt(anioFabricacion) : null,
            precio_compra: parseFloat(precioCompra),
            fecha_compra: fechaCompra || null,
            estado: 'en_stock',
            ubicacion: ubicacion.trim() || null
        }

        const activosACrear = seriesGeneradas.map(serie => ({
            ...datosComunes,
            numero_serie: serie
        }))

        onGuardarMultiples(activosACrear)
    }

    return (
        <div className={estilos.modal} onClick={onCerrar}>
            <div className={`${estilos.modalContenido} ${estilos.modalGrande} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.modalHeader}>
                    <h3 className={estilos.modalTitulo}>
                        <ion-icon name="albums-outline"></ion-icon>
                        Agregar Múltiples Activos
                    </h3>
                    <button className={estilos.btnCerrarModal} onClick={onCerrar} type="button">
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.modalForm}>
                    {/* Modo de ingreso */}
                    <div className={estilos.selectorModo}>
                        <button
                            type="button"
                            className={`${estilos.btnModo} ${modoIngreso === 'auto' ? estilos.activo : ''}`}
                            onClick={() => setModoIngreso('auto')}
                        >
                            <ion-icon name="flash-outline"></ion-icon>
                            Auto-generar
                        </button>
                        <button
                            type="button"
                            className={`${estilos.btnModo} ${modoIngreso === 'manual' ? estilos.activo : ''}`}
                            onClick={() => setModoIngreso('manual')}
                        >
                            <ion-icon name="create-outline"></ion-icon>
                            Ingreso Manual
                        </button>
                    </div>

                    {/* Modo auto-generar */}
                    {modoIngreso === 'auto' ? (
                        <div className={estilos.seccionModal}>
                            <h4 className={estilos.modalSeccionTitulo}>Configuración de Series</h4>
                            <div className={estilos.gridTres}>
                                <div className={estilos.modalGrupoInput}>
                                    <label className={estilos.modalLabel}>Prefijo</label>
                                    <input
                                        type="text"
                                        value={prefijoSerie}
                                        onChange={(e) => setPrefijoSerie(e.target.value.toUpperCase())}
                                        className={estilos.modalInput}
                                        placeholder="SC-"
                                    />
                                </div>

                                <div className={estilos.modalGrupoInput}>
                                    <label className={estilos.modalLabel}>Número Inicial</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={numeroInicio}
                                        onChange={(e) => setNumeroInicio(e.target.value)}
                                        className={estilos.modalInput}
                                    />
                                </div>

                                <div className={estilos.modalGrupoInput}>
                                    <label className={estilos.modalLabel}>Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                        className={estilos.modalInput}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Modo manual */
                        <div className={estilos.seccionModal}>
                            <h4 className={estilos.modalSeccionTitulo}>Números de Serie</h4>
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>
                                    Ingresar series (una por línea)
                                </label>
                                <textarea
                                    value={seriesTexto}
                                    onChange={(e) => setSeriesTexto(e.target.value)}
                                    className={estilos.modalTextarea}
                                    rows="8"
                                    placeholder="CHS-001&#10;CHS-002&#10;CHS-003"
                                />
                                <small className={estilos.ayudaInput}>
                                    Ingresa un número de serie por línea
                                </small>
                            </div>
                        </div>
                    )}

                    {/* Vista previa */}
                    {seriesGeneradas.length > 0 && (
                        <div className={estilos.vistaPrevia}>
                            <h4 className={estilos.vistaPreviaTitulo}>
                                <ion-icon name="eye-outline"></ion-icon>
                                Vista Previa ({seriesGeneradas.length} {seriesGeneradas.length === 1 ? 'activo' : 'activos'})
                            </h4>
                            <div className={estilos.listaSeries}>
                                {seriesGeneradas.slice(0, 10).map((serie, index) => (
                                    <span key={index} className={estilos.serieBadge}>{serie}</span>
                                ))}
                                {seriesGeneradas.length > 10 && (
                                    <span className={estilos.seriesMas}>+{seriesGeneradas.length - 10} más</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Datos comunes */}
                    <div className={estilos.seccionModal}>
                        <h4 className={estilos.modalSeccionTitulo}>Datos Comunes (aplicados a todos)</h4>
                        
                        <div className={estilos.gridDos}>
                            <div className={estilos.modalGrupoInput}>
                                <label className={estilos.modalLabel}>Color</label>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className={estilos.modalInput}
                                    placeholder="Ej: Negro"
                                    list="colores-comunes-multi"
                                />
                                <datalist id="colores-comunes-multi">
                                    {coloresComunes.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
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
                            disabled={procesando || seriesGeneradas.length === 0}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    Guardando {seriesGeneradas.length} activos...
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    Guardar {seriesGeneradas.length} {seriesGeneradas.length === 1 ? 'Activo' : 'Activos'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


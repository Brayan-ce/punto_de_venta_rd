"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientes } from '../servidor'
import { crearCliente, crearClienteConCredito } from './servidor'
import estilos from './nuevo.module.css'

export default function CrearClienteAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    // Datos maestros
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [reglas, setReglas] = useState({})

    // Datos del cliente
    const [tipoDocumentoId, setTipoDocumentoId] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [direccion, setDireccion] = useState('')

    // Foto
    const [imagenBase64, setImagenBase64] = useState(null)
    const [previewFoto, setPreviewFoto] = useState(null)
    const fileInputRef = useRef(null)

    // Perfil Crediticio (OPCIONAL)
    const [asignarCredito, setAsignarCredito] = useState(false)
    const [limiteCredito, setLimiteCredito] = useState('')
    const [frecuenciaPago, setFrecuenciaPago] = useState('mensual')
    const [diasPlazo, setDiasPlazo] = useState(30)
    const [clasificacion, setClasificacion] = useState('C')
    const [observacionCredito, setObservacionCredito] = useState('')

    // ========================================
    // Cargar tema y escuchar cambios
    // ========================================
    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => setTema(localStorage.getItem('tema') || 'light')

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', manejarCambioTema)

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    // ========================================
    // Cargar datos maestros (tipos documento y reglas)
    // ========================================
    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerClientes()
            if (resultado.success) {
                setTiposDocumento(resultado.tiposDocumento || [])

                // Las reglas ya vienen procesadas como objeto desde el backend
                const reglasMap = resultado.reglas || {};
                setReglas(reglasMap)

                // Establecer defaults desde reglas
                setLimiteCredito(reglasMap.LIMITE_DEFAULT?.limite_default ?? 5000)
                setFrecuenciaPago(reglasMap.FRECUENCIA_DEFAULT ?? 'mensual')
                setDiasPlazo(reglasMap.DIAS_PLAZO_DEFAULT ?? 30)
            } else {
                alert(resultado.mensaje || 'Error al cargar datos')
                router.push('/admin/clientes')
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert('Error al cargar datos')
            router.push('/admin/clientes')
        } finally {
            setCargando(false)
        }
    }

    // ========================================
    // Manejo de imagen
    // ========================================
    const manejarImagen = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no debe superar 5MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setImagenBase64(reader.result)
            setPreviewFoto(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const activarCamara = () => {
        if (fileInputRef.current) fileInputRef.current.click()
    }

    // ========================================
    // Validación de formulario
    // ========================================
    const validarFormulario = () => {
        if (!tipoDocumentoId) {
            alert('Selecciona un tipo de documento')
            return false
        }
        if (!numeroDocumento.trim()) {
            alert('El número de documento es obligatorio')
            return false
        }
        if (!nombre.trim()) {
            alert('El nombre es obligatorio')
            return false
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('El email no es válido')
            return false
        }
        // Validar crédito solo si está habilitado
        if (asignarCredito) {
            if (!limiteCredito || parseFloat(limiteCredito) < 0) {
                alert('El límite de crédito debe ser un valor válido (mínimo 0)')
                return false
            }
        }
        return true
    }

    // ========================================
    // Enviar formulario
    // ========================================
    const manejarSubmit = async (e) => {
        e.preventDefault()
        if (!validarFormulario()) return

        setProcesando(true)

        try {
            const datosCliente = {
                tipo_documento_id: parseInt(tipoDocumentoId),
                numero_documento: numeroDocumento.trim(),
                nombre: nombre.trim(),
                apellidos: apellidos.trim() || null,
                telefono: telefono.trim() || null,
                email: email.trim() || null,
                direccion: direccion.trim() || null,
                imagen_base64: imagenBase64
            }

            let resultado

            if (asignarCredito) {
                // Crear cliente con crédito
                const datos = {
                    cliente: datosCliente,
                    credito: {
                        limite: parseFloat(limiteCredito),
                        frecuencia_pago: frecuenciaPago,
                        dias_plazo: parseInt(diasPlazo),
                        clasificacion: clasificacion,
                        observacion: observacionCredito.trim() || null
                    }
                }
                resultado = await crearClienteConCredito(datos)

                if (resultado.success) {
                    alert(`✅ ${resultado.mensaje}\n\nCliente ID: ${resultado.clienteId}\nCrédito ID: ${resultado.creditoId}`)
                    router.push('/admin/clientes')
                } else if (resultado.clienteId) {
                    // Cliente creado pero crédito falló
                    alert(`⚠️ ${resultado.mensaje}\n\nCliente ID: ${resultado.clienteId}\n\nError: ${resultado.creditoError}`)
                    router.push('/admin/clientes')
                } else {
                    alert(`❌ ${resultado.mensaje || 'Error al crear cliente'}`)
                }
            } else {
                // Crear cliente sin crédito
                resultado = await crearCliente(datosCliente)

                if (resultado.success) {
                    alert(`✅ ${resultado.mensaje}\n\nCliente ID: ${resultado.clienteId}\n\n(Sin crédito asignado)`)
                    router.push('/admin/clientes')
                } else {
                    alert(`❌ ${resultado.mensaje || 'Error al crear cliente'}`)
                }
            }
        } catch (error) {
            console.error('Error al crear cliente:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    // ========================================
    // Renderizado
    // ========================================
    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos maestros...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            {/* HEADER */}
            <div className={estilos.header}>
                <div className={estilos.headerLeft}>
                    <h1 className={estilos.titulo}>Nuevo Cliente</h1>
                    <p className={estilos.subtitulo}>Registro rápido con perfil crediticio profesional</p>
                </div>
                <button
                    type="button"
                    className={estilos.btnCancelar}
                    onClick={() => router.push('/admin/clientes')}
                    disabled={procesando}
                    aria-label="Cancelar creación de cliente"
                >
                    <ion-icon name="close-outline"></ion-icon>
                    <span>Cancelar</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>
                    {/* COLUMNA IZQUIERDA: Foto */}
                    <div className={estilos.columnaFoto}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="camera-outline"></ion-icon>
                                <span>Identificación Visual</span>
                            </h3>

                            <div className={estilos.fotoContainer}>
                                <div className={estilos.fotoPreview} onClick={activarCamara}>
                                    {previewFoto ? (
                                        <img src={previewFoto} alt="Foto Cliente" className={estilos.fotoImg} />
                                    ) : (
                                        <div className={estilos.fotoPlaceholder}>
                                            <ion-icon name="person-add-outline"></ion-icon>
                                            <p>Toca para capturar</p>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    capture="environment"
                                    onChange={manejarImagen}
                                    style={{ display: 'none' }}
                                />

                                <div className={estilos.botonesFoto}>
                                    <button
                                        type="button"
                                        className={estilos.btnFoto}
                                        onClick={activarCamara}
                                        disabled={procesando}
                                    >
                                        <ion-icon name="camera-outline"></ion-icon>
                                        <span>Tomar Foto</span>
                                    </button>
                                    {previewFoto && (
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarFoto}
                                            onClick={() => {
                                                setImagenBase64(null)
                                                setPreviewFoto(null)
                                            }}
                                            disabled={procesando}
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    )}
                                </div>
                                <p className={estilos.ayudaFoto}>
                                    Foto opcional · Máx. 5MB · Formatos: JPG, PNG
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Datos + Crédito */}
                    <div className={estilos.columnaDatos}>
                        {/* Información Personal */}
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                                <span>Información Personal</span>
                            </h3>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Tipo de Documento *</label>
                                    <select
                                        value={tipoDocumentoId}
                                        onChange={e => setTipoDocumentoId(e.target.value)}
                                        className={estilos.select}
                                        required
                                        disabled={procesando}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {tiposDocumento.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>
                                                {tipo.nombre} ({tipo.codigo})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Número de Documento *</label>
                                    <input
                                        type="text"
                                        value={numeroDocumento}
                                        onChange={e => setNumeroDocumento(e.target.value)}
                                        className={estilos.input}
                                        required
                                        disabled={procesando}
                                        placeholder="Ej: 001-0000000-0"
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                        className={estilos.input}
                                        required
                                        disabled={procesando}
                                        placeholder="Nombre del cliente"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Apellidos</label>
                                    <input
                                        type="text"
                                        value={apellidos}
                                        onChange={e => setApellidos(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                        placeholder="Apellidos"
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>Teléfono</label>
                                    <input
                                        type="tel"
                                        value={telefono}
                                        onChange={e => setTelefono(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                        placeholder="809-000-0000"
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={estilos.input}
                                        disabled={procesando}
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Dirección</label>
                                <textarea
                                    value={direccion}
                                    onChange={e => setDireccion(e.target.value)}
                                    className={estilos.textarea}
                                    disabled={procesando}
                                    placeholder="Dirección física completa..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Perfil Crediticio */}
                        <div className={`${estilos.seccion} ${estilos.seccionCredito} ${estilos[tema]}`}>
                            <div className={estilos.headerCredito}>
                                <h3 className={estilos.tituloSeccion}>
                                    <ion-icon name="card-outline"></ion-icon>
                                    <span>Configuración de Crédito</span>
                                </h3>
                                <label className={estilos.toggleContainer}>
                                    <input
                                        type="checkbox"
                                        checked={asignarCredito}
                                        onChange={(e) => setAsignarCredito(e.target.checked)}
                                        disabled={procesando}
                                        className={estilos.toggleInput}
                                    />
                                    <span className={estilos.toggleSlider}></span>
                                    <span className={estilos.toggleLabel}>
                                        {asignarCredito ? 'Crédito Habilitado' : 'Sin Crédito'}
                                    </span>
                                </label>
                            </div>

                            {asignarCredito ? (
                                <div className={estilos.alertaInfo}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>
                                        Se creará un perfil crediticio para este cliente.
                                        Puedes usar los valores por defecto o personalizarlos.
                                    </p>
                                </div>
                            ) : (
                                <div className={estilos.alertaWarning}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    <p>
                                        Este cliente se creará SIN crédito. Podrás asignarlo más tarde si es necesario.
                                    </p>
                                </div>
                            )}

                            {asignarCredito && (
                                <div className={estilos.camposCredito}>

                                    <div className={estilos.gridDosColumnas}>
                                        <div className={estilos.grupoInput}>
                                            <label>Límite de Crédito *</label>
                                            <div className={estilos.inputMoneda}>
                                                <span>$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={limiteCredito}
                                                    onChange={e => setLimiteCredito(e.target.value)}
                                                    className={estilos.input}
                                                    required
                                                    disabled={procesando}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {reglas.LIMITE_DEFAULT && (
                                                <small className={estilos.ayuda}>
                                                    Default del sistema: {reglas.LIMITE_DEFAULT?.moneda} {reglas.LIMITE_DEFAULT?.limite_default}
                                                </small>
                                            )}
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>Frecuencia de Pago *</label>
                                            <select
                                                value={frecuenciaPago}
                                                onChange={e => setFrecuenciaPago(e.target.value)}
                                                className={estilos.select}
                                                disabled={procesando}
                                            >
                                                <option value="semanal">Semanal (7 días)</option>
                                                <option value="quincenal">Quincenal (15 días)</option>
                                                <option value="mensual">Mensual (30 días)</option>
                                            </select>
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>Días de Plazo</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={diasPlazo}
                                                onChange={e => setDiasPlazo(e.target.value)}
                                                className={estilos.input}
                                                disabled={procesando}
                                                placeholder="30"
                                            />
                                            <small className={estilos.ayuda}>
                                                Plazo para pagar desde la fecha de compra
                                            </small>
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>Clasificación Inicial *</label>
                                            <select
                                                value={clasificacion}
                                                onChange={e => setClasificacion(e.target.value)}
                                                className={estilos.select}
                                                disabled={procesando}
                                            >
                                                <option value="A">A - Excelente (Score: 100)</option>
                                                <option value="B">B - Bueno (Score: 75)</option>
                                                <option value="C">C - Regular (Score: 50)</option>
                                                <option value="D">D - Riesgoso (Score: 25)</option>
                                            </select>
                                            <small className={estilos.ayuda}>
                                                Se ajustará automáticamente según historial de pagos
                                            </small>
                                        </div>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Observación Inicial (Opcional)</label>
                                        <textarea
                                            value={observacionCredito}
                                            onChange={e => setObservacionCredito(e.target.value)}
                                            className={estilos.textarea}
                                            disabled={procesando}
                                            placeholder="Notas sobre el crédito inicial del cliente..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className={estilos.footer}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/clientes')}
                        className={estilos.btnCancelarFooter}
                        disabled={procesando}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cancelar</span>
                    </button>
                    <button
                        type="submit"
                        className={estilos.btnGuardar}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>{asignarCredito ? 'Creando cliente y crédito...' : 'Creando cliente...'}</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>{asignarCredito ? 'Crear Cliente + Crédito' : 'Crear Cliente'}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

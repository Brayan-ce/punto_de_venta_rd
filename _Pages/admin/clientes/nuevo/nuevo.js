"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerClientes, obtenerDatosEmpresa } from '../servidor'
import { crearCliente, crearClienteConCredito } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './nuevo.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function CrearClienteAdmin({ returnPath = '/admin/clientes' }) {
    const router = useRouter()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [tiposDocumento, setTiposDocumento] = useState([])
    const [reglas, setReglas] = useState({})
    const [empresa, setEmpresa] = useState(null)

    const [tipoDocumentoId, setTipoDocumentoId] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [direccion, setDireccion] = useState('')

    const [imagenBase64, setImagenBase64] = useState(null)
    const [previewFoto, setPreviewFoto] = useState(null)
    const fileInputRef = useRef(null)

    const [asignarCredito, setAsignarCredito] = useState(false)
    const [limiteCredito, setLimiteCredito] = useState('')
    const [frecuenciaPago, setFrecuenciaPago] = useState('mensual')
    const [diasPlazo, setDiasPlazo] = useState(30)
    const [clasificacion, setClasificacion] = useState('C')
    const [observacionCredito, setObservacionCredito] = useState('')

    const [toast, setToast] = useState(null)

    const mostrarToast = (tipo, titulo, mensaje) => {
        setToast({ tipo, titulo, mensaje })
        setTimeout(() => setToast(null), 6000)
    }

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

    useEffect(() => {
        cargarDatos()
        cargarEmpresa()
    }, [])

    const cargarEmpresa = async () => {
        const res = await obtenerDatosEmpresa()
        if (res.success) setEmpresa(res.empresa)
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerClientes()
            if (resultado.success) {
                setTiposDocumento(resultado.tiposDocumento || [])
                const reglasMap = resultado.reglas || {}
                setReglas(reglasMap)
                setLimiteCredito(reglasMap.LIMITE_DEFAULT?.limite_default ?? 5000)
                setFrecuenciaPago(reglasMap.FRECUENCIA_DEFAULT ?? 'mensual')
                setDiasPlazo(reglasMap.DIAS_PLAZO_DEFAULT ?? 30)
            } else {
                alert(resultado.mensaje || tr('Error al cargar datos', 'Error loading data'))
                router.push(returnPath)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
            alert(tr('Error al cargar datos', 'Error loading data'))
            router.push(returnPath)
        } finally {
            setCargando(false)
        }
    }

    const manejarImagen = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert(tr('La imagen no debe superar 5MB', 'Image must not exceed 5MB'))
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

    const validarFormulario = () => {
        if (!tipoDocumentoId) {
            alert(tr('Selecciona un tipo de documento', 'Select a document type'))
            return false
        }
        if (!numeroDocumento.trim()) {
            alert(tr('El numero de documento es obligatorio', 'Document number is required'))
            return false
        }
        if (!nombre.trim()) {
            alert(tr('El nombre es obligatorio', 'Name is required'))
            return false
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert(tr('El email no es valido', 'Email is not valid'))
            return false
        }
        if (asignarCredito) {
            if (!limiteCredito || parseFloat(limiteCredito) < 0) {
                alert(tr('El limite de credito debe ser un valor valido', 'Credit limit must be a valid value'))
                return false
            }
        }
        return true
    }

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
                    mostrarToast('success', tr('Cliente creado', 'Customer created'), resultado.mensaje)
                    setTimeout(() => router.push(returnPath), 1200)
                } else if (resultado.clienteId) {
                    mostrarToast('success', tr('Cliente creado', 'Customer created'), resultado.mensaje)
                    setTimeout(() => router.push(returnPath), 1200)
                } else {
                    manejarErrorResultado(resultado)
                }
            } else {
                resultado = await crearCliente(datosCliente)

                if (resultado.success) {
                    mostrarToast('success', tr('Cliente creado', 'Customer created'), resultado.mensaje)
                    setTimeout(() => router.push(returnPath), 1200)
                } else {
                    manejarErrorResultado(resultado)
                }
            }
        } catch (error) {
            console.error('Error al crear cliente:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const manejarErrorResultado = (resultado) => {
        if (resultado.codigo === 'MODO_OFFLINE') {
            mostrarToast(
                'offline',
                tr('Modo offline activo', 'Offline mode active'),
                tr('La empresa está en modo offline. No puedes crear ni modificar datos desde la web mientras esté activo. Ve a Configuración → Offline, sube la base de datos modificada y desactiva el modo offline.', 'The company is in offline mode. You cannot create or modify data from the web while it is active. Go to Configuration → Offline, upload the modified database and disable offline mode.')
            )
        } else {
            alert(resultado.mensaje || tr('Error al crear cliente', 'Error creating customer'))
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>

            <div className={estilos.header}>
                <div className={estilos.headerLeft}>
                    <div className={estilos.tituloWrapper}>
                        <div className={estilos.tituloIcono}>
                            <ion-icon name="person-add-outline"></ion-icon>
                        </div>
                        <h1 className={estilos.titulo}>{tr('Nuevo Cliente', 'New Customer')}</h1>
                    </div>
                    <p className={estilos.subtitulo}>
                        {tr('Registro con perfil crediticio opcional', 'Registration with optional credit profile')}
                    </p>
                </div>
                <button
                    type="button"
                    className={estilos.btnVolver}
                    onClick={() => router.push(returnPath)}
                    disabled={procesando}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>

                    <div className={estilos.columnaFoto}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="camera-outline"></ion-icon>
                                <span>{tr('Foto del Cliente', 'Customer Photo')}</span>
                            </h3>

                            <div className={estilos.fotoContainer}>
                                <div className={estilos.fotoPreview} onClick={activarCamara}>
                                    {previewFoto ? (
                                        <img src={previewFoto} alt={tr('Foto Cliente', 'Customer Photo')} className={estilos.fotoImg} />
                                    ) : (
                                        <div className={estilos.fotoPlaceholder}>
                                            <ion-icon name="person-add-outline"></ion-icon>
                                            <p>{tr('Toca para capturar', 'Tap to capture')}</p>
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
                                        <span>{tr('Tomar foto', 'Take photo')}</span>
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
                                    {tr('Opcional · Max. 5MB · JPG, PNG', 'Optional · Max. 5MB · JPG, PNG')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.columnaDatos}>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                                <span>{tr('Informacion Personal', 'Personal Information')}</span>
                            </h3>

                            <div className={estilos.stackCampos}>
                                <div className={estilos.gridDosColumnas}>
                                    <div className={estilos.grupoInput}>
                                        <label>
                                            {tr('Tipo de Documento', 'Document Type')}
                                            <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                                        </label>
                                        <select
                                            value={tipoDocumentoId}
                                            onChange={e => setTipoDocumentoId(e.target.value)}
                                            className={estilos.select}
                                            required
                                            disabled={procesando}
                                        >
                                            <option value="">{tr('Seleccionar...', 'Select...')}</option>
                                            {tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre} ({tipo.codigo})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>
                                            {tr('Numero de Documento', 'Document Number')}
                                            <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={numeroDocumento}
                                            onChange={e => setNumeroDocumento(e.target.value)}
                                            className={estilos.input}
                                            required
                                            disabled={procesando}
                                            placeholder="001-0000000-0"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridDosColumnas}>
                                    <div className={estilos.grupoInput}>
                                        <label>
                                            {tr('Nombre', 'Name')}
                                            <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nombre}
                                            onChange={e => setNombre(e.target.value)}
                                            className={estilos.input}
                                            required
                                            disabled={procesando}
                                            placeholder={tr('Nombre del cliente', 'Customer name')}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Apellidos', 'Last Name')}</label>
                                        <input
                                            type="text"
                                            value={apellidos}
                                            onChange={e => setApellidos(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                            placeholder={tr('Apellidos', 'Last name')}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridDosColumnas}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Telefono', 'Phone')}</label>
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
                                        <label>{tr('Email', 'Email')}</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className={estilos.input}
                                            disabled={procesando}
                                            placeholder={tr('ejemplo@correo.com', 'example@email.com')}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Direccion', 'Address')}</label>
                                    <textarea
                                        value={direccion}
                                        onChange={e => setDireccion(e.target.value)}
                                        className={estilos.textarea}
                                        disabled={procesando}
                                        placeholder={tr('Direccion fisica completa...', 'Full physical address...')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="card-outline"></ion-icon>
                                <span>{tr('Configuracion de Credito', 'Credit Settings')}</span>
                            </h3>

                            <label
                                className={estilos.toggleWrapper}
                                onClick={() => !procesando && setAsignarCredito(!asignarCredito)}
                            >
                                <div className={estilos.toggleLeft}>
                                    <div className={`${estilos.toggleIcono} ${asignarCredito ? estilos.toggleIconoCredito : estilos.toggleIconoSinCredito}`}>
                                        <ion-icon
                                            name={asignarCredito ? 'wallet' : 'wallet-outline'}
                                            style={{ color: asignarCredito ? '#3b82f6' : '#64748b' }}
                                        ></ion-icon>
                                    </div>
                                    <div className={estilos.toggleTexto}>
                                        <span className={estilos.toggleLabel}>{tr('Credito habilitado', 'Credit enabled')}</span>
                                        <span className={estilos.toggleDesc}>{asignarCredito ? tr('Este cliente tendra linea de credito', 'This customer will have a credit line') : tr('Sin credito asignado', 'No credit assigned')}</span>
                                    </div>
                                </div>
                                <div className={estilos.toggleSwitch}>
                                    <input
                                        type="checkbox"
                                        checked={asignarCredito}
                                        onChange={(e) => setAsignarCredito(e.target.checked)}
                                        disabled={procesando}
                                        readOnly
                                    />
                                    <span className={estilos.toggleTrack}></span>
                                </div>
                            </label>

                            {asignarCredito ? (
                                <div className={estilos.alertaInfo}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>
                                        {tr('Se creara un perfil crediticio para este cliente. Puedes usar los valores por defecto o personalizarlos.', 'A credit profile will be created for this customer. You can use default values or customize them.')}
                                    </p>
                                </div>
                            ) : (
                                <div className={estilos.alertaWarning}>
                                    <ion-icon name="alert-circle-outline"></ion-icon>
                                    <p>
                                        {tr('Este cliente se creara sin credito. Podras asignarlo despues si es necesario.', 'This customer will be created without credit. You can assign it later if needed.')}
                                    </p>
                                </div>
                            )}

                            {asignarCredito && (
                                <div className={estilos.camposCredito}>
                                    <div className={estilos.gridDosColumnas}>
                                        <div className={estilos.grupoInput}>
                                            <label>
                                                {tr('Limite de Credito', 'Credit Limit')}
                                                <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                                            </label>
                                            <div className={estilos.inputMoneda}>
                                                <span>{empresa?.simbolo_moneda || 'RD$'}</span>
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
                                                    Default: {reglas.LIMITE_DEFAULT?.moneda} {reglas.LIMITE_DEFAULT?.limite_default}
                                                </small>
                                            )}
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>{tr('Frecuencia de Pago', 'Payment Frequency')}</label>
                                            <select
                                                value={frecuenciaPago}
                                                onChange={e => setFrecuenciaPago(e.target.value)}
                                                className={estilos.select}
                                                disabled={procesando}
                                            >
                                                <option value="semanal">{tr('Semanal (7 dias)', 'Weekly (7 days)')}</option>
                                                <option value="quincenal">{tr('Quincenal (15 dias)', 'Biweekly (15 days)')}</option>
                                                <option value="mensual">{tr('Mensual (30 dias)', 'Monthly (30 days)')}</option>
                                            </select>
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>{tr('Dias de Plazo', 'Due Days')}</label>
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
                                                {tr('Plazo desde la fecha de compra', 'Term from purchase date')}
                                            </small>
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>{tr('Clasificacion Inicial', 'Initial Classification')}</label>
                                            <select
                                                value={clasificacion}
                                                onChange={e => setClasificacion(e.target.value)}
                                                className={estilos.select}
                                                disabled={procesando}
                                            >
                                                <option value="A">{tr('A - Excelente', 'A - Excellent')}</option>
                                                <option value="B">{tr('B - Bueno', 'B - Good')}</option>
                                                <option value="C">{tr('C - Regular', 'C - Fair')}</option>
                                                <option value="D">{tr('D - Riesgoso', 'D - Risky')}</option>
                                            </select>
                                            <small className={estilos.ayuda}>
                                                {tr('Se ajusta segun historial de pagos', 'Adjusted according to payment history')}
                                            </small>
                                        </div>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Observacion Inicial (opcional)', 'Initial Note (optional)')}</label>
                                        <textarea
                                            value={observacionCredito}
                                            onChange={e => setObservacionCredito(e.target.value)}
                                            className={estilos.textarea}
                                            disabled={procesando}
                                            placeholder={tr('Notas sobre el credito inicial del cliente...', 'Notes about the customer initial credit...')}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className={`${estilos.footerFormulario} ${estilos[tema]}`}>
                    <div className={estilos.footerInner}>
                        <button
                            type="button"
                            onClick={() => router.push(returnPath)}
                            className={estilos.btnCancelarFooter}
                            disabled={procesando}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                            <span>{tr('Cancelar', 'Cancel')}</span>
                        </button>
                        <button
                            type="submit"
                            className={estilos.btnGuardar}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="sync-outline" style={{ animation: 'spin 1s linear infinite' }}></ion-icon>
                                    <span>{asignarCredito ? tr('Creando cliente y credito...', 'Creating customer and credit...') : tr('Creando cliente...', 'Creating customer...')}</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>{asignarCredito ? tr('Crear Cliente + Credito', 'Create Customer + Credit') : tr('Crear Cliente', 'Create Customer')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {toast && (
                <div style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    zIndex: 99999,
                    maxWidth: 420,
                    padding: '18px 20px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                    animation: 'pvToastIn 0.3s ease',
                    border: '1px solid',
                    background: toast.tipo === 'success' ? (tema === 'dark' ? '#064e3b' : '#ecfdf5') : (tema === 'dark' ? '#451a03' : '#fff7ed'),
                    borderColor: toast.tipo === 'success' ? (tema === 'dark' ? '#047857' : '#a7f3d0') : (tema === 'dark' ? '#92400e' : '#fdba74'),
                }}>
                    <div style={{
                        fontSize: 24,
                        flexShrink: 0,
                        color: toast.tipo === 'success' ? '#10b981' : '#f97316',
                    }}>
                        <ion-icon name={toast.tipo === 'success' ? 'checkmark-circle-outline' : 'cloud-offline-outline'}></ion-icon>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: tema === 'dark' ? '#f1f5f9' : '#0f172a' }}>
                            {toast.titulo}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.5, color: tema === 'dark' ? '#94a3b8' : '#475569' }}>
                            {toast.mensaje}
                        </div>
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{ background: 'transparent', border: 'none', color: tema === 'dark' ? '#64748b' : '#94a3b8', fontSize: 16, cursor: 'pointer', flexShrink: 0, padding: 0 }}
                    >
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
            )}
            <style>{`
                @keyframes pvToastIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
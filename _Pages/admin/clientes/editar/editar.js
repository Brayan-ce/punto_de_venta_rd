"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerClientes } from '../servidor'
import { obtenerClientePorId } from '../ver/servidor'
import { actualizarClienteYCredito } from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function EditarClienteAdmin({ returnPath = '/admin/clientes' }) {
    const router = useRouter()
    const params = useParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    const [tiposDocumento, setTiposDocumento] = useState([])

    const [tipoDocumentoId, setTipoDocumentoId] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [direccion, setDireccion] = useState('')
    const [activo, setActivo] = useState(true)

    const [previewFoto, setPreviewFoto] = useState(null)
    const [imagenBase64, setImagenBase64] = useState(null)
    const fileInputRef = useRef(null)

    const [tieneCredito, setTieneCredito] = useState(false)
    const [limiteCredito, setLimiteCredito] = useState('')
    const [frecuenciaPago, setFrecuenciaPago] = useState('mensual')
    const [diasGracia, setDiasGracia] = useState(30)
    const [observacionCredito, setObservacionCredito] = useState('')

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
        if (params.id) cargarDatos()
    }, [params.id])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const resMaestros = await obtenerClientes()
            if (resMaestros.success) setTiposDocumento(resMaestros.tiposDocumento)

            const resCliente = await obtenerClientePorId(params.id)
            if (resCliente.success) {
                const c = resCliente.cliente
                setTipoDocumentoId(c.documento?.tipoId?.toString() || '')
                setNumeroDocumento(c.documento?.numero || '')
                setNombre(c.nombre || '')
                setApellidos(c.apellidos || '')
                setTelefono(c.contacto?.telefono || '')
                setEmail(c.contacto?.email || '')
                setDireccion(c.contacto?.direccion || '')
                setActivo(c.clienteActivo)
                setPreviewFoto(c.fotoUrl || null)

                if (c.credito) {
                    setTieneCredito(c.credito.activo)
                    setLimiteCredito(c.credito.limite || '')
                    setFrecuenciaPago(c.credito.frecuenciaPago || 'mensual')
                    setDiasGracia(c.credito.diasPlazo || 30)
                }
            } else {
                alert(resCliente.mensaje || tr('Error al cargar el cliente', 'Error loading customer'))
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

    const validarFormulario = () => {
        if (!tipoDocumentoId) { alert(tr('Selecciona un tipo de documento', 'Select a document type')); return false }
        if (!numeroDocumento.trim()) { alert(tr('El numero de documento es obligatorio', 'Document number is required')); return false }
        if (!nombre.trim()) { alert(tr('El nombre es obligatorio', 'Name is required')); return false }
        if (tieneCredito && (!limiteCredito || parseFloat(limiteCredito) < 0)) {
            alert(tr('Debes definir un limite de credito valido', 'You must define a valid credit limit'))
            return false
        }
        return true
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        if (!validarFormulario()) return
        setProcesando(true)
        try {
            const dataToUpdate = {
                cliente_id: parseInt(params.id),
                cliente: {
                    tipo_documento_id: parseInt(tipoDocumentoId),
                    numero_documento: numeroDocumento.trim(),
                    nombre: nombre.trim(),
                    apellidos: apellidos.trim() || null,
                    telefono: telefono.trim() || null,
                    email: email.trim() || null,
                    direccion: direccion.trim() || null,
                    activo: activo,
                    imagen_base64: imagenBase64
                },
                credito: {
                    limite: tieneCredito ? parseFloat(limiteCredito) : 0,
                    frecuencia_pago: tieneCredito ? frecuenciaPago : 'mensual',
                    dias_plazo: tieneCredito ? parseInt(diasGracia) : 30,
                    activo: tieneCredito,
                    observacion: observacionCredito || tr('Actualizacion desde edicion de cliente', 'Update from customer edit')
                }
            }
            const resultado = await actualizarClienteYCredito(dataToUpdate)
            if (resultado.success) {
                alert(resultado.mensaje)
                router.push(returnPath)
            } else {
                alert(resultado.mensaje || tr('Error al actualizar cliente', 'Error updating customer'))
            }
        } catch (error) {
            console.error('Error al actualizar cliente:', error)
            alert(tr('Error al procesar la solicitud', 'Error processing request'))
        } finally {
            setProcesando(false)
        }
    }

    const toggleActivo = (e) => {
        e.preventDefault()
        if (!procesando) setActivo(v => !v)
    }

    const toggleCredito = (e) => {
        e.preventDefault()
        if (!procesando) setTieneCredito(v => !v)
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
                            <ion-icon name="create-outline"></ion-icon>
                        </div>
                        <h1 className={estilos.titulo}>{tr('Editar Cliente', 'Edit Customer')}</h1>
                    </div>
                    <p className={estilos.subtitulo}>
                        {tr('Actualiza la informacion personal, perfil crediticio e imagen', 'Update personal information, credit profile and image')}
                    </p>
                </div>
                <button
                    type="button"
                    className={estilos.btnVolver}
                    onClick={() => router.push(returnPath)}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>{tr('Volver', 'Back')}</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>

                    <div className={estilos.columnaIzquierda}>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                                <span>{tr('Informacion del Cliente', 'Customer Information')}</span>
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
                                            onChange={(e) => setTipoDocumentoId(e.target.value)}
                                            className={estilos.select}
                                            required
                                            disabled={procesando}
                                        >
                                            <option value="">{tr('Seleccionar...', 'Select...')}</option>
                                            {tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
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
                                            onChange={(e) => setNumeroDocumento(e.target.value)}
                                            className={estilos.input}
                                            placeholder="001-1234567-8"
                                            required
                                            disabled={procesando}
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
                                            onChange={(e) => setNombre(e.target.value)}
                                            className={estilos.input}
                                            placeholder={tr('Nombre del cliente', 'Customer name')}
                                            required
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Apellidos', 'Last Name')}</label>
                                        <input
                                            type="text"
                                            value={apellidos}
                                            onChange={(e) => setApellidos(e.target.value)}
                                            className={estilos.input}
                                            placeholder={tr('Apellidos (opcional)', 'Last name (optional)')}
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.gridDosColumnas}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Telefono', 'Phone')}</label>
                                        <input
                                            type="tel"
                                            value={telefono}
                                            onChange={(e) => setTelefono(e.target.value)}
                                            className={estilos.input}
                                            placeholder="(809) 000-0000"
                                            disabled={procesando}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Email', 'Email')}</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={estilos.input}
                                            placeholder={tr('cliente@ejemplo.com', 'customer@example.com')}
                                            disabled={procesando}
                                        />
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>{tr('Direccion', 'Address')}</label>
                                    <textarea
                                        value={direccion}
                                        onChange={(e) => setDireccion(e.target.value)}
                                        className={estilos.textarea}
                                        placeholder={tr('Calle, numero, sector, ciudad...', 'Street, number, area, city...')}
                                        disabled={procesando}
                                    />
                                </div>

                                <div
                                    className={estilos.toggleWrapper}
                                    onClick={toggleActivo}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && toggleActivo(e)}
                                >
                                    <div className={estilos.toggleLeft}>
                                        <div className={`${estilos.toggleIcono} ${activo ? estilos.toggleIconoActivo : estilos.toggleIconoInactivo}`}>
                                            <ion-icon
                                                name={activo ? 'checkmark-circle' : 'close-circle'}
                                                style={{ color: activo ? '#10b981' : '#ef4444' }}
                                            ></ion-icon>
                                        </div>
                                        <div className={estilos.toggleTexto}>
                                            <span className={estilos.toggleLabel}>{tr('Estado del cliente', 'Customer status')}</span>
                                            <span className={estilos.toggleDesc}>{activo ? tr('Cliente activo en el sistema', 'Active customer in system') : tr('Cliente inactivo', 'Inactive customer')}</span>
                                        </div>
                                    </div>
                                    <div className={estilos.toggleSwitch}>
                                        <input
                                            type="checkbox"
                                            checked={activo}
                                            onChange={() => {}}
                                            disabled={procesando}
                                            tabIndex={-1}
                                        />
                                        <span className={estilos.toggleTrack}></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="card-outline"></ion-icon>
                                <span>{tr('Configuracion de Credito', 'Credit Settings')}</span>
                            </h3>

                            <div className={estilos.stackCampos}>
                                <div
                                    className={estilos.toggleWrapper}
                                    onClick={toggleCredito}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && toggleCredito(e)}
                                >
                                    <div className={estilos.toggleLeft}>
                                        <div className={`${estilos.toggleIcono} ${tieneCredito ? estilos.toggleIconoCredito : estilos.toggleIconoSinCredito}`}>
                                            <ion-icon
                                                name={tieneCredito ? 'wallet' : 'wallet-outline'}
                                                style={{ color: tieneCredito ? '#3b82f6' : '#64748b' }}
                                            ></ion-icon>
                                        </div>
                                        <div className={estilos.toggleTexto}>
                                            <span className={estilos.toggleLabel}>{tr('Credito habilitado', 'Credit enabled')}</span>
                                            <span className={estilos.toggleDesc}>{tieneCredito ? tr('Este cliente tiene linea de credito', 'This customer has a credit line') : tr('Sin credito asignado', 'No credit assigned')}</span>
                                        </div>
                                    </div>
                                    <div className={estilos.toggleSwitch}>
                                        <input
                                            type="checkbox"
                                            checked={tieneCredito}
                                            onChange={() => {}}
                                            disabled={procesando}
                                            tabIndex={-1}
                                        />
                                        <span className={estilos.toggleTrack}></span>
                                    </div>
                                </div>

                                {tieneCredito && (
                                    <div className={estilos.stackCampos}>
                                        <div className={estilos.gridDosColumnas}>
                                            <div className={estilos.grupoInput}>
                                                <label>
                                                    {tr('Limite de Credito', 'Credit Limit')}
                                                    <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={limiteCredito}
                                                    onChange={(e) => setLimiteCredito(e.target.value)}
                                                    className={estilos.input}
                                                    placeholder="0.00"
                                                    required
                                                    disabled={procesando}
                                                />
                                            </div>

                                            <div className={estilos.grupoInput}>
                                                <label>{tr('Frecuencia de Pago', 'Payment Frequency')}</label>
                                                <select
                                                    value={frecuenciaPago}
                                                    onChange={(e) => setFrecuenciaPago(e.target.value)}
                                                    className={estilos.select}
                                                    disabled={procesando}
                                                >
                                                    <option value="semanal">{tr('Semanal', 'Weekly')}</option>
                                                    <option value="quincenal">{tr('Quincenal', 'Biweekly')}</option>
                                                    <option value="mensual">{tr('Mensual', 'Monthly')}</option>
                                                    <option value="personalizada">{tr('Personalizada', 'Custom')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>{tr('Dias de Plazo', 'Due Days')}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={diasGracia}
                                                onChange={(e) => setDiasGracia(e.target.value)}
                                                className={estilos.input}
                                                placeholder="30"
                                                disabled={procesando}
                                            />
                                        </div>

                                        <div className={estilos.grupoInput}>
                                            <label>{tr('Observacion (opcional)', 'Note (optional)')}</label>
                                            <textarea
                                                value={observacionCredito}
                                                onChange={(e) => setObservacionCredito(e.target.value)}
                                                className={estilos.textarea}
                                                placeholder={tr('Motivo del ajuste o notas adicionales...', 'Reason for adjustment or additional notes...')}
                                                disabled={procesando}
                                                style={{ minHeight: '80px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className={estilos.columnaDerecha}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="camera-outline"></ion-icon>
                                <span>{tr('Foto del Cliente', 'Customer Photo')}</span>
                            </h3>

                            <div className={estilos.seccionFoto}>
                                <div
                                    className={estilos.contenedorPreview}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewFoto ? (
                                        <img src={previewFoto} alt={tr('Preview', 'Preview')} className={estilos.previewImg} />
                                    ) : (
                                        <div className={estilos.placeholderFoto}>
                                            <ion-icon name="person-add-outline"></ion-icon>
                                            <span>{tr('Subir foto', 'Upload photo')}</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    capture="user"
                                    onChange={manejarImagen}
                                    style={{ display: 'none' }}
                                />
                                <p className={estilos.fotoHint}>
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    {tr('Click para cambiar la imagen', 'Click to change image')}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={`${estilos.footerFormulario} ${estilos[tema]}`}>
                    <div className={estilos.footerInner}>
                        <button
                            type="button"
                            onClick={() => router.push(returnPath)}
                            className={estilos.btnCancelarForm}
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
                                    <span>{tr('Guardando...', 'Saving...')}</span>
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>{tr('Guardar Cambios', 'Save Changes')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
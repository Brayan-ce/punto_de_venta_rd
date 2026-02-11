"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { obtenerClientes } from '../servidor'
import { obtenerClientePorId } from '../ver/servidor'
import { actualizarClienteYCredito } from './servidor'
import estilos from './editar.module.css'

export default function EditarClienteAdmin() {
    const router = useRouter()
    const params = useParams()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)

    // Datos maestros
    const [tiposDocumento, setTiposDocumento] = useState([])

    // Estados del formulario
    const [tipoDocumentoId, setTipoDocumentoId] = useState('')
    const [numeroDocumento, setNumeroDocumento] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellidos, setApellidos] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [direccion, setDireccion] = useState('')
    const [activo, setActivo] = useState(true)

    // Foto e Identificación
    const [fotoUrl, setFotoUrl] = useState('')
    const [fotoArchivo, setFotoArchivo] = useState(null)
    const [previewFoto, setPreviewFoto] = useState(null)
    const [imagenBase64, setImagenBase64] = useState(null)
    const fileInputRef = useRef(null)

    // Crédito Profesional
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
        if (params.id) {
            cargarDatos()
        }
    }, [params.id])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            // Cargar tipos de documento
            const resMaestros = await obtenerClientes()
            if (resMaestros.success) {
                setTiposDocumento(resMaestros.tiposDocumento)
            }

            // Cargar datos del cliente
            const resCliente = await obtenerClientePorId(params.id)
            if (resCliente.success) {
                const c = resCliente.cliente

                // Datos básicos (mapeo desde estructura anidada)
                setTipoDocumentoId(c.documento?.tipoId?.toString() || '')
                setNumeroDocumento(c.documento?.numero || '')
                setNombre(c.nombre || '')
                setApellidos(c.apellidos || '')
                setTelefono(c.contacto?.telefono || '')
                setEmail(c.contacto?.email || '')
                setDireccion(c.contacto?.direccion || '')
                setActivo(c.clienteActivo)
                setFotoUrl(c.fotoUrl || '')
                setPreviewFoto(c.fotoUrl || null)

                // Datos de crédito
                if (c.credito) {
                    setTieneCredito(c.credito.activo)
                    setLimiteCredito(c.credito.limite || '')
                    setFrecuenciaPago(c.credito.frecuenciaPago || 'mensual')
                    setDiasGracia(c.credito.diasPlazo || 30)
                }
            } else {
                alert(resCliente.mensaje || 'Error al cargar el cliente')
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

    const manejarImagen = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no debe superar 5MB')
            return
        }

        // Convertir a base64 usando FileReader
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagenBase64(reader.result)
            setPreviewFoto(reader.result)
        }
        reader.readAsDataURL(file)
    }

    const validarFormulario = () => {
        if (!tipoDocumentoId) { alert('Selecciona un tipo de documento'); return false; }
        if (!numeroDocumento.trim()) { alert('El número de documento es obligatorio'); return false; }
        if (!nombre.trim()) { alert('El nombre es obligatorio'); return false; }
        if (tieneCredito && (!limiteCredito || parseFloat(limiteCredito) < 0)) {
            alert('Debes definir un límite de crédito válido');
            return false;
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
                    observacion: observacionCredito || 'Actualización desde edición de cliente'
                }
            }

            const resultado = await actualizarClienteYCredito(dataToUpdate)

            if (resultado.success) {
                alert(resultado.mensaje)
                router.push('/admin/clientes')
            } else {
                alert(resultado.mensaje || 'Error al actualizar cliente')
            }
        } catch (error) {
            console.error('Error al actualizar cliente:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="sync-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando datos del cliente...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerLeft}>
                    <h1 className={estilos.titulo}>✏️ Editar Cliente</h1>
                    <p className={estilos.subtitulo}>
                        Actualiza la información personal, perfil crediticio e imagen del cliente
                    </p>
                </div>
                <button
                    className={estilos.btnCancelarHeader}
                    onClick={() => router.push('/admin/clientes')}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <form onSubmit={manejarSubmit} className={estilos.formulario}>
                <div className={estilos.layoutPrincipal}>

                    <div className={estilos.columnaIzquierda}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="person-circle-outline"></ion-icon>
                                <span>Información del Cliente</span>
                            </h3>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        Tipo de Documento 
                                        <span style={{color: '#ef4444', marginLeft: '4px'}}>*</span>
                                    </label>
                                    <select
                                        value={tipoDocumentoId}
                                        onChange={(e) => setTipoDocumentoId(e.target.value)}
                                        className={estilos.select}
                                        required
                                        disabled={procesando}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {tiposDocumento.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>
                                        Número de Documento 
                                        <span style={{color: '#ef4444', marginLeft: '4px'}}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={numeroDocumento}
                                        onChange={(e) => setNumeroDocumento(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Ej: 001-1234567-8"
                                        required
                                        disabled={procesando}
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        Nombre 
                                        <span style={{color: '#ef4444', marginLeft: '4px'}}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Nombre del cliente"
                                        required
                                        disabled={procesando}
                                    />
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Apellidos</label>
                                    <input
                                        type="text"
                                        value={apellidos}
                                        onChange={(e) => setApellidos(e.target.value)}
                                        className={estilos.input}
                                        placeholder="Apellidos (opcional)"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>

                            <div className={estilos.gridDosColumnas}>
                                <div className={estilos.grupoInput}>
                                    <label>
                                        <ion-icon name="call-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                        Teléfono
                                    </label>
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
                                    <label>
                                        <ion-icon name="mail-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={estilos.input}
                                        placeholder="cliente@ejemplo.com"
                                        disabled={procesando}
                                    />
                                </div>
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>
                                    <ion-icon name="location-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                    Dirección
                                </label>
                                <textarea
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    className={estilos.textarea}
                                    placeholder="Calle, número, sector, ciudad..."
                                    disabled={procesando}
                                />
                            </div>

                            <div className={estilos.grupoInputCheck}>
                                <label className={estilos.labelCheck}>
                                    <input
                                        type="checkbox"
                                        checked={activo}
                                        onChange={(e) => setActivo(e.target.checked)}
                                        disabled={procesando}
                                    />
                                    <span>
                                        <ion-icon 
                                            name={activo ? "checkmark-circle" : "close-circle"} 
                                            style={{
                                                fontSize: '20px', 
                                                verticalAlign: 'middle', 
                                                marginRight: '6px',
                                                color: activo ? '#10b981' : '#ef4444'
                                            }}
                                        ></ion-icon>
                                        Cliente {activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="card-outline"></ion-icon>
                                <span>Configuración de Crédito</span>
                            </h3>

                            <div className={estilos.grupoInputCheck}>
                                <label className={estilos.labelCheck}>
                                    <input
                                        type="checkbox"
                                        checked={tieneCredito}
                                        onChange={(e) => setTieneCredito(e.target.checked)}
                                        disabled={procesando}
                                    />
                                    <span>
                                        <ion-icon 
                                            name={tieneCredito ? "wallet" : "wallet-outline"} 
                                            style={{
                                                fontSize: '20px', 
                                                verticalAlign: 'middle', 
                                                marginRight: '6px',
                                                color: tieneCredito ? '#3b82f6' : '#64748b'
                                            }}
                                        ></ion-icon>
                                        Habilitar crédito para este cliente
                                    </span>
                                </label>
                            </div>

                            {tieneCredito && (
                                <div className={estilos.gridDosColumnas}>
                                    <div className={estilos.grupoInput}>
                                        <label>
                                            <ion-icon name="cash-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                            Límite de Crédito 
                                            <span style={{color: '#ef4444', marginLeft: '4px'}}>*</span>
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
                                        <label>
                                            <ion-icon name="calendar-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                            Frecuencia de Pago
                                        </label>
                                        <select
                                            value={frecuenciaPago}
                                            onChange={(e) => setFrecuenciaPago(e.target.value)}
                                            className={estilos.select}
                                            disabled={procesando}
                                        >
                                            <option value="semanal">📅 Semanal</option>
                                            <option value="quincenal">📅 Quincenal</option>
                                            <option value="mensual">📅 Mensual</option>
                                            <option value="personalizada">⚙️ Personalizada</option>
                                        </select>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>
                                            <ion-icon name="time-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                            Días de Plazo / Gracia
                                        </label>
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
                                    
                                    <div className={estilos.grupoInput} style={{gridColumn: '1 / -1'}}>
                                        <label>
                                            <ion-icon name="document-text-outline" style={{fontSize: '16px', verticalAlign: 'middle'}}></ion-icon>
                                            Observación (opcional)
                                        </label>
                                        <textarea
                                            value={observacionCredito}
                                            onChange={(e) => setObservacionCredito(e.target.value)}
                                            className={estilos.textarea}
                                            placeholder="Motivo del ajuste de crédito o notas adicionales..."
                                            disabled={procesando}
                                            style={{minHeight: '80px'}}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={estilos.columnaDerecha}>
                        <div className={`${estilos.seccion} ${estilos[tema]}`}>
                            <h3 className={estilos.tituloSeccion}>
                                <ion-icon name="camera-outline"></ion-icon>
                                <span>Identificación Visual</span>
                            </h3>

                            <div className={estilos.seccionFoto}>
                                <div className={estilos.contenedorPreview} onClick={() => fileInputRef.current?.click()}>
                                    {previewFoto ? (
                                        <img src={previewFoto} alt="Preview" className={estilos.previewImg} />
                                    ) : (
                                        <div className={estilos.placeholderFoto}>
                                            <ion-icon name="person-add-outline"></ion-icon>
                                            <span>Actualizar Foto</span>
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
                                <p style={{ 
                                    fontSize: '13px', 
                                    color: tema === 'light' ? '#64748b' : '#94a3b8', 
                                    textAlign: 'center',
                                    margin: '0',
                                    fontWeight: '500'
                                }}>
                                    <ion-icon name="cloud-upload-outline" style={{fontSize: '18px', verticalAlign: 'middle', marginRight: '6px'}}></ion-icon>
                                    Click para actualizar la imagen
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={estilos.footerFormulario}>
                    <button
                        type="button"
                        onClick={() => router.push('/admin/clientes')}
                        className={estilos.btnCancelarForm}
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
                                <ion-icon name="sync-outline" style={{animation: 'spin 1s linear infinite'}}></ion-icon>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Guardar Cambios</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

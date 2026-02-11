"use client"
import { useEffect, useState } from 'react'
import { obtenerConfiguracion, actualizarPlataforma, actualizarSuperAdmin, subirImagen } from './servidor'
import estilos from './configuracion.module.css'
import Cropper from 'react-easy-crop'
import TerminosAdmin from '@/_Pages/superadmin/terminos/terminos'

export default function ConfiguracionSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [tabActiva, setTabActiva] = useState('plataforma')

    const [datosPlataforma, setDatosPlataforma] = useState({
        nombre_plataforma: '',
        email_contacto: '',
        telefono_contacto: '',
        telefono_whatsapp: '',
        direccion: '',
        copyright: '',
        logo_url: ''
    })

    const [datosSuperAdmin, setDatosSuperAdmin] = useState({
        nombre: '',
        cedula: '',
        email: '',
        password: '',
        avatar_url: ''
    })

    const [erroresPlataforma, setErroresPlataforma] = useState({})
    const [erroresSuperAdmin, setErroresSuperAdmin] = useState({})
    const [archivoLogo, setArchivoLogo] = useState(null)
    const [archivoAvatar, setArchivoAvatar] = useState(null)
    const [previsualizacionLogo, setPrevisualizacionLogo] = useState('')
    const [previsualizacionAvatar, setPrevisualizacionAvatar] = useState('')

    const [mostrarModalRecorte, setMostrarModalRecorte] = useState(false)
    const [imagenParaRecortar, setImagenParaRecortar] = useState(null)
    const [tipoImagenRecorte, setTipoImagenRecorte] = useState('')
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

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
        cargarConfiguracion()
    }, [])

    const cargarConfiguracion = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerConfiguracion()
            if (resultado.success) {
                if (resultado.plataforma) {
                    setDatosPlataforma({
                        nombre_plataforma: resultado.plataforma.nombre_plataforma || '',
                        email_contacto: resultado.plataforma.email_contacto || '',
                        telefono_contacto: resultado.plataforma.telefono_contacto || '',
                        telefono_whatsapp: resultado.plataforma.telefono_whatsapp || '',
                        direccion: resultado.plataforma.direccion || '',
                        copyright: resultado.plataforma.copyright || '',
                        logo_url: resultado.plataforma.logo_url || ''
                    })
                    setPrevisualizacionLogo(resultado.plataforma.logo_url || '')
                }
                if (resultado.superAdmin) {
                    setDatosSuperAdmin({
                        nombre: resultado.superAdmin.nombre || '',
                        cedula: resultado.superAdmin.cedula || '',
                        email: resultado.superAdmin.email || '',
                        password: '',
                        avatar_url: resultado.superAdmin.avatar_url || ''
                    })
                    setPrevisualizacionAvatar(resultado.superAdmin.avatar_url || '')
                }
            }
        } catch (error) {
            console.error('Error al cargar configuracion:', error)
        } finally {
            setCargando(false)
        }
    }

    const validarFormularioPlataforma = () => {
        const errores = {}

        if (!datosPlataforma.nombre_plataforma.trim()) {
            errores.nombre_plataforma = 'El nombre de la plataforma es requerido'
        }

        if (!datosPlataforma.email_contacto.trim()) {
            errores.email_contacto = 'El email de contacto es requerido'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosPlataforma.email_contacto)) {
            errores.email_contacto = 'Email invalido'
        }

        if (datosPlataforma.telefono_contacto && datosPlataforma.telefono_contacto.length < 10) {
            errores.telefono_contacto = 'Telefono invalido'
        }

        if (datosPlataforma.telefono_whatsapp && datosPlataforma.telefono_whatsapp.length < 10) {
            errores.telefono_whatsapp = 'Telefono WhatsApp invalido'
        }

        setErroresPlataforma(errores)
        return Object.keys(errores).length === 0
    }

    const validarFormularioSuperAdmin = () => {
        const errores = {}

        if (!datosSuperAdmin.nombre.trim()) {
            errores.nombre = 'El nombre es requerido'
        }

        if (!datosSuperAdmin.cedula.trim()) {
            errores.cedula = 'La cedula es requerida'
        } else if (datosSuperAdmin.cedula.length < 11) {
            errores.cedula = 'La cedula debe tener al menos 11 caracteres'
        }

        if (!datosSuperAdmin.email.trim()) {
            errores.email = 'El email es requerido'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosSuperAdmin.email)) {
            errores.email = 'Email invalido'
        }

        if (datosSuperAdmin.password && datosSuperAdmin.password.length < 6) {
            errores.password = 'La contrasena debe tener al menos 6 caracteres'
        }

        setErroresSuperAdmin(errores)
        return Object.keys(errores).length === 0
    }

    const manejarCambioPlataforma = (e) => {
        const { name, value } = e.target
        setDatosPlataforma(prev => ({
            ...prev,
            [name]: value
        }))
        if (erroresPlataforma[name]) {
            setErroresPlataforma(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const manejarCambioSuperAdmin = (e) => {
        const { name, value } = e.target
        setDatosSuperAdmin(prev => ({
            ...prev,
            [name]: value
        }))
        if (erroresSuperAdmin[name]) {
            setErroresSuperAdmin(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const manejarCambioLogo = (e) => {
        const archivo = e.target.files[0]
        if (archivo) {
            if (archivo.size > 5 * 1024 * 1024) {
                alert('El archivo es muy grande. Maximo 5MB')
                return
            }
            if (!archivo.type.startsWith('image/')) {
                alert('Solo se permiten imagenes')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setImagenParaRecortar(reader.result)
                setTipoImagenRecorte('logo')
                setMostrarModalRecorte(true)
                setCrop({ x: 0, y: 0 })
                setZoom(1)
            }
            reader.readAsDataURL(archivo)
        }
        e.target.value = ''
    }

    const manejarCambioAvatar = (e) => {
        const archivo = e.target.files[0]
        if (archivo) {
            if (archivo.size > 5 * 1024 * 1024) {
                alert('El archivo es muy grande. Maximo 5MB')
                return
            }
            if (!archivo.type.startsWith('image/')) {
                alert('Solo se permiten imagenes')
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setImagenParaRecortar(reader.result)
                setTipoImagenRecorte('avatar')
                setMostrarModalRecorte(true)
                setCrop({ x: 0, y: 0 })
                setZoom(1)
            }
            reader.readAsDataURL(archivo)
        }
        e.target.value = ''
    }

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous')
            image.src = url
        })

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob)
            }, 'image/png')
        })
    }

    const aplicarRecorte = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imagenParaRecortar, croppedAreaPixels)
            const archivo = new File([croppedImageBlob], `${tipoImagenRecorte}_recortado.png`, { type: 'image/png' })

            if (tipoImagenRecorte === 'logo') {
                setArchivoLogo(archivo)
                setPrevisualizacionLogo(URL.createObjectURL(croppedImageBlob))
            } else {
                setArchivoAvatar(archivo)
                setPrevisualizacionAvatar(URL.createObjectURL(croppedImageBlob))
            }

            setMostrarModalRecorte(false)
            setImagenParaRecortar(null)
        } catch (error) {
            console.error('Error al recortar imagen:', error)
        }
    }

    const cancelarRecorte = () => {
        setMostrarModalRecorte(false)
        setImagenParaRecortar(null)
    }

    const manejarSubmitPlataforma = async (e) => {
        e.preventDefault()

        if (!validarFormularioPlataforma()) {
            return
        }

        setProcesando(true)
        try {
            let logoUrl = datosPlataforma.logo_url

            if (archivoLogo) {
                const formData = new FormData()
                formData.append('imagen', archivoLogo)
                formData.append('tipo', 'logo')

                const resultadoImagen = await subirImagen(formData)
                if (resultadoImagen.success) {
                    logoUrl = resultadoImagen.url
                } else {
                    alert('Error al subir el logo')
                    setProcesando(false)
                    return
                }
            }

            const resultado = await actualizarPlataforma({
                ...datosPlataforma,
                logo_url: logoUrl
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setArchivoLogo(null)
                await cargarConfiguracion()
            } else {
                alert(resultado.mensaje || 'Error al actualizar')
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarSubmitSuperAdmin = async (e) => {
        e.preventDefault()

        if (!validarFormularioSuperAdmin()) {
            return
        }

        setProcesando(true)
        try {
            let avatarUrl = datosSuperAdmin.avatar_url

            if (archivoAvatar) {
                const formData = new FormData()
                formData.append('imagen', archivoAvatar)
                formData.append('tipo', 'avatar')

                const resultadoImagen = await subirImagen(formData)
                if (resultadoImagen.success) {
                    avatarUrl = resultadoImagen.url
                } else {
                    alert('Error al subir el avatar')
                    setProcesando(false)
                    return
                }
            }

            const resultado = await actualizarSuperAdmin({
                ...datosSuperAdmin,
                avatar_url: avatarUrl
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setArchivoAvatar(null)
                setDatosSuperAdmin(prev => ({ ...prev, password: '' }))
                await cargarConfiguracion()
            } else {
                alert(resultado.mensaje || 'Error al actualizar')
            }
        } catch (error) {
            console.error('Error al guardar:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const eliminarLogo = () => {
        setArchivoLogo(null)
        setPrevisualizacionLogo('')
        setDatosPlataforma(prev => ({
            ...prev,
            logo_url: ''
        }))
    }

    const eliminarAvatar = () => {
        setArchivoAvatar(null)
        setPrevisualizacionAvatar('')
        setDatosSuperAdmin(prev => ({
            ...prev,
            avatar_url: ''
        }))
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando configuracion...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Configuracion</h1>
                    <p className={estilos.subtitulo}>Administra la configuracion de la plataforma y tu perfil</p>
                </div>
            </div>

            <div className={estilos.tabs}>
                <button
                    className={`${estilos.tab} ${tabActiva === 'plataforma' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('plataforma')}
                >
                    <ion-icon name="settings-outline"></ion-icon>
                    <span>Plataforma</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActiva === 'perfil' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('perfil')}
                >
                    <ion-icon name="person-outline"></ion-icon>
                    <span>Mi Perfil</span>
                </button>
                <button
                    className={`${estilos.tab} ${tabActiva === 'terminos' ? estilos.tabActiva : ''}`}
                    onClick={() => setTabActiva('terminos')}
                >
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>Términos y Condiciones</span>
                </button>
            </div>

            {tabActiva === 'plataforma' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <ion-icon name="business-outline"></ion-icon>
                        <div>
                            <h2 className={estilos.seccionTitulo}>Informacion de la Plataforma</h2>
                            <p className={estilos.seccionSubtitulo}>Configura los datos generales del sistema</p>
                        </div>
                    </div>

                    <form onSubmit={manejarSubmitPlataforma} className={estilos.formulario}>
                        <div className={estilos.grupoImagen}>
                            <label className={estilos.labelImagen}>Logo de la Plataforma</label>
                            <div className={estilos.contenedorImagen}>
                                {previsualizacionLogo ? (
                                    <div className={estilos.imagenPreview}>
                                        <img src={previsualizacionLogo} alt="Logo" className={estilos.imagenLogo} />
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarImagen}
                                            onClick={eliminarLogo}
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={estilos.imagenPlaceholder}>
                                        <ion-icon name="image-outline"></ion-icon>
                                        <span>Sin logo</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="logoInput"
                                    accept="image/*"
                                    onChange={manejarCambioLogo}
                                    className={estilos.inputFile}
                                />
                                <label htmlFor="logoInput" className={estilos.btnSubirImagen}>
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    <span>Subir Logo</span>
                                </label>
                                <p className={estilos.textoAyuda}>PNG, JPG o JPEG. Maximo 5MB</p>
                            </div>
                        </div>

                        <div className={estilos.filaForm}>
                            <div className={estilos.grupoInput}>
                                <label>Nombre de la Plataforma *</label>
                                <input
                                    type="text"
                                    name="nombre_plataforma"
                                    value={datosPlataforma.nombre_plataforma}
                                    onChange={manejarCambioPlataforma}
                                    className={erroresPlataforma.nombre_plataforma ? estilos.inputError : ''}
                                    placeholder="Ej: IziWeek"
                                />
                                {erroresPlataforma.nombre_plataforma && (
                                    <span className={estilos.mensajeError}>{erroresPlataforma.nombre_plataforma}</span>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Email de Contacto *</label>
                                <input
                                    type="email"
                                    name="email_contacto"
                                    value={datosPlataforma.email_contacto}
                                    onChange={manejarCambioPlataforma}
                                    className={erroresPlataforma.email_contacto ? estilos.inputError : ''}
                                    placeholder="contacto@ejemplo.com"
                                />
                                {erroresPlataforma.email_contacto && (
                                    <span className={estilos.mensajeError}>{erroresPlataforma.email_contacto}</span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.filaForm}>
                            <div className={estilos.grupoInput}>
                                <label>Telefono de Contacto</label>
                                <input
                                    type="tel"
                                    name="telefono_contacto"
                                    value={datosPlataforma.telefono_contacto}
                                    onChange={manejarCambioPlataforma}
                                    className={erroresPlataforma.telefono_contacto ? estilos.inputError : ''}
                                    placeholder="8091234567"
                                    maxLength="20"
                                />
                                {erroresPlataforma.telefono_contacto && (
                                    <span className={estilos.mensajeError}>{erroresPlataforma.telefono_contacto}</span>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Telefono WhatsApp</label>
                                <input
                                    type="tel"
                                    name="telefono_whatsapp"
                                    value={datosPlataforma.telefono_whatsapp}
                                    onChange={manejarCambioPlataforma}
                                    className={erroresPlataforma.telefono_whatsapp ? estilos.inputError : ''}
                                    placeholder="8091234567"
                                    maxLength="20"
                                />
                                {erroresPlataforma.telefono_whatsapp && (
                                    <span className={estilos.mensajeError}>{erroresPlataforma.telefono_whatsapp}</span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Direccion</label>
                            <textarea
                                name="direccion"
                                value={datosPlataforma.direccion}
                                onChange={manejarCambioPlataforma}
                                rows="3"
                                placeholder="Direccion completa de la oficina principal"
                            />
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Copyright</label>
                            <input
                                type="text"
                                name="copyright"
                                value={datosPlataforma.copyright}
                                onChange={manejarCambioPlataforma}
                                placeholder="© 2025 IziWeek. Todos los derechos reservados."
                            />
                        </div>

                        <div className={estilos.formularioFooter}>
                            <button
                                type="submit"
                                className={estilos.btnGuardar}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <>
                                        <ion-icon name="hourglass-outline"></ion-icon>
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
            )}

            {tabActiva === 'perfil' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <ion-icon name="person-circle-outline"></ion-icon>
                        <div>
                            <h2 className={estilos.seccionTitulo}>Mi Perfil de Super Administrador</h2>
                            <p className={estilos.seccionSubtitulo}>Actualiza tu informacion personal</p>
                        </div>
                    </div>

                    <form onSubmit={manejarSubmitSuperAdmin} className={estilos.formulario}>
                        <div className={estilos.grupoImagen}>
                            <label className={estilos.labelImagen}>Foto de Perfil</label>
                            <div className={estilos.contenedorImagen}>
                                {previsualizacionAvatar ? (
                                    <div className={estilos.imagenPreview}>
                                        <img src={previsualizacionAvatar} alt="Avatar" className={estilos.imagenAvatar} />
                                        <button
                                            type="button"
                                            className={estilos.btnEliminarImagen}
                                            onClick={eliminarAvatar}
                                        >
                                            <ion-icon name="trash-outline"></ion-icon>
                                        </button>
                                    </div>
                                ) : (
                                    <div className={estilos.imagenPlaceholder}>
                                        <ion-icon name="person-outline"></ion-icon>
                                        <span>Sin foto</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="avatarInput"
                                    accept="image/*"
                                    onChange={manejarCambioAvatar}
                                    className={estilos.inputFile}
                                />
                                <label htmlFor="avatarInput" className={estilos.btnSubirImagen}>
                                    <ion-icon name="cloud-upload-outline"></ion-icon>
                                    <span>Subir Foto</span>
                                </label>
                                <p className={estilos.textoAyuda}>PNG, JPG o JPEG. Maximo 5MB</p>
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Nombre Completo *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={datosSuperAdmin.nombre}
                                onChange={manejarCambioSuperAdmin}
                                className={erroresSuperAdmin.nombre ? estilos.inputError : ''}
                                placeholder="Ej: Juan Perez"
                            />
                            {erroresSuperAdmin.nombre && (
                                <span className={estilos.mensajeError}>{erroresSuperAdmin.nombre}</span>
                            )}
                        </div>

                        <div className={estilos.filaForm}>
                            <div className={estilos.grupoInput}>
                                <label>Cedula *</label>
                                <input
                                    type="text"
                                    name="cedula"
                                    value={datosSuperAdmin.cedula}
                                    onChange={manejarCambioSuperAdmin}
                                    className={erroresSuperAdmin.cedula ? estilos.inputError : ''}
                                    placeholder="00000000000"
                                    maxLength="20"
                                />
                                {erroresSuperAdmin.cedula && (
                                    <span className={estilos.mensajeError}>{erroresSuperAdmin.cedula}</span>
                                )}
                            </div>

                            <div className={estilos.grupoInput}>
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={datosSuperAdmin.email}
                                    onChange={manejarCambioSuperAdmin}
                                    className={erroresSuperAdmin.email ? estilos.inputError : ''}
                                    placeholder="correo@ejemplo.com"
                                />
                                {erroresSuperAdmin.email && (
                                    <span className={estilos.mensajeError}>{erroresSuperAdmin.email}</span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Nueva Contrasena (dejar vacio para mantener)</label>
                            <input
                                type="password"
                                name="password"
                                value={datosSuperAdmin.password}
                                onChange={manejarCambioSuperAdmin}
                                className={erroresSuperAdmin.password ? estilos.inputError : ''}
                                placeholder="Minimo 6 caracteres"
                            />
                            {erroresSuperAdmin.password && (
                                <span className={estilos.mensajeError}>{erroresSuperAdmin.password}</span>
                            )}
                        </div>

                        <div className={estilos.formularioFooter}>
                            <button
                                type="submit"
                                className={estilos.btnGuardar}
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <>
                                        <ion-icon name="hourglass-outline"></ion-icon>
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
            )}

            {tabActiva === 'terminos' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <TerminosAdmin />
                </div>
            )}

            {mostrarModalRecorte && (
                <div className={estilos.modalRecorte}>
                    <div className={`${estilos.modalRecorteContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalRecorteHeader}>
                            <h3>Recortar {tipoImagenRecorte === 'logo' ? 'Logo' : 'Foto'}</h3>
                            <button onClick={cancelarRecorte} className={estilos.btnCerrarRecorte}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.cropContainer}>
                            <Cropper
                                image={imagenParaRecortar}
                                crop={crop}
                                zoom={zoom}
                                aspect={tipoImagenRecorte === 'logo' ? 16 / 9 : 1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className={estilos.controlesCrop}>
                            <label>Zoom</label>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className={estilos.sliderZoom}
                            />
                        </div>

                        <div className={estilos.modalRecorteFooter}>
                            <button
                                type="button"
                                onClick={cancelarRecorte}
                                className={estilos.btnCancelarRecorte}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={aplicarRecorte}
                                className={estilos.btnAplicarRecorte}
                            >
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>Aplicar Recorte</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
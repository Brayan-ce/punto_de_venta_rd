"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import { obtenerPerfil, actualizarPerfil, subirAvatar } from './servidor'
import estilos from './perfil.module.css'

export default function PerfilAdmin() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    
    const [datosPerfil, setDatosPerfil] = useState({
        nombre: '',
        cedula: '',
        email: '',
        password: '',
        avatar_url: ''
    })

    const [errores, setErrores] = useState({})
    const [archivoAvatar, setArchivoAvatar] = useState(null)
    const [previsualizacionAvatar, setPrevisualizacionAvatar] = useState('')
    const [mostrarPassword, setMostrarPassword] = useState(false)

    const [mostrarModalRecorte, setMostrarModalRecorte] = useState(false)
    const [imagenParaRecortar, setImagenParaRecortar] = useState(null)
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
        cargarPerfil()
    }, [])

    const cargarPerfil = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerPerfil()
            if (resultado.success) {
                setDatosPerfil({
                    nombre: resultado.usuario.nombre || '',
                    cedula: resultado.usuario.cedula || '',
                    email: resultado.usuario.email || '',
                    password: '',
                    avatar_url: resultado.usuario.avatar_url || ''
                })
                setPrevisualizacionAvatar(resultado.usuario.avatar_url || '')
            } else {
                alert(resultado.mensaje || 'Error al cargar perfil')
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error)
            alert('Error al cargar datos')
        } finally {
            setCargando(false)
        }
    }

    const validarFormulario = () => {
        const erroresTemp = {}

        if (!datosPerfil.nombre.trim()) {
            erroresTemp.nombre = 'El nombre es requerido'
        }

        if (datosPerfil.password && datosPerfil.password.length < 6) {
            erroresTemp.password = 'La contrasena debe tener al menos 6 caracteres'
        }

        setErrores(erroresTemp)
        return Object.keys(erroresTemp).length === 0
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setDatosPerfil(prev => ({
            ...prev,
            [name]: value
        }))
        if (errores[name]) {
            setErrores(prev => ({
                ...prev,
                [name]: ''
            }))
        }
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
            const archivo = new File([croppedImageBlob], 'avatar_recortado.png', { type: 'image/png' })

            setArchivoAvatar(archivo)
            setPrevisualizacionAvatar(URL.createObjectURL(croppedImageBlob))

            setMostrarModalRecorte(false)
            setImagenParaRecortar(null)
        } catch (error) {
            console.error('Error al recortar imagen:', error)
            alert('Error al recortar la imagen')
        }
    }

    const cancelarRecorte = () => {
        setMostrarModalRecorte(false)
        setImagenParaRecortar(null)
    }

    const eliminarAvatar = () => {
        setArchivoAvatar(null)
        setPrevisualizacionAvatar('')
        setDatosPerfil(prev => ({
            ...prev,
            avatar_url: ''
        }))
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        if (!validarFormulario()) {
            return
        }

        setProcesando(true)
        try {
            let avatarUrl = datosPerfil.avatar_url

            if (archivoAvatar) {
                const formData = new FormData()
                formData.append('avatar', archivoAvatar)

                const resultadoImagen = await subirAvatar(formData)
                if (resultadoImagen.success) {
                    avatarUrl = resultadoImagen.url
                } else {
                    alert('Error al subir el avatar')
                    setProcesando(false)
                    return
                }
            }

            const resultado = await actualizarPerfil({
                ...datosPerfil,
                avatar_url: avatarUrl
            })

            if (resultado.success) {
                alert(resultado.mensaje)
                setArchivoAvatar(null)
                setDatosPerfil(prev => ({ ...prev, password: '' }))
                await cargarPerfil()
                
                window.dispatchEvent(new Event('actualizarPerfil'))
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

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando perfil...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Mi Perfil</h1>
                    <p className={estilos.subtitulo}>Actualiza tu informacion personal</p>
                </div>
            </div>

            <div className={`${estilos.seccion} ${estilos[tema]}`}>
                <div className={estilos.seccionHeader}>
                    <ion-icon name="person-circle-outline"></ion-icon>
                    <div>
                        <h2 className={estilos.seccionTitulo}>Informacion Personal</h2>
                        <p className={estilos.seccionSubtitulo}>Gestiona tus datos de usuario</p>
                    </div>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
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
                            value={datosPerfil.nombre}
                            onChange={manejarCambio}
                            className={errores.nombre ? estilos.inputError : ''}
                            placeholder="Ej: Juan Perez"
                            disabled={procesando}
                        />
                        {errores.nombre && (
                            <span className={estilos.mensajeError}>{errores.nombre}</span>
                        )}
                    </div>

                    <div className={estilos.filaForm}>
                        <div className={estilos.grupoInput}>
                            <label>Cedula</label>
                            <input
                                type="text"
                                name="cedula"
                                value={datosPerfil.cedula}
                                className={estilos.inputDisabled}
                                disabled
                            />
                            <span className={estilos.textoAyuda}>No se puede modificar</span>
                        </div>

                        <div className={estilos.grupoInput}>
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={datosPerfil.email}
                                className={estilos.inputDisabled}
                                disabled
                            />
                            <span className={estilos.textoAyuda}>No se puede modificar</span>
                        </div>
                    </div>

                    <div className={estilos.grupoInput}>
                        <label>Nueva Contrasena (dejar vacio para mantener)</label>
                        <div className={estilos.passwordWrapper}>
                            <input
                                type={mostrarPassword ? "text" : "password"}
                                name="password"
                                value={datosPerfil.password}
                                onChange={manejarCambio}
                                className={errores.password ? estilos.inputError : ''}
                                placeholder="Minimo 6 caracteres"
                                disabled={procesando}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className={estilos.btnPassword}
                            >
                                <ion-icon name={mostrarPassword ? "eye-off-outline" : "eye-outline"}></ion-icon>
                            </button>
                        </div>
                        {errores.password && (
                            <span className={estilos.mensajeError}>{errores.password}</span>
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

            {mostrarModalRecorte && (
                <div className={estilos.modalRecorte}>
                    <div className={`${estilos.modalRecorteContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalRecorteHeader}>
                            <h3>Recortar Foto de Perfil</h3>
                            <button onClick={cancelarRecorte} className={estilos.btnCerrarRecorte}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <div className={estilos.cropContainer}>
                            <Cropper
                                image={imagenParaRecortar}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                cropShape="round"
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
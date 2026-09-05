"use client"

import { useEffect, useState, useRef } from 'react'
import { obtenerGuias, crearGuia, actualizarGuia, eliminarGuia, reordenarGuias, toggleActivoGuia } from './servidor'
import estilos from './guia.module.css'

const UPLOAD_URL = '/api/upload-video'

const TIPOS = [
    { value: 'video', label: 'Video (URL)', icon: 'play-circle-outline' },
    { value: 'video_local', label: 'Video (MP4 subido)', icon: 'cloud-upload-outline' },
    { value: 'texto', label: 'Texto', icon: 'document-text-outline' },
    { value: 'imagen', label: 'Imagen', icon: 'image-outline' },
    { value: 'pdf', label: 'PDF', icon: 'document-attach-outline' },
]

const TIPO_ICONS = {
    video: 'play-circle-outline',
    video_local: 'cloud-upload-outline',
    texto: 'document-text-outline',
    imagen: 'image-outline',
    pdf: 'document-attach-outline',
}

const FORM_VACIO = { titulo: '', descripcion: '', tipo: 'video', contenido: '', orden: 0, activo: true }

export default function GuiaPage() {
    const [tema, setTema] = useState('light')
    const [guias, setGuias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [modalVer, setModalVer] = useState(null)
    const [modalForm, setModalForm] = useState(false)
    const [modalEliminar, setModalEliminar] = useState(null)
    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState(FORM_VACIO)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [dragIndex, setDragIndex] = useState(null)
    const [dragOver, setDragOver] = useState(null)
    const [videoFile, setVideoFile] = useState(null)
    const [subiendoVideo, setSubiendoVideo] = useState(false)
    const [progresoSubida, setProgresoSubida] = useState(0)
    const dragItem = useRef(null)
    const dragOverItem = useRef(null)
    const videoInputRef = useRef(null)

    useEffect(() => {
        const t = localStorage.getItem('tema') || 'light'
        setTema(t)
        const handler = () => setTema(localStorage.getItem('tema') || 'light')
        window.addEventListener('temaChange', handler)
        window.addEventListener('storage', handler)
        return () => { window.removeEventListener('temaChange', handler); window.removeEventListener('storage', handler) }
    }, [])

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        setCargando(true)
        const res = await obtenerGuias()
        if (res.success) setGuias(res.guias)
        setCargando(false)
    }

    const mostrarMensaje = (texto, tipo = 'success') => {
        setMensaje({ texto, tipo })
        setTimeout(() => setMensaje(null), 3000)
    }

    const abrirCrear = () => {
        setEditando(null)
        setVideoFile(null)
        setProgresoSubida(0)
        setForm({ ...FORM_VACIO, orden: guias.length + 1 })
        setModalForm(true)
    }

    const abrirEditar = (guia) => {
        setEditando(guia)
        setVideoFile(null)
        setProgresoSubida(0)
        setForm({
            titulo: guia.titulo,
            descripcion: guia.descripcion || '',
            tipo: guia.tipo,
            contenido: guia.contenido || '',
            orden: guia.orden,
            activo: guia.activo === 1 || guia.activo === true,
        })
        setModalForm(true)
    }

    const cerrarForm = () => {
        setModalForm(false)
        setEditando(null)
        setForm(FORM_VACIO)
        setVideoFile(null)
        setProgresoSubida(0)
    }

    const handleVideoFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('video/')) {
            mostrarMensaje('Solo se permiten archivos de video', 'error')
            return
        }
        if (file.size > 500 * 1024 * 1024) {
            mostrarMensaje('El video no puede superar los 500 MB', 'error')
            return
        }
        setVideoFile(file)
        setForm(f => ({ ...f, contenido: '' }))
    }

    // Sube directo al Flask desde el browser con XMLHttpRequest para tener progreso real
    const subirVideoDirecto = (file) => {
        return new Promise((resolve, reject) => {
            const fd = new FormData()
            fd.append('video', file)

            const xhr = new XMLHttpRequest()

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 95)
                    setProgresoSubida(pct)
                }
            }

            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const data = JSON.parse(xhr.responseText)
                        if (data.success) {
                            setProgresoSubida(100)
                            resolve(data.ruta)
                        } else {
                            reject(new Error(data.mensaje || 'Error al subir'))
                        }
                    } catch {
                        reject(new Error('Respuesta inválida del servidor'))
                    }
                } else {
                    reject(new Error(`Error HTTP ${xhr.status}`))
                }
            }

            xhr.onerror = () => reject(new Error('Error de red al subir el video'))
            xhr.open('POST', UPLOAD_URL)
            xhr.send(fd)
        })
    }

    const handleGuardar = async () => {
        if (!form.titulo.trim()) return mostrarMensaje('El título es requerido', 'error')

        setGuardando(true)
        let contenidoFinal = form.contenido

        if (form.tipo === 'video_local' && videoFile) {
            setSubiendoVideo(true)
            setProgresoSubida(0)
            try {
                contenidoFinal = await subirVideoDirecto(videoFile)
            } catch (err) {
                setGuardando(false)
                setSubiendoVideo(false)
                setProgresoSubida(0)
                return mostrarMensaje(err.message || 'Error al subir el video', 'error')
            }
            setSubiendoVideo(false)
        }

        if (form.tipo === 'video_local' && !contenidoFinal) {
            setGuardando(false)
            return mostrarMensaje('Debes subir un archivo MP4', 'error')
        }

        const datosGuardar = { ...form, contenido: contenidoFinal }
        const res = editando
            ? await actualizarGuia(editando.id, datosGuardar)
            : await crearGuia(datosGuardar)

        setGuardando(false)
        setProgresoSubida(0)

        if (res.success) {
            mostrarMensaje(res.mensaje)
            cerrarForm()
            cargar()
        } else {
            mostrarMensaje(res.mensaje, 'error')
        }
    }

    const handleEliminar = async () => {
        if (!modalEliminar) return
        const res = await eliminarGuia(modalEliminar.id)
        setModalEliminar(null)
        if (res.success) { mostrarMensaje(res.mensaje); cargar() }
        else mostrarMensaje(res.mensaje, 'error')
    }

    const handleToggle = async (guia) => {
        const nuevoActivo = !(guia.activo === 1 || guia.activo === true)
        const res = await toggleActivoGuia(guia.id, nuevoActivo)
        if (res.success) cargar()
        else mostrarMensaje(res.mensaje, 'error')
    }

    const handleDragStart = (index) => { dragItem.current = index; setDragIndex(index) }
    const handleDragEnter = (index) => { dragOverItem.current = index; setDragOver(index) }
    const handleDragEnd = async () => {
        const from = dragItem.current
        const to = dragOverItem.current
        if (from === null || to === null || from === to) { setDragIndex(null); setDragOver(null); return }
        const nuevas = [...guias]
        const [moved] = nuevas.splice(from, 1)
        nuevas.splice(to, 0, moved)
        const actualizadas = nuevas.map((g, i) => ({ ...g, orden: i + 1 }))
        setGuias(actualizadas)
        setDragIndex(null); setDragOver(null)
        dragItem.current = null; dragOverItem.current = null
        await reordenarGuias(actualizadas.map(g => ({ id: g.id, orden: g.orden })))
    }

    const getEmbedUrl = (url) => {
        if (!url) return null
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/)
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
        if (url.includes('/embed/') || url.includes('player.vimeo')) return url
        return null
    }

    const renderContenido = (guia) => {
        if (!guia.contenido) return <p className={estilos.sinContenido}>Sin contenido disponible</p>

        if (guia.tipo === 'video') {
            const url = getEmbedUrl(guia.contenido)
            return url
                ? <iframe className={estilos.videoFrame} src={url} allowFullScreen title={guia.titulo} />
                : <p className={estilos.sinContenido}>URL de video no válida</p>
        }
        if (guia.tipo === 'video_local') {
            return (
                <video controls preload="metadata" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', background: '#000', border: 'none' }}>
                    <source src={guia.contenido} type="video/mp4" />
                    Tu navegador no soporta reproducción de video.
                </video>
            )
        }
        if (guia.tipo === 'pdf') return <iframe className={estilos.pdfFrame} src={guia.contenido} title={guia.titulo} />
        if (guia.tipo === 'texto') return <div className={estilos.textoContenido} dangerouslySetInnerHTML={{ __html: guia.contenido }} />
        if (guia.tipo === 'imagen') return <img src={guia.contenido} alt={guia.titulo} className={estilos.imagenContenido} />
    }

    const labelContenido = () => {
        switch (form.tipo) {
            case 'video': return 'URL del Video (YouTube o Vimeo)'
            case 'video_local': return 'Archivo MP4'
            case 'pdf': return 'URL del PDF'
            case 'imagen': return 'URL de la Imagen'
            default: return 'Contenido HTML'
        }
    }

    return (
        <div className={`${estilos.pagina} ${estilos[tema]}`}>
            {mensaje && (
                <div className={`${estilos.toast} ${estilos[mensaje.tipo]}`}>
                    <ion-icon name={mensaje.tipo === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}></ion-icon>
                    {mensaje.texto}
                </div>
            )}

            <div className={estilos.encabezado}>
                <div>
                    <h1 className={estilos.titulo}>Guías de Contenido</h1>
                    <p className={estilos.subtitulo}>{guias.length} {guias.length === 1 ? 'guía registrada' : 'guías registradas'}</p>
                </div>
                <button className={estilos.btnPrimario} onClick={abrirCrear}>
                    <ion-icon name="add-outline"></ion-icon>
                    Nueva Guía
                </button>
            </div>

            {cargando ? (
                <div className={estilos.estadoVacio}>
                    <div className={estilos.spinner}></div>
                    <p>Cargando guías...</p>
                </div>
            ) : guias.length === 0 ? (
                <div className={estilos.estadoVacio}>
                    <ion-icon name="book-outline"></ion-icon>
                    <p>No hay guías creadas aún</p>
                    <button className={estilos.btnPrimario} onClick={abrirCrear}>Crear primera guía</button>
                </div>
            ) : (
                <div className={estilos.tabla}>
                    <div className={estilos.tablaEncabezado}>
                        <span>#</span>
                        <span>Título</span>
                        <span>Tipo</span>
                        <span>Estado</span>
                        <span>Fecha</span>
                        <span>Acciones</span>
                    </div>
                    {guias.map((guia, index) => (
                        <div
                            key={guia.id}
                            className={`${estilos.tablaFila} ${dragIndex === index ? estilos.dragging : ''} ${dragOver === index ? estilos.dragOver : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={e => e.preventDefault()}
                        >
                            <span className={estilos.ordenHandle}>
                                <ion-icon name="reorder-three-outline"></ion-icon>
                                <span className={estilos.ordenNum}>{guia.orden}</span>
                            </span>
                            <span className={estilos.tituloCell}>
                                <button className={estilos.btnTitulo} onClick={() => setModalVer(guia)}>
                                    {guia.titulo}
                                </button>
                                {guia.descripcion && <span className={estilos.descripcionCell}>{guia.descripcion}</span>}
                            </span>
                            <span>
                                <span className={`${estilos.badge} ${estilos[guia.tipo]}`}>
                                    <ion-icon name={TIPO_ICONS[guia.tipo] || 'play-circle-outline'}></ion-icon>
                                    {TIPOS.find(t => t.value === guia.tipo)?.label || guia.tipo}
                                </span>
                            </span>
                            <span>
                                <button
                                    className={`${estilos.toggle} ${(guia.activo === 1 || guia.activo === true) ? estilos.toggleOn : estilos.toggleOff}`}
                                    onClick={() => handleToggle(guia)}
                                    title={guia.activo ? 'Desactivar' : 'Activar'}
                                >
                                    <span className={estilos.toggleKnob}></span>
                                </button>
                            </span>
                            <span className={estilos.fechaCell}>
                                {new Date(guia.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className={estilos.acciones}>
                                <button className={estilos.btnIcono} onClick={() => setModalVer(guia)} title="Ver">
                                    <ion-icon name="eye-outline"></ion-icon>
                                </button>
                                <button className={estilos.btnIcono} onClick={() => abrirEditar(guia)} title="Editar">
                                    <ion-icon name="pencil-outline"></ion-icon>
                                </button>
                                <button className={`${estilos.btnIcono} ${estilos.btnEliminar}`} onClick={() => setModalEliminar(guia)} title="Eliminar">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Ver */}
            {modalVer && (
                <div className={estilos.overlay} onClick={() => setModalVer(null)}>
                    <div className={`${estilos.modal} ${estilos.modalGrande} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <div>
                                <span className={`${estilos.badge} ${estilos[modalVer.tipo]}`}>
                                    <ion-icon name={TIPO_ICONS[modalVer.tipo] || 'play-circle-outline'}></ion-icon>
                                    {TIPOS.find(t => t.value === modalVer.tipo)?.label || modalVer.tipo}
                                </span>
                                <h2 className={estilos.modalTitulo}>{modalVer.titulo}</h2>
                                {modalVer.descripcion && <p className={estilos.modalDescripcion}>{modalVer.descripcion}</p>}
                            </div>
                            <button className={estilos.btnCerrar} onClick={() => setModalVer(null)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalCuerpo}>
                            {renderContenido(modalVer)}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {modalForm && (
                <div className={estilos.overlay} onClick={cerrarForm}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2 className={estilos.modalTitulo}>{editando ? 'Editar Guía' : 'Nueva Guía'}</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarForm}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalCuerpo}>
                            <div className={estilos.formGrupo}>
                                <label className={estilos.label}>Título *</label>
                                <input
                                    className={estilos.input}
                                    value={form.titulo}
                                    onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                    placeholder="Título de la guía"
                                />
                            </div>
                            <div className={estilos.formGrupo}>
                                <label className={estilos.label}>Descripción</label>
                                <input
                                    className={estilos.input}
                                    value={form.descripcion}
                                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                    placeholder="Descripción breve (opcional)"
                                />
                            </div>
                            <div className={estilos.formFila}>
                                <div className={estilos.formGrupo}>
                                    <label className={estilos.label}>Tipo *</label>
                                    <select
                                        className={estilos.select}
                                        value={form.tipo}
                                        onChange={e => {
                                            setForm(f => ({ ...f, tipo: e.target.value, contenido: '' }))
                                            setVideoFile(null)
                                        }}
                                    >
                                        {TIPOS.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={estilos.formGrupo}>
                                    <label className={estilos.label}>Orden</label>
                                    <input
                                        className={estilos.input}
                                        type="number"
                                        value={form.orden}
                                        onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value) || 0 }))}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className={estilos.formGrupo}>
                                <label className={estilos.label}>{labelContenido()}</label>

                                {form.tipo === 'video_local' ? (
                                    <div className={estilos.uploadArea}>
                                        <input
                                            ref={videoInputRef}
                                            type="file"
                                            accept="video/mp4,video/*"
                                            style={{ display: 'none' }}
                                            onChange={handleVideoFileChange}
                                        />
                                        {videoFile ? (
                                            <div className={estilos.videoSeleccionado}>
                                                <ion-icon name="film-outline"></ion-icon>
                                                <div className={estilos.videoInfo}>
                                                    <span className={estilos.videoNombre}>{videoFile.name}</span>
                                                    <span className={estilos.videoTamano}>
                                                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={estilos.btnQuitarVideo}
                                                    onClick={() => { setVideoFile(null); setForm(f => ({ ...f, contenido: '' })) }}
                                                >
                                                    <ion-icon name="close-circle-outline"></ion-icon>
                                                </button>
                                            </div>
                                        ) : form.contenido ? (
                                            <div className={estilos.videoExistente}>
                                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                <span>Video actual: <strong>{form.contenido.split('/').pop()}</strong></span>
                                                <button
                                                    type="button"
                                                    className={estilos.btnCambiarVideo}
                                                    onClick={() => videoInputRef.current?.click()}
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className={estilos.btnSubirVideo}
                                                onClick={() => videoInputRef.current?.click()}
                                            >
                                                <ion-icon name="cloud-upload-outline"></ion-icon>
                                                <span>Seleccionar archivo MP4</span>
                                                <small>Máximo 500 MB</small>
                                            </button>
                                        )}

                                        {subiendoVideo && (
                                            <div className={estilos.progressBar}>
                                                <div className={estilos.progressFill} style={{ width: `${progresoSubida}%` }} />
                                                <span>Subiendo... {progresoSubida}%</span>
                                            </div>
                                        )}
                                    </div>
                                ) : form.tipo === 'texto' ? (
                                    <textarea
                                        className={`${estilos.input} ${estilos.textarea}`}
                                        value={form.contenido}
                                        onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                                        placeholder="Ingresa el contenido HTML o texto..."
                                        rows={6}
                                    />
                                ) : (
                                    <input
                                        className={estilos.input}
                                        value={form.contenido}
                                        onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                                        placeholder={
                                            form.tipo === 'video' ? 'https://youtube.com/watch?v=...' :
                                            form.tipo === 'pdf' ? 'https://ejemplo.com/archivo.pdf' :
                                            'https://ejemplo.com/imagen.jpg'
                                        }
                                    />
                                )}
                            </div>

                            <div className={estilos.formGrupoCheck}>
                                <label className={estilos.labelCheck}>
                                    <input
                                        type="checkbox"
                                        checked={form.activo}
                                        onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                                        className={estilos.checkbox}
                                    />
                                    Guía activa
                                </label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnSecundario} onClick={cerrarForm}>Cancelar</button>
                            <button className={estilos.btnPrimario} onClick={handleGuardar} disabled={guardando || subiendoVideo}>
                                {subiendoVideo ? `Subiendo... ${progresoSubida}%` : guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Guía'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Eliminar */}
            {modalEliminar && (
                <div className={estilos.overlay} onClick={() => setModalEliminar(null)}>
                    <div className={`${estilos.modal} ${estilos.modalChico} ${estilos[tema]}`} onClick={e => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2 className={estilos.modalTitulo}>Eliminar Guía</h2>
                            <button className={estilos.btnCerrar} onClick={() => setModalEliminar(null)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalCuerpo}>
                            <p className={estilos.textoEliminar}>
                                ¿Estás seguro de que deseas eliminar <strong>"{modalEliminar.titulo}"</strong>? Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button className={estilos.btnSecundario} onClick={() => setModalEliminar(null)}>Cancelar</button>
                            <button className={estilos.btnDanger} onClick={handleEliminar}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
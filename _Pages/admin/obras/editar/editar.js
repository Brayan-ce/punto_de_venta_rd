"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerObraPorId, actualizarObra, obtenerRegionesEmpresa } from './servidor'
import { TIPOS_OBRA, formatearTipoObra, ESTADOS_OBRA, formatearEstadoObra } from '../../core/construction/estados'
import estilos from '../listar/listar.module.css'

export default function EditarObra({ id }) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nombre: '',
        ubicacion: '',
        zona: '',
        municipio: '',
        provincia: '',
        tipo_obra: TIPOS_OBRA.CONSTRUCCION,
        presupuesto_aprobado: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        cliente_id: '',
        responsable_id: '',
        descripcion: '',
        estado: ESTADOS_OBRA.ACTIVA
    })

    const [errors, setErrors] = useState({})
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [regiones, setRegiones] = useState([])

    const tiposObra = [
        { value: TIPOS_OBRA.CONSTRUCCION, label: 'Construcción', icon: '🏗️' },
        { value: TIPOS_OBRA.REMODELACION, label: 'Remodelación', icon: '🔨' },
        { value: TIPOS_OBRA.REPARACION, label: 'Reparación', icon: '🔧' },
        { value: TIPOS_OBRA.MANTENIMIENTO, label: 'Mantenimiento', icon: '⚙️' },
        { value: TIPOS_OBRA.OTRO, label: 'Otro', icon: '📋' }
    ]

    const estadosObra = Object.values(ESTADOS_OBRA).map(estado => ({
        value: estado,
        ...formatearEstadoObra(estado)
    }))

    useEffect(() => {
        cargarObra()
    }, [id])

    useEffect(() => {
        cargarRegiones()
    }, [])

    const cargarRegiones = async () => {
        try {
            const resultado = await obtenerRegionesEmpresa()
            if (resultado.success) {
                setRegiones(resultado.regiones || [])
            }
        } catch (error) {
            console.error('Error al cargar regiones:', error)
        }
    }

    async function cargarObra() {
        setCargando(true)
        const res = await obtenerObraPorId(id)
        if (res.success && res.obra) {
            const obra = res.obra
            setFormData({
                nombre: obra.nombre || '',
                ubicacion: obra.ubicacion || '',
                zona: obra.zona || '',
                municipio: obra.municipio || '',
                provincia: obra.provincia || '',
                tipo_obra: obra.tipo_obra || TIPOS_OBRA.CONSTRUCCION,
                presupuesto_aprobado: obra.presupuesto_aprobado || '',
                fecha_inicio: obra.fecha_inicio ? obra.fecha_inicio.split('T')[0] : '',
                fecha_fin_estimada: obra.fecha_fin_estimada ? obra.fecha_fin_estimada.split('T')[0] : '',
                cliente_id: obra.cliente_id || '',
                responsable_id: obra.usuario_responsable_id || '',
                descripcion: obra.descripcion || '',
                estado: obra.estado || ESTADOS_OBRA.ACTIVA
            })
        } else {
            alert(res.mensaje || 'Error al cargar la obra')
            router.push('/admin/obras')
        }
        setCargando(false)
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcesando(true)

        const datos = {
            ...formData,
            presupuesto_aprobado: parseFloat(formData.presupuesto_aprobado),
            cliente_id: formData.cliente_id || null,
            responsable_id: formData.responsable_id || null,
        }

        const res = await actualizarObra(id, datos)
        setProcesando(false)

        if (res.success) {
            router.push(`/admin/obras/ver/${id}`)
        } else {
            if (res.errores) {
                setErrors(res.errores)
            } else {
                alert(res.mensaje || 'Error al actualizar la obra')
            }
        }
    }

    if (cargando) {
        return (
            <div className={estilos.contenedor}>
                <div className={estilos.cargando}>Cargando obra...</div>
            </div>
        )
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Editar Obra</h1>
                    <p className={estilos.subtitulo}>Modifique la información de la obra</p>
                </div>
                <button className={estilos.btnNuevo} onClick={() => router.back()}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    <span>Volver</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className={estilos.modalBody}>
                <div className={estilos.grupo}>
                    <label>Nombre de la Obra *</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className={errors.nombre ? estilos.error : ''}
                    />
                    {errors.nombre && <span className={estilos.errorMsg}>{errors.nombre}</span>}
                </div>

                <div className={estilos.grupo}>
                    <label>Tipo de Obra *</label>
                    <select name="tipo_obra" value={formData.tipo_obra} onChange={handleChange} required>
                        {tiposObra.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                    </select>
                </div>

                <div className={estilos.grupo}>
                    <label>Estado *</label>
                    <select name="estado" value={formData.estado} onChange={handleChange} required>
                        {estadosObra.map(estado => (
                            <option key={estado.value} value={estado.value}>{estado.texto}</option>
                        ))}
                    </select>
                </div>

                <div className={estilos.grupo}>
                    <label>Ubicación / Dirección *</label>
                    <input
                        type="text"
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleChange}
                        required
                        className={errors.ubicacion ? estilos.error : ''}
                    />
                    {errors.ubicacion && <span className={estilos.errorMsg}>{errors.ubicacion}</span>}
                </div>

                <div className={estilos.filaForm}>
                    <div className={estilos.grupo}>
                        <label>Zona / Sector</label>
                        <input
                            type="text"
                            name="zona"
                            value={formData.zona}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={estilos.grupo}>
                        <label>Municipio</label>
                        <input
                            type="text"
                            name="municipio"
                            value={formData.municipio}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={estilos.grupo}>
                    <label>Region / Provincia</label>
                    {regiones.length > 0 ? (
                        <select name="provincia" value={formData.provincia} onChange={handleChange}>
                            <option value="">Seleccione...</option>
                            {regiones.map(region => (
                                <option key={region.id} value={region.nombre}>{region.nombre}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            name="provincia"
                            value={formData.provincia}
                            onChange={handleChange}
                            placeholder="Provincia o region"
                        />
                    )}
                </div>

                <div className={estilos.grupo}>
                    <label>Presupuesto Aprobado (RD$) *</label>
                    <input
                        type="number"
                        name="presupuesto_aprobado"
                        value={formData.presupuesto_aprobado}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                        className={errors.presupuesto_aprobado ? estilos.error : ''}
                    />
                    {errors.presupuesto_aprobado && <span className={estilos.errorMsg}>{errors.presupuesto_aprobado}</span>}
                </div>

                <div className={estilos.filaForm}>
                    <div className={estilos.grupo}>
                        <label>Fecha de Inicio *</label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            value={formData.fecha_inicio}
                            onChange={handleChange}
                            required
                            className={errors.fecha_inicio ? estilos.error : ''}
                        />
                        {errors.fecha_inicio && <span className={estilos.errorMsg}>{errors.fecha_inicio}</span>}
                    </div>
                    <div className={estilos.grupo}>
                        <label>Fecha de Fin Estimada *</label>
                        <input
                            type="date"
                            name="fecha_fin_estimada"
                            value={formData.fecha_fin_estimada}
                            onChange={handleChange}
                            required
                            className={errors.fecha_fin_estimada ? estilos.error : ''}
                        />
                        {errors.fecha_fin_estimada && <span className={estilos.errorMsg}>{errors.fecha_fin_estimada}</span>}
                    </div>
                </div>

                <div className={estilos.filaForm}>
                    <div className={estilos.grupo}>
                        <label>Cliente ID</label>
                        <input
                            type="text"
                            name="cliente_id"
                            value={formData.cliente_id}
                            onChange={handleChange}
                            placeholder="ID del cliente (opcional)"
                        />
                    </div>
                    <div className={estilos.grupo}>
                        <label>Responsable ID</label>
                        <input
                            type="text"
                            name="responsable_id"
                            value={formData.responsable_id}
                            onChange={handleChange}
                            placeholder="ID del responsable (opcional)"
                        />
                    </div>
                </div>

                <div className={estilos.grupo}>
                    <label>Descripción</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>

                <div className={estilos.modalFooter}>
                    <button type="button" onClick={() => router.back()} disabled={procesando}>
                        Cancelar
                    </button>
                    <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                        {procesando ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}


"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearConduceObra, obtenerObrasParaConduce } from '../servidor'
import estilos from '../conduces-obra.module.css'

export default function NuevoConduceObra() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        obra_id: '',
        receptor: '',
        chofer: '',
        vehiculo: '',
        placa: '',
        observaciones: ''
    })
    const [detalle, setDetalle] = useState([])
    const [obras, setObras] = useState([])
    const [errors, setErrors] = useState({})
    const [procesando, setProcesando] = useState(false)
    const [cargando, setCargando] = useState(true)

    const [nuevoItem, setNuevoItem] = useState({
        material_nombre: '',
        cantidad_despachada: '',
        unidad_medida: ''
    })

    useEffect(() => {
        cargarObras()
    }, [])

    async function cargarObras() {
        const res = await obtenerObrasParaConduce()
        if (res.success) {
            setObras(res.obras || [])
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

    const agregarItem = () => {
        if (!nuevoItem.material_nombre || !nuevoItem.cantidad_despachada) {
            alert('Complete el nombre del material y la cantidad')
            return
        }

        setDetalle([...detalle, {
            ...nuevoItem,
            cantidad_despachada: parseFloat(nuevoItem.cantidad_despachada)
        }])

        setNuevoItem({
            material_nombre: '',
            cantidad_despachada: '',
            unidad_medida: ''
        })
    }

    const eliminarItem = (index) => {
        setDetalle(detalle.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.obra_id) {
            alert('Debe seleccionar una obra')
            return
        }
        
        if (detalle.length === 0) {
            alert('Debe agregar al menos un material')
            return
        }

        setProcesando(true)
        try {
            const datos = {
                ...formData,
                obra_id: parseInt(formData.obra_id),
                detalle
            }
            
            const res = await crearConduceObra(datos)
            if (res.success) {
                alert('Conduce creado exitosamente')
                router.push('/admin/conduces-obra')
            } else {
                alert(res.mensaje || 'Error al crear conduce')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    if (cargando) {
        return <div className={estilos.cargando}>Cargando...</div>
    }

    return (
        <div className={estilos.contenedor}>
            <div className={estilos.header}>
                <h1 className={estilos.titulo}>Nuevo Conduce de Obra</h1>
                <button onClick={() => router.back()} className={estilos.btnVolver}>
                    ← Volver
                </button>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.grupo}>
                    <label className={estilos.label}>
                        Obra <span className={estilos.requerido}>*</span>
                    </label>
                    <select
                        name="obra_id"
                        value={formData.obra_id}
                        onChange={handleChange}
                        className={estilos.select}
                    >
                        <option value="">Seleccionar obra...</option>
                        {obras.map(obra => (
                            <option key={obra.id} value={obra.id}>
                                {obra.codigo_obra} - {obra.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={estilos.grid}>
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Receptor</label>
                        <input
                            type="text"
                            name="receptor"
                            value={formData.receptor}
                            onChange={handleChange}
                            className={estilos.input}
                            placeholder="Nombre de quien recibe"
                        />
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Chofer</label>
                        <input
                            type="text"
                            name="chofer"
                            value={formData.chofer}
                            onChange={handleChange}
                            className={estilos.input}
                            placeholder="Nombre del chofer"
                        />
                    </div>
                </div>

                <div className={estilos.grid}>
                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Vehículo</label>
                        <input
                            type="text"
                            name="vehiculo"
                            value={formData.vehiculo}
                            onChange={handleChange}
                            className={estilos.input}
                            placeholder="Tipo de vehículo"
                        />
                    </div>

                    <div className={estilos.grupo}>
                        <label className={estilos.label}>Placa</label>
                        <input
                            type="text"
                            name="placa"
                            value={formData.placa}
                            onChange={handleChange}
                            className={estilos.input}
                            placeholder="Número de placa"
                        />
                    </div>
                </div>

                {/* Detalle de Materiales */}
                <div className={estilos.seccion}>
                    <h2>Materiales a Despachar</h2>
                    
                    <div className={estilos.agregarItem}>
                        <input
                            type="text"
                            placeholder="Nombre del material"
                            value={nuevoItem.material_nombre}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, material_nombre: e.target.value }))}
                            className={estilos.input}
                        />
                        <input
                            type="text"
                            placeholder="Unidad (opcional)"
                            value={nuevoItem.unidad_medida}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, unidad_medida: e.target.value }))}
                            className={estilos.input}
                        />
                        <input
                            type="number"
                            placeholder="Cantidad"
                            value={nuevoItem.cantidad_despachada}
                            onChange={(e) => setNuevoItem(prev => ({ ...prev, cantidad_despachada: e.target.value }))}
                            className={estilos.input}
                            step="0.01"
                            min="0"
                        />
                        <button type="button" onClick={agregarItem} className={estilos.btnAgregar}>
                            Agregar
                        </button>
                    </div>

                    {detalle.length > 0 && (
                        <div className={estilos.tablaDetalle}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Unidad</th>
                                        <th>Cantidad</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalle.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.material_nombre}</td>
                                            <td>{item.unidad_medida || '-'}</td>
                                            <td>{item.cantidad_despachada}</td>
                                            <td>
                                                <button type="button" onClick={() => eliminarItem(index)}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className={estilos.grupo}>
                    <label className={estilos.label}>Observaciones</label>
                    <textarea
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        className={estilos.textarea}
                        rows="3"
                        placeholder="Observaciones adicionales..."
                    />
                </div>

                <div className={estilos.acciones}>
                    <button type="button" onClick={() => router.back()} className={estilos.btnCancelar}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={procesando} className={estilos.btnGuardar}>
                        {procesando ? 'Guardando...' : 'Guardar Conduce'}
                    </button>
                </div>
            </form>
        </div>
    )
}


"use client"
import { useState, useEffect } from 'react'
import { obtenerObraSimple, actualizarObraSimple, obtenerTrabajadoresDisponibles, obtenerTrabajadoresAsignados, actualizarAsignacionesTrabajadores, crearTrabajadorRapido } from '../servidor'
import estilos from './editar.module.css'

const COLORES_OBRA = [
    '#0284c7', '#0369a1', '#075985', '#0c4a6e',
    '#10b981', '#059669', '#047857', '#065f46',
    '#f59e0b', '#d97706', '#b45309', '#92400e',
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'
]

export default function Editar({ obraId, onVolver }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [trabajadores, setTrabajadores] = useState([])
    const [trabajadoresSeleccionados, setTrabajadoresSeleccionados] = useState([])
    const [mostrarFormTrabajador, setMostrarFormTrabajador] = useState(false)
    const [moneda, setMoneda] = useState('DOP RD$')
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        direccion: '',
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        presupuesto_total: '',
        fecha_inicio: '',
        fecha_fin_estimada: '',
        estado: 'activa',
        color_identificacion: '#0284c7',
        notas: ''
    })
    const [formTrabajador, setFormTrabajador] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        especialidad: '',
        salario_diario: ''
    })
    const [errores, setErrores] = useState({})

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
        cargarDatos()
    }, [obraId])

    async function cargarDatos() {
        setCargando(true)
        
        const [resObra, resTrabajadores, resAsignados] = await Promise.all([
            obtenerObraSimple(obraId),
            obtenerTrabajadoresDisponibles(),
            obtenerTrabajadoresAsignados(obraId)
        ])
        
        if (resObra.success) {
            const obra = resObra.obra
            setFormData({
                nombre: obra.nombre || '',
                descripcion: obra.descripcion || '',
                direccion: obra.direccion || '',
                cliente_nombre: obra.cliente_nombre || '',
                cliente_telefono: obra.cliente_telefono || '',
                cliente_email: obra.cliente_email || '',
                presupuesto_total: obra.presupuesto_total || '',
                fecha_inicio: obra.fecha_inicio || '',
                fecha_fin_estimada: obra.fecha_fin_estimada || '',
                estado: obra.estado || 'activa',
                color_identificacion: obra.color_identificacion || '#0284c7',
                notas: obra.notas || ''
            })
            
            if (resObra.moneda) {
                setMoneda(`${resObra.moneda.codigo} ${resObra.moneda.simbolo}`)
            }
        } else {
            alert('Error al cargar la obra')
            onVolver()
        }
        
        if (resTrabajadores.success) {
            setTrabajadores(resTrabajadores.trabajadores)
            if (resTrabajadores.moneda) {
                setMoneda(`${resTrabajadores.moneda.codigo} ${resTrabajadores.moneda.simbolo}`)
            }
        }
        
        if (resAsignados.success) {
            setTrabajadoresSeleccionados(resAsignados.trabajadorIds)
        }
        
        setCargando(false)
    }

    async function cargarTrabajadores() {
        const res = await obtenerTrabajadoresDisponibles()
        if (res.success) {
            setTrabajadores(res.trabajadores)
            if (res.moneda) {
                setMoneda(`${res.moneda.codigo} ${res.moneda.simbolo}`)
            }
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
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

    const validarFormulario = () => {
        const nuevosErrores = {}

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre de la obra es requerido'
        }

        if (formData.presupuesto_total && isNaN(formData.presupuesto_total)) {
            nuevosErrores.presupuesto_total = 'El presupuesto debe ser un numero valido'
        }

        if (formData.cliente_email && !formData.cliente_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            nuevosErrores.cliente_email = 'Email no valido'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setGuardando(true)
        
        const [resObra, resTrabajadores] = await Promise.all([
            actualizarObraSimple(obraId, formData),
            actualizarAsignacionesTrabajadores(obraId, trabajadoresSeleccionados)
        ])
        
        setGuardando(false)

        if (resObra.success) {
            alert('Obra actualizada exitosamente')
            onVolver()
        } else {
            alert(resObra.mensaje || 'Error al actualizar la obra')
        }
    }

    const toggleTrabajador = (trabajadorId) => {
        setTrabajadoresSeleccionados(prev => {
            if (prev.includes(trabajadorId)) {
                return prev.filter(id => id !== trabajadorId)
            } else {
                return [...prev, trabajadorId]
            }
        })
    }

    const handleCrearTrabajador = async (e) => {
        e.preventDefault()
        
        if (!formTrabajador.nombre.trim()) {
            alert('El nombre es requerido')
            return
        }

        const res = await crearTrabajadorRapido(formTrabajador)
        
        if (res.success) {
            await cargarTrabajadores()
            setTrabajadoresSeleccionados(prev => [...prev, res.id])
            setMostrarFormTrabajador(false)
            setFormTrabajador({
                nombre: '',
                apellido: '',
                cedula: '',
                telefono: '',
                especialidad: '',
                salario_diario: ''
            })
            alert('Trabajador agregado exitosamente')
        } else {
            alert(res.mensaje || 'Error al crear trabajador')
        }
    }

    if (cargando) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando obra...</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.btnVolver} onClick={onVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
                <h1 className={estilos.titulo}>
                    <ion-icon name="create-outline"></ion-icon>
                    Editar Obra
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        Informacion General
                    </h3>

                    <div className={estilos.campo}>
                        <label>Color de Identificacion</label>
                        <div className={estilos.coloresGrid}>
                            {COLORES_OBRA.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`${estilos.colorBtn} ${formData.color_identificacion === color ? estilos.colorActivo : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(prev => ({ ...prev, color_identificacion: color }))}
                                >
                                    {formData.color_identificacion === color && <ion-icon name="checkmark-outline"></ion-icon>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label>Nombre de la Obra <span className={estilos.requerido}>*</span></label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className={errores.nombre ? estilos.inputError : ''}
                            placeholder="Nombre descriptivo de la obra"
                        />
                        {errores.nombre && <span className={estilos.error}>{errores.nombre}</span>}
                    </div>

                    <div className={estilos.campo}>
                        <label>Descripcion</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Descripcion detallada..."
                            rows="3"
                        />
                    </div>

                    <div className={estilos.campo}>
                        <label>Direccion</label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Ubicacion de la obra"
                        />
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="person-outline"></ion-icon>
                        Informacion del Cliente
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Nombre del Cliente</label>
                            <input
                                type="text"
                                name="cliente_nombre"
                                value={formData.cliente_nombre}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>Telefono</label>
                            <input
                                type="tel"
                                name="cliente_telefono"
                                value={formData.cliente_telefono}
                                onChange={handleChange}
                                placeholder="809-123-4567"
                            />
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label>Email (Opcional)</label>
                        <input
                            type="email"
                            name="cliente_email"
                            value={formData.cliente_email}
                            onChange={handleChange}
                            className={errores.cliente_email ? estilos.inputError : ''}
                            placeholder="cliente@ejemplo.com"
                        />
                        {errores.cliente_email && <span className={estilos.error}>{errores.cliente_email}</span>}
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="calendar-outline"></ion-icon>
                        Fechas y Presupuesto
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Fecha de Inicio</label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={formData.fecha_inicio}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>Fecha Fin Estimada</label>
                            <input
                                type="date"
                                name="fecha_fin_estimada"
                                value={formData.fecha_fin_estimada}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Presupuesto Total</label>
                            <div className={estilos.inputGroup}>
                                <span className={estilos.inputPrefix}>{moneda}</span>
                                <input
                                    type="number"
                                    name="presupuesto_total"
                                    value={formData.presupuesto_total}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <label>Estado de la Obra</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                            >
                                <option value="activa">Activa</option>
                                <option value="pausada">Pausada</option>
                                <option value="finalizada">Finalizada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="people-outline"></ion-icon>
                            Asignar Trabajadores ({trabajadoresSeleccionados.length} seleccionados)
                        </h3>
                        <button 
                            type="button"
                            className={estilos.btnAgregarTrabajador}
                            onClick={() => setMostrarFormTrabajador(true)}
                        >
                            <ion-icon name="person-add-outline"></ion-icon>
                            Agregar Nuevo
                        </button>
                    </div>

                    {trabajadores.length === 0 ? (
                        <div className={estilos.sinTrabajadores}>
                            <ion-icon name="people-outline"></ion-icon>
                            <p>No hay trabajadores registrados</p>
                            <button 
                                type="button"
                                className={estilos.btnCrearPrimero}
                                onClick={() => setMostrarFormTrabajador(true)}
                            >
                                <ion-icon name="add-outline"></ion-icon>
                                Crear Primer Trabajador
                            </button>
                        </div>
                    ) : (
                        <div className={estilos.trabajadoresGrid}>
                            {trabajadores.map(trabajador => (
                                <div
                                    key={trabajador.id}
                                    className={`${estilos.trabajadorCard} ${trabajadoresSeleccionados.includes(trabajador.id) ? estilos.trabajadorSeleccionado : ''}`}
                                    onClick={() => toggleTrabajador(trabajador.id)}
                                >
                                    <div className={estilos.trabajadorCheck}>
                                        {trabajadoresSeleccionados.includes(trabajador.id) && (
                                            <ion-icon name="checkmark-circle"></ion-icon>
                                        )}
                                    </div>
                                    <div className={estilos.trabajadorInfo}>
                                        <span className={estilos.trabajadorNombre}>
                                            {trabajador.nombre} {trabajador.apellido}
                                        </span>
                                        {trabajador.especialidad && (
                                            <span className={estilos.trabajadorEspecialidad}>
                                                {trabajador.especialidad}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="document-text-outline"></ion-icon>
                        Notas Adicionales
                    </h3>

                    <div className={estilos.campo}>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            placeholder="Notas u observaciones..."
                            rows="4"
                        />
                    </div>
                </div>

                <div className={estilos.acciones}>
                    <button type="button" className={estilos.btnCancelar} onClick={onVolver} disabled={guardando}>
                        Cancelar
                    </button>
                    <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                        {guardando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="save-outline"></ion-icon>
                                Actualizar Obra
                            </>
                        )}
                    </button>
                </div>
            </form>

            {mostrarFormTrabajador && (
                <div className={estilos.modal} onClick={() => setMostrarFormTrabajador(false)}>
                    <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h3>Agregar Trabajador Rapido</h3>
                            <button 
                                type="button"
                                className={estilos.btnCerrar}
                                onClick={() => setMostrarFormTrabajador(false)}
                            >
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={handleCrearTrabajador} className={estilos.formModal}>
                            <div className={estilos.grid}>
                                <div className={estilos.campo}>
                                    <label>Nombre <span className={estilos.requerido}>*</span></label>
                                    <input
                                        type="text"
                                        value={formTrabajador.nombre}
                                        onChange={(e) => setFormTrabajador(prev => ({...prev, nombre: e.target.value}))}
                                        placeholder="Nombre"
                                        required
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>Apellido</label>
                                    <input
                                        type="text"
                                        value={formTrabajador.apellido}
                                        onChange={(e) => setFormTrabajador(prev => ({...prev, apellido: e.target.value}))}
                                        placeholder="Apellido"
                                    />
                                </div>
                            </div>

                            <div className={estilos.grid}>
                                <div className={estilos.campo}>
                                    <label>Cedula</label>
                                    <input
                                        type="text"
                                        value={formTrabajador.cedula}
                                        onChange={(e) => setFormTrabajador(prev => ({...prev, cedula: e.target.value}))}
                                        placeholder="000-0000000-0"
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>Telefono</label>
                                    <input
                                        type="tel"
                                        value={formTrabajador.telefono}
                                        onChange={(e) => setFormTrabajador(prev => ({...prev, telefono: e.target.value}))}
                                        placeholder="809-123-4567"
                                    />
                                </div>
                            </div>

                            <div className={estilos.grid}>
                                <div className={estilos.campo}>
                                    <label>Especialidad</label>
                                    <input
                                        type="text"
                                        value={formTrabajador.especialidad}
                                        onChange={(e) => setFormTrabajador(prev => ({...prev, especialidad: e.target.value}))}
                                        placeholder="Albanil, Plomero, etc"
                                    />
                                </div>

                                <div className={estilos.campo}>
                                    <label>Salario Diario</label>
                                    <div className={estilos.inputGroup}>
                                        <span className={estilos.inputPrefix}>{moneda}</span>
                                        <input
                                            type="number"
                                            value={formTrabajador.salario_diario}
                                            onChange={(e) => setFormTrabajador(prev => ({...prev, salario_diario: e.target.value}))}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.modalAcciones}>
                                <button 
                                    type="button" 
                                    className={estilos.btnCancelar}
                                    onClick={() => setMostrarFormTrabajador(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className={estilos.btnGuardar}>
                                    <ion-icon name="person-add-outline"></ion-icon>
                                    Agregar Trabajador
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
"use client"
import { useState, useEffect } from 'react'
import { obtenerObraSimple, actualizarObraSimple, obtenerTrabajadoresDisponibles, obtenerTrabajadoresAsignados, actualizarAsignacionesTrabajadores, crearTrabajadorRapido } from '../servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './editar.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

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
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

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
            alert(tr('Error al cargar la obra', 'Error loading project'))
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
            nuevosErrores.nombre = tr('El nombre de la obra es requerido', 'Project name is required')
        }

        if (formData.presupuesto_total && isNaN(formData.presupuesto_total)) {
            nuevosErrores.presupuesto_total = tr('El presupuesto debe ser un numero valido', 'Budget must be a valid number')
        }

        if (formData.cliente_email && !formData.cliente_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            nuevosErrores.cliente_email = tr('Email no valido', 'Invalid email')
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
            alert(tr('Obra actualizada exitosamente', 'Project updated successfully'))
            onVolver()
        } else {
            alert(resObra.mensaje || tr('Error al actualizar la obra', 'Error updating project'))
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
            alert(tr('El nombre es requerido', 'Name is required'))
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
            alert(tr('Trabajador agregado exitosamente', 'Worker added successfully'))
        } else {
            alert(res.mensaje || tr('Error al crear trabajador', 'Error creating worker'))
        }
    }

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.btnVolver} onClick={onVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    {tr('Volver', 'Back')}
                </button>
                <h1 className={estilos.titulo}>
                    <ion-icon name="create-outline"></ion-icon>
                    {tr('Editar Obra', 'Edit Project')}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="information-circle-outline"></ion-icon>
                        {tr('Informacion General', 'General Information')}
                    </h3>

                    <div className={estilos.campo}>
                        <label>{tr('Color de Identificacion', 'Identification Color')}</label>
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
                        <label>{tr('Nombre de la Obra', 'Project Name')} <span className={estilos.requerido}>*</span></label>
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
                        <label>{tr('Descripcion', 'Description')}</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder={tr('Descripcion detallada...', 'Detailed description...')}
                            rows="3"
                        />
                    </div>

                    <div className={estilos.campo}>
                        <label>{tr('Direccion', 'Address')}</label>
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
                        {tr('Informacion del Cliente', 'Client Information')}
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Nombre del Cliente', 'Client Name')}</label>
                            <input
                                type="text"
                                name="cliente_nombre"
                                value={formData.cliente_nombre}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Telefono', 'Phone')}</label>
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
                        <label>{tr('Email (Opcional)', 'Email (Optional)')}</label>
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
                        {tr('Fechas y Presupuesto', 'Dates and Budget')}
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Fecha de Inicio', 'Start Date')}</label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={formData.fecha_inicio}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Fecha Fin Estimada', 'Estimated End Date')}</label>
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
                            <label>{tr('Presupuesto Total', 'Total Budget')}</label>
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
                            <label>{tr('Estado de la Obra', 'Project Status')}</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                            >
                                <option value="activa">{tr('Activa', 'Active')}</option>
                                <option value="pausada">{tr('Pausada', 'Paused')}</option>
                                <option value="finalizada">{tr('Finalizada', 'Finished')}</option>
                                <option value="cancelada">{tr('Cancelada', 'Cancelled')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <div className={estilos.seccionHeader}>
                        <h3 className={estilos.seccionTitulo}>
                            <ion-icon name="people-outline"></ion-icon>
                            {tr('Asignar Trabajadores', 'Assign Workers')} ({trabajadoresSeleccionados.length} {tr('seleccionados', 'selected')})
                        </h3>
                        <button 
                            type="button"
                            className={estilos.btnAgregarTrabajador}
                            onClick={() => setMostrarFormTrabajador(true)}
                        >
                            <ion-icon name="person-add-outline"></ion-icon>
                            {tr('Agregar Nuevo', 'Add New')}
                        </button>
                    </div>

                    {trabajadores.length === 0 ? (
                        <div className={estilos.sinTrabajadores}>
                            <ion-icon name="people-outline"></ion-icon>
                            <p>{tr('No hay trabajadores registrados', 'No workers registered')}</p>
                            <button 
                                type="button"
                                className={estilos.btnCrearPrimero}
                                onClick={() => setMostrarFormTrabajador(true)}
                            >
                                <ion-icon name="add-outline"></ion-icon>
                                {tr('Crear Primer Trabajador', 'Create First Worker')}
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
                        {tr('Notas Adicionales', 'Additional Notes')}
                    </h3>

                    <div className={estilos.campo}>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            placeholder={tr('Notas u observaciones...', 'Notes or observations...')}
                            rows="4"
                        />
                    </div>
                </div>

                <div className={estilos.acciones}>
                    <button type="button" className={estilos.btnCancelar} onClick={onVolver} disabled={guardando}>
                        {tr('Cancelar', 'Cancel')}
                    </button>
                    <button type="submit" className={estilos.btnGuardar} disabled={guardando}>
                        {guardando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                {tr('Guardando...', 'Saving...')}
                            </>
                        ) : (
                            <>
                                <ion-icon name="save-outline"></ion-icon>
                                {tr('Actualizar Obra', 'Update Project')}
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
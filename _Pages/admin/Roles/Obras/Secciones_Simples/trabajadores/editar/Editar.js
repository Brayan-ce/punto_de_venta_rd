"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadorSimple, actualizarTrabajadorSimple } from '../servidor'
import estilos from './editar.module.css'
import { useLanguage } from '@/_Pages/admin/i18n'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Editar({ trabajadorId, onVolver, moneda }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        telefono: '',
        especialidad: '',
        salario_diario: '',
        tipo_pago: 'diario',
        direccion: '',
        contacto_emergencia: '',
        telefono_emergencia: '',
        fecha_ingreso: '',
        notas: '',
        activo: true
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
        cargarTrabajador()
    }, [trabajadorId])

    async function cargarTrabajador() {
        setCargando(true)
        const res = await obtenerTrabajadorSimple(trabajadorId)
        if (res.success) {
            const t = res.trabajador
            setFormData({
                nombre: t.nombre || '',
                apellido: t.apellido || '',
                cedula: t.cedula || '',
                telefono: t.telefono || '',
                especialidad: t.especialidad || '',
                salario_diario: t.salario_diario || '',
                tipo_pago: t.tipo_pago || 'diario',
                direccion: t.direccion || '',
                contacto_emergencia: t.contacto_emergencia || '',
                telefono_emergencia: t.telefono_emergencia || '',
                fecha_ingreso: t.fecha_ingreso || '',
                notas: t.notas || '',
                activo: t.activo !== undefined ? t.activo : true
            })
        } else {
            alert(tr('Error al cargar el trabajador', 'Error loading worker'))
            onVolver()
        }
        setCargando(false)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            nuevosErrores.nombre = tr('El nombre es requerido', 'Name is required')
        }

        if (formData.cedula && formData.cedula.length > 0 && formData.cedula.length < 11) {
            nuevosErrores.cedula = tr('La cedula debe tener 11 digitos', 'ID must have 11 digits')
        }

        if (formData.salario_diario && isNaN(formData.salario_diario)) {
            nuevosErrores.salario_diario = tr('El salario debe ser un numero valido', 'Salary must be a valid number')
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
        const res = await actualizarTrabajadorSimple(trabajadorId, formData)
        setGuardando(false)

        if (res.success) {
            alert(tr('Trabajador actualizado exitosamente', 'Worker updated successfully'))
            onVolver()
        } else {
            alert(res.mensaje || tr('Error al actualizar el trabajador', 'Error updating worker'))
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
                    {tr('Editar Trabajador', 'Edit Worker')}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="person-outline"></ion-icon>
                        {tr('Informacion Personal', 'Personal Information')}
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Nombre', 'Name')} <span className={estilos.requerido}>*</span></label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={errores.nombre ? estilos.inputError : ''}
                                placeholder={tr('Nombre', 'Name')}
                            />
                            {errores.nombre && <span className={estilos.error}>{errores.nombre}</span>}
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Apellido', 'Last Name')}</label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder={tr('Apellido', 'Last Name')}
                            />
                        </div>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Cedula', 'ID')}</label>
                            <input
                                type="text"
                                name="cedula"
                                value={formData.cedula}
                                onChange={handleChange}
                                className={errores.cedula ? estilos.inputError : ''}
                                placeholder="000-0000000-0"
                                maxLength="13"
                            />
                            {errores.cedula && <span className={estilos.error}>{errores.cedula}</span>}
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Telefono', 'Phone')}</label>
                            <input
                                type="tel"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="809-123-4567"
                            />
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label>Direccion</label>
                        <input
                            type="text"
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder={tr('Direccion completa', 'Full address')}
                        />
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="construct-outline"></ion-icon>
                        {tr('Informacion Laboral', 'Work Information')}
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Especialidad', 'Specialty')}</label>
                            <select
                                name="especialidad"
                                value={formData.especialidad}
                                onChange={handleChange}
                            >
                                <option value="">{tr('Seleccionar especialidad', 'Select specialty')}</option>
                                <option value="Albañil">Albañil</option>
                                <option value="Plomero">Plomero</option>
                                <option value="Electricista">Electricista</option>
                                <option value="Pintor">Pintor</option>
                                <option value="Carpintero">Carpintero</option>
                                <option value="Ayudante">Ayudante</option>
                                <option value="Maestro de Obra">Maestro de Obra</option>
                                <option value="Herrero">Herrero</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Fecha de Ingreso', 'Start Date')}</label>
                            <input
                                type="date"
                                name="fecha_ingreso"
                                value={formData.fecha_ingreso}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Salario Diario', 'Daily Salary')}</label>
                            <div className={estilos.inputGroup}>
                                <span className={estilos.inputPrefix}>{moneda}</span>
                                <input
                                    type="number"
                                    name="salario_diario"
                                    value={formData.salario_diario}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Tipo de Pago', 'Payment Type')}</label>
                            <select
                                name="tipo_pago"
                                value={formData.tipo_pago}
                                onChange={handleChange}
                            >
                                <option value="diario">{tr('Diario', 'Daily')}</option>
                                <option value="semanal">{tr('Semanal', 'Weekly')}</option>
                                <option value="quincenal">{tr('Quincenal', 'Biweekly')}</option>
                                <option value="mensual">{tr('Mensual', 'Monthly')}</option>
                            </select>
                        </div>
                    </div>

                    <div className={estilos.campo}>
                        <label className={estilos.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                                className={estilos.checkbox}
                            />
                            <span>{tr('Trabajador Activo', 'Active Worker')}</span>
                        </label>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="call-outline"></ion-icon>
                        {tr('Contacto de Emergencia', 'Emergency Contact')}
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>{tr('Nombre del Contacto', 'Contact Name')}</label>
                            <input
                                type="text"
                                name="contacto_emergencia"
                                value={formData.contacto_emergencia}
                                onChange={handleChange}
                                placeholder={tr('Nombre completo', 'Full name')}
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>{tr('Telefono de Emergencia', 'Emergency Phone')}</label>
                            <input
                                type="tel"
                                name="telefono_emergencia"
                                value={formData.telefono_emergencia}
                                onChange={handleChange}
                                placeholder="809-123-4567"
                            />
                        </div>
                    </div>
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
                            placeholder={tr('Observaciones, habilidades especiales, etc...', 'Observations, special skills, etc...')}
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
                                {tr('Actualizar Trabajador', 'Update Worker')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
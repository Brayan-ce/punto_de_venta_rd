"use client"
import { useState, useEffect } from 'react'
import { crearTrabajadorSimple } from '../servidor'
import estilos from './nuevo.module.css'

export default function Nuevo({ onVolver }) {
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [formData, setFormData] = useState({
        codigo_trabajador: '',
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
        notas: ''
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
        generarCodigoAutomatico()
    }, [formData.nombre, formData.apellido])

    const generarCodigoAutomatico = () => {
        if (!formData.nombre) return

        const inicialNombre = formData.nombre.charAt(0).toUpperCase()
        const inicialApellido = formData.apellido ? formData.apellido.charAt(0).toUpperCase() : ''
        const timestamp = Date.now().toString().slice(-4)
        
        const codigo = `T-${inicialNombre}${inicialApellido}${timestamp}`
        
        setFormData(prev => ({
            ...prev,
            codigo_trabajador: codigo
        }))
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
            nuevosErrores.nombre = 'El nombre es requerido'
        }

        if (formData.cedula && formData.cedula.length > 0 && formData.cedula.length < 11) {
            nuevosErrores.cedula = 'La cedula debe tener 11 digitos'
        }

        if (formData.salario_diario && isNaN(formData.salario_diario)) {
            nuevosErrores.salario_diario = 'El salario debe ser un numero valido'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setCargando(true)
        const res = await crearTrabajadorSimple(formData)
        setCargando(false)

        if (res.success) {
            alert('Trabajador creado exitosamente')
            onVolver()
        } else {
            alert(res.mensaje || 'Error al crear el trabajador')
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <button className={estilos.btnVolver} onClick={onVolver}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver
                </button>
                <h1 className={estilos.titulo}>
                    <ion-icon name="person-add-outline"></ion-icon>
                    Nuevo Trabajador
                </h1>
            </div>

            <form onSubmit={handleSubmit} className={estilos.formulario}>
                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="person-outline"></ion-icon>
                        Informacion Personal
                    </h3>

                    <div className={estilos.campo}>
                        <label>Codigo de Trabajador (Automatico)</label>
                        <input
                            type="text"
                            name="codigo_trabajador"
                            value={formData.codigo_trabajador}
                            readOnly
                            disabled
                            className={estilos.inputDisabled}
                            placeholder="Se genera automatico"
                        />
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Nombre <span className={estilos.requerido}>*</span></label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={errores.nombre ? estilos.inputError : ''}
                                placeholder="Nombre"
                            />
                            {errores.nombre && <span className={estilos.error}>{errores.nombre}</span>}
                        </div>

                        <div className={estilos.campo}>
                            <label>Apellido</label>
                            <input
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                placeholder="Apellido"
                            />
                        </div>
                    </div>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Cedula</label>
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
                            <label>Telefono</label>
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
                            placeholder="Direccion completa"
                        />
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="construct-outline"></ion-icon>
                        Informacion Laboral
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Especialidad</label>
                            <select
                                name="especialidad"
                                value={formData.especialidad}
                                onChange={handleChange}
                            >
                                <option value="">Seleccionar especialidad</option>
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
                            <label>Fecha de Ingreso</label>
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
                            <label>Salario Diario</label>
                            <div className={estilos.inputGroup}>
                                <span className={estilos.inputPrefix}>RD$</span>
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
                            <label>Tipo de Pago</label>
                            <select
                                name="tipo_pago"
                                value={formData.tipo_pago}
                                onChange={handleChange}
                            >
                                <option value="diario">Diario</option>
                                <option value="semanal">Semanal</option>
                                <option value="quincenal">Quincenal</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={estilos.seccion}>
                    <h3 className={estilos.seccionTitulo}>
                        <ion-icon name="call-outline"></ion-icon>
                        Contacto de Emergencia
                    </h3>

                    <div className={estilos.grid}>
                        <div className={estilos.campo}>
                            <label>Nombre del Contacto</label>
                            <input
                                type="text"
                                name="contacto_emergencia"
                                value={formData.contacto_emergencia}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                        </div>

                        <div className={estilos.campo}>
                            <label>Telefono de Emergencia</label>
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
                        Notas Adicionales
                    </h3>

                    <div className={estilos.campo}>
                        <textarea
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            placeholder="Observaciones, habilidades especiales, etc..."
                            rows="4"
                        />
                    </div>
                </div>

                <div className={estilos.acciones}>
                    <button type="button" className={estilos.btnCancelar} onClick={onVolver} disabled={cargando}>
                        Cancelar
                    </button>
                    <button type="submit" className={estilos.btnGuardar} disabled={cargando}>
                        {cargando ? (
                            <>
                                <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <ion-icon name="save-outline"></ion-icon>
                                Crear Trabajador
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
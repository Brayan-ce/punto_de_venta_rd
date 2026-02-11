"use client"
import { useState } from 'react'
import { crearProveedor } from '../../../proveedores/servidor'
import estilos from './ModalCrearProveedor.module.css'

export default function ModalCrearProveedor({
    isOpen,
    onClose,
    onProveedorCreado,
    tema = 'light'
}) {
    const [formData, setFormData] = useState({
        rnc: '',
        razon_social: '',
        nombre_comercial: '',
        telefono: '',
        email: ''
    })
    const [errors, setErrors] = useState({})
    const [procesando, setProcesando] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Limpiar error del campo al escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const validarFormulario = () => {
        const nuevosErrores = {}

        if (!formData.rnc.trim()) {
            nuevosErrores.rnc = 'El RNC es obligatorio'
        } else if (formData.rnc.trim().length < 9) {
            nuevosErrores.rnc = 'El RNC debe tener al menos 9 caracteres'
        }

        if (!formData.razon_social.trim()) {
            nuevosErrores.razon_social = 'La razón social es obligatoria'
        }

        if (!formData.nombre_comercial.trim()) {
            nuevosErrores.nombre_comercial = 'El nombre comercial es obligatorio'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nuevosErrores.email = 'El email no es válido'
        }

        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!validarFormulario()) {
            return
        }

        setProcesando(true)
        try {
            const datosProveedor = {
                rnc: formData.rnc.trim(),
                razon_social: formData.razon_social.trim(),
                nombre_comercial: formData.nombre_comercial.trim(),
                telefono: formData.telefono.trim() || null,
                email: formData.email.trim() || null,
                activo: true
            }

            console.log('Creando proveedor con datos:', datosProveedor)
            const resultado = await crearProveedor(datosProveedor)
            console.log('Resultado de crear proveedor:', resultado)

            if (resultado.success) {
                // Llamar callback con el nuevo proveedor
                const nuevoProveedor = {
                    id: resultado.proveedorId,
                    rnc: formData.rnc.trim(),
                    razon_social: formData.razon_social.trim(),
                    nombre_comercial: formData.nombre_comercial.trim(),
                    telefono: formData.telefono.trim() || null,
                    email: formData.email.trim() || null
                }
                console.log('Proveedor creado exitosamente:', nuevoProveedor)
                
                // Resetear formulario
                setFormData({
                    rnc: '',
                    razon_social: '',
                    nombre_comercial: '',
                    telefono: '',
                    email: ''
                })
                setErrors({})
                
                // Llamar callback antes de cerrar
                if (onProveedorCreado) {
                    onProveedorCreado(nuevoProveedor)
                }
                onClose()
            } else {
                console.error('Error al crear proveedor:', resultado.mensaje)
                alert(resultado.mensaje || 'Error al crear el proveedor')
            }
        } catch (error) {
            console.error('Error al crear proveedor:', error)
            alert('Error al procesar la solicitud: ' + (error.message || 'Error desconocido'))
        } finally {
            setProcesando(false)
        }
    }

    const handleCancelar = () => {
        setFormData({
            rnc: '',
            razon_social: '',
            nombre_comercial: '',
            telefono: '',
            email: ''
        })
        setErrors({})
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className={estilos.overlay} onClick={handleCancelar}>
            <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                <div className={estilos.header}>
                    <h2>
                        <ion-icon name="business-outline"></ion-icon>
                        Crear Proveedor
                    </h2>
                    <button type="button" className={estilos.btnCerrar} onClick={handleCancelar}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className={estilos.formulario}>
                    <div className={estilos.body}>
                        <p className={estilos.descripcion}>
                            Completa los datos básicos del proveedor. Los campos marcados con * son obligatorios.
                        </p>

                        <div className={estilos.grid}>
                            <div className={estilos.grupo}>
                                <label className={estilos.label}>
                                    RNC <span className={estilos.requerido}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="rnc"
                                    value={formData.rnc}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${errors.rnc ? estilos.inputError : ''}`}
                                    placeholder="000000000"
                                    maxLength="11"
                                    disabled={procesando}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSubmit(e)
                                        }
                                    }}
                                />
                                {errors.rnc && (
                                    <span className={estilos.errorMsg}>{errors.rnc}</span>
                                )}
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>
                                    Nombre Comercial <span className={estilos.requerido}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre_comercial"
                                    value={formData.nombre_comercial}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${errors.nombre_comercial ? estilos.inputError : ''}`}
                                    placeholder="Ej: Distribuidora XYZ"
                                    disabled={procesando}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSubmit(e)
                                        }
                                    }}
                                />
                                {errors.nombre_comercial && (
                                    <span className={estilos.errorMsg}>{errors.nombre_comercial}</span>
                                )}
                            </div>
                        </div>

                        <div className={estilos.grupo}>
                            <label className={estilos.label}>
                                Razón Social <span className={estilos.requerido}>*</span>
                            </label>
                            <input
                                type="text"
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={handleChange}
                                className={`${estilos.input} ${errors.razon_social ? estilos.inputError : ''}`}
                                placeholder="Ej: Distribuidora XYZ SRL"
                                disabled={procesando}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSubmit(e)
                                    }
                                }}
                            />
                            {errors.razon_social && (
                                <span className={estilos.errorMsg}>{errors.razon_social}</span>
                            )}
                        </div>

                        <div className={estilos.grid}>
                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className={estilos.input}
                                    placeholder="Ej: 809-555-1234"
                                    disabled={procesando}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSubmit(e)
                                        }
                                    }}
                                />
                            </div>

                            <div className={estilos.grupo}>
                                <label className={estilos.label}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`${estilos.input} ${errors.email ? estilos.inputError : ''}`}
                                    placeholder="Ej: contacto@proveedor.com"
                                    disabled={procesando}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleSubmit(e)
                                        }
                                    }}
                                />
                                {errors.email && (
                                    <span className={estilos.errorMsg}>{errors.email}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={estilos.footer}>
                        <button
                            type="button"
                            className={estilos.btnCancelar}
                            onClick={handleCancelar}
                            disabled={procesando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className={estilos.btnGuardar}
                            onClick={handleSubmit}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <ion-icon name="checkmark-outline"></ion-icon>
                                    Crear Proveedor
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarUsuario } from './servidor'
import estilos from './registro.module.css'

export default function Registro() {
    const router = useRouter()
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        cedula: '',
        email: '',
        telefono: '',
        password: '',
        confirmarPassword: '',
        nombreEmpresa: '',
        rnc: '',
        razonSocial: '',
        aceptoTerminos: false // ✅ NUEVO CAMPO
    })

    const [mostrarPassword, setMostrarPassword] = useState(false)
    const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

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

    const manejarCambio = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmarPassword) {
            setError('Las contrasenas no coinciden')
            return
        }

        if (formData.password.length < 6) {
            setError('La contrasena debe tener al menos 6 caracteres')
            return
        }

        // ✅ VALIDACIÓN DE TÉRMINOS
        if (!formData.aceptoTerminos) {
            setError('Debe aceptar los Terminos y Condiciones para continuar')
            return
        }

        setCargando(true)

        try {
            const resultado = await registrarUsuario(formData)

            if (resultado.success) {
                setExito(true)

                setTimeout(() => {
                    if (resultado.whatsappUrl) {
                        window.open(resultado.whatsappUrl, '_blank')
                    }
                    router.push('/login')
                }, 2000)
            } else {
                setError(resultado.mensaje || 'Error al registrar usuario')
            }
        } catch (error) {
            setError('Error al procesar la solicitud')
            console.error('Error en registro:', error)
        } finally {
            setCargando(false)
        }
    }

    if (exito) {
        return (
            <div className={`${estilos.contenedor} ${estilos[tema]}`}>
                <div className={`${estilos.caja} ${estilos[tema]}`}>
                    <div className={estilos.exitoIcono}>
                        <ion-icon name="checkmark-circle"></ion-icon>
                    </div>
                    <h2 className={estilos.exitoTitulo}>Registro Exitoso</h2>
                    <p className={estilos.exitoTexto}>
                        Tu solicitud ha sido enviada. El administrador revisara tu informacion y te notificara por WhatsApp cuando tu cuenta sea activada.
                    </p>
                    <p className={estilos.exitoRedireccion}>
                        Seras redirigido al login en unos segundos...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.caja} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>Crear Cuenta</h1>
                    <p className={estilos.subtitulo}>Registra tu empresa en IziWeek</p>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>Informacion Personal</h3>

                        <div className={estilos.campo}>
                            <label htmlFor="nombre" className={estilos.label}>
                                Nombre Completo
                            </label>
                            <div className={estilos.inputWrapper}>
                                <ion-icon name="person-outline"></ion-icon>
                                <input
                                    type="text"
                                    id="nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={manejarCambio}
                                    placeholder="Juan Perez"
                                    className={estilos.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={estilos.fila}>
                            <div className={estilos.campo}>
                                <label htmlFor="cedula" className={estilos.label}>
                                    Cedula
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="card-outline"></ion-icon>
                                    <input
                                        type="text"
                                        id="cedula"
                                        name="cedula"
                                        value={formData.cedula}
                                        onChange={manejarCambio}
                                        placeholder="000-0000000-0"
                                        className={estilos.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label htmlFor="telefono" className={estilos.label}>
                                    Telefono
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="call-outline"></ion-icon>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={manejarCambio}
                                        placeholder="809-000-0000"
                                        className={estilos.input}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={estilos.campo}>
                            <label htmlFor="email" className={estilos.label}>
                                Correo Electronico
                            </label>
                            <div className={estilos.inputWrapper}>
                                <ion-icon name="mail-outline"></ion-icon>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={manejarCambio}
                                    placeholder="tu@email.com"
                                    className={estilos.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={estilos.fila}>
                            <div className={estilos.campo}>
                                <label htmlFor="password" className={estilos.label}>
                                    Contrasena
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <input
                                        type={mostrarPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={manejarCambio}
                                        placeholder="Minimo 6 caracteres"
                                        className={estilos.input}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className={estilos.togglePassword}
                                    >
                                        <ion-icon name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                                    </button>
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label htmlFor="confirmarPassword" className={estilos.label}>
                                    Confirmar
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <input
                                        type={mostrarConfirmar ? 'text' : 'password'}
                                        id="confirmarPassword"
                                        name="confirmarPassword"
                                        value={formData.confirmarPassword}
                                        onChange={manejarCambio}
                                        placeholder="Confirma tu contrasena"
                                        className={estilos.input}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                                        className={estilos.togglePassword}
                                    >
                                        <ion-icon name={mostrarConfirmar ? 'eye-off-outline' : 'eye-outline'}></ion-icon>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>Informacion de la Empresa</h3>

                        <div className={estilos.campo}>
                            <label htmlFor="nombreEmpresa" className={estilos.label}>
                                Nombre de la Empresa
                            </label>
                            <div className={estilos.inputWrapper}>
                                <ion-icon name="business-outline"></ion-icon>
                                <input
                                    type="text"
                                    id="nombreEmpresa"
                                    name="nombreEmpresa"
                                    value={formData.nombreEmpresa}
                                    onChange={manejarCambio}
                                    placeholder="Mi Empresa SRL"
                                    className={estilos.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={estilos.fila}>
                            <div className={estilos.campo}>
                                <label htmlFor="rnc" className={estilos.label}>
                                    RNC
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                    <input
                                        type="text"
                                        id="rnc"
                                        name="rnc"
                                        value={formData.rnc}
                                        onChange={manejarCambio}
                                        placeholder="000-00000-0"
                                        className={estilos.input}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label htmlFor="razonSocial" className={estilos.label}>
                                    Razon Social
                                </label>
                                <div className={estilos.inputWrapper}>
                                    <ion-icon name="briefcase-outline"></ion-icon>
                                    <input
                                        type="text"
                                        id="razonSocial"
                                        name="razonSocial"
                                        value={formData.razonSocial}
                                        onChange={manejarCambio}
                                        placeholder="MI EMPRESA SRL"
                                        className={estilos.input}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ SECCIÓN DE TÉRMINOS Y CONDICIONES */}
                    <div className={estilos.seccionTerminos}>
                        <label className={estilos.checkboxTerminos}>
                            <input
                                type="checkbox"
                                name="aceptoTerminos"
                                checked={formData.aceptoTerminos}
                                onChange={manejarCambio}
                                className={estilos.checkboxInput}
                                required
                            />
                            <span className={estilos.checkboxTexto}>
                                He leído y acepto los{' '}
                                <Link
                                    href="/terminos"
                                    target="_blank"
                                    className={estilos.enlaceTerminos}
                                >
                                    Términos y Condiciones
                                </Link>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={estilos.botonSubmit}
                    >
                        {cargando ? (
                            <>
                                <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                                <span>Enviando solicitud...</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>Registrarme</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={estilos.footer}>
                    <p className={estilos.textoLogin}>
                        Ya tienes una cuenta?{' '}
                        <Link href="/login" className={estilos.enlaceLogin}>
                            Inicia sesion aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarUsuario } from './servidor'
import { useLanguage } from '../i18n'
import estilos from './registro.module.css'

export default function Registro() {
    const router = useRouter()
    const { t } = useLanguage()
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
            setError(t('registro.passMismatch'))
            return
        }

        if (formData.password.length < 6) {
            setError(t('registro.passMin'))
            return
        }

        // ✅ VALIDACIÓN DE TÉRMINOS
        if (!formData.aceptoTerminos) {
            setError(t('registro.mustAccept'))
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
            setError(t('registro.genericError'))
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
                    <h2 className={estilos.exitoTitulo}>{t('registro.successTitle')}</h2>
                    <p className={estilos.exitoTexto}>
                        {t('registro.successText')}
                    </p>
                    <p className={estilos.exitoRedireccion}>
                        {t('registro.successRedirect')}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.caja} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>{t('registro.title')}</h1>
                    <p className={estilos.subtitulo}>{t('registro.subtitle')}</p>
                </div>

                <form onSubmit={manejarSubmit} className={estilos.formulario}>
                    {error && (
                        <div className={estilos.error}>
                            <ion-icon name="alert-circle-outline"></ion-icon>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={estilos.seccion}>
                        <h3 className={estilos.seccionTitulo}>{t('registro.personalInfo')}</h3>

                        <div className={estilos.campo}>
                            <label htmlFor="nombre" className={estilos.label}>
                                {t('registro.fullName')}
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
                                    {t('registro.idCard')}
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
                                    {t('registro.phone')}
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
                                {t('registro.email')}
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
                                    {t('registro.password')}
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
                                    {t('registro.confirm')}
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
                        <h3 className={estilos.seccionTitulo}>{t('registro.businessInfo')}</h3>

                        <div className={estilos.campo}>
                            <label htmlFor="nombreEmpresa" className={estilos.label}>
                                {t('registro.companyName')}
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
                                    {t('registro.rnc')}
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
                                    {t('registro.legalName')}
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
                                {t('registro.termsAccept')}{' '}
                                <Link
                                    href="/terminos"
                                    target="_blank"
                                    className={estilos.enlaceTerminos}
                                >
                                    {t('registro.termsLink')}
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
                                <span>{t('registro.sending')}</span>
                            </>
                        ) : (
                            <>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>{t('registro.submit')}</span>
                            </>
                        )}
                    </button>
                </form>

                <div className={estilos.footer}>
                    <p className={estilos.textoLogin}>
                        {t('registro.haveAccount')}{' '}
                        <Link href="/login" className={estilos.enlaceLogin}>
                            {t('registro.loginHere')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
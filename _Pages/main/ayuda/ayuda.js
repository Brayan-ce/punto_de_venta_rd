"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { obtenerWhatsappSoporte } from './servidor'
import estilos from './ayuda.module.css'

export default function Ayuda() {
    const [tema, setTema] = useState('light')
    const [whatsappUrl, setWhatsappUrl] = useState(null)
    const [seccionActiva, setSeccionActiva] = useState('inicio')

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
        const cargarWhatsapp = async () => {
            const resultado = await obtenerWhatsappSoporte()
            if (resultado.success && resultado.whatsappUrl) {
                setWhatsappUrl(resultado.whatsappUrl)
            }
        }
        cargarWhatsapp()
    }, [])

    const abrirWhatsapp = () => {
        if (whatsappUrl) {
            window.open(whatsappUrl, '_blank')
        }
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.contenido} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>Centro de Ayuda</h1>
                    <p className={estilos.subtitulo}>
                        Encuentra toda la informacion que necesitas para usar IziWeek
                    </p>
                </div>

                <div className={estilos.layout}>
                    <aside className={`${estilos.sidebar} ${estilos[tema]}`}>
                        <nav className={estilos.menu}>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'inicio' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('inicio')}
                            >
                                <ion-icon name="home-outline"></ion-icon>
                                <span>Inicio</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'registro' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('registro')}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                <span>Registro</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'login' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('login')}
                            >
                                <ion-icon name="log-in-outline"></ion-icon>
                                <span>Iniciar Sesion</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'recuperar' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('recuperar')}
                            >
                                <ion-icon name="lock-closed-outline"></ion-icon>
                                <span>Recuperar Contrasena</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'contacto' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('contacto')}
                            >
                                <ion-icon name="chatbubble-outline"></ion-icon>
                                <span>Contacto</span>
                            </button>
                        </nav>
                    </aside>

                    <main className={`${estilos.principal} ${estilos[tema]}`}>
                        {seccionActiva === 'inicio' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="home-outline"></ion-icon>
                                    <h2>Bienvenido a IziWeek</h2>
                                </div>
                                <p className={estilos.texto}>
                                    IziWeek es tu sistema de punto de venta completo para gestionar tu negocio de manera facil y eficiente.
                                </p>
                                <div className={estilos.caracteristicas}>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Gestion de ventas y productos</span>
                                    </div>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Control de inventario en tiempo real</span>
                                    </div>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Registro de clientes y proveedores</span>
                                    </div>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Gestion de cajas diarias</span>
                                    </div>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Reportes y estadisticas detalladas</span>
                                    </div>
                                    <div className={estilos.caracteristica}>
                                        <ion-icon name="checkmark-circle"></ion-icon>
                                        <span>Modo claro y oscuro</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'registro' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="person-add-outline"></ion-icon>
                                    <h2>Como Registrarse</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>1</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Accede al Registro</h3>
                                            <p>Haz clic en el boton "Registrarme" en el menu principal o en la pagina de login.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>2</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Completa tus Datos Personales</h3>
                                            <p>Ingresa tu nombre completo, cedula, email, telefono y crea una contrasena segura.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>3</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Datos de tu Empresa</h3>
                                            <p>Completa el nombre de tu empresa, RNC y razon social.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>4</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Envia tu Solicitud</h3>
                                            <p>Haz clic en "Registrarme" y seras redirigido a WhatsApp para contactar al administrador.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>5</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Espera la Aprobacion</h3>
                                            <p>El administrador revisara tu solicitud y te notificara cuando tu cuenta sea activada.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'login' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="log-in-outline"></ion-icon>
                                    <h2>Iniciar Sesion</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>1</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Accede al Login</h3>
                                            <p>Haz clic en "Iniciar Sesion" en el menu principal.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>2</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Ingresa tus Credenciales</h3>
                                            <p>Escribe tu correo electronico y contrasena registrados.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>3</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Inicia Sesion</h3>
                                            <p>Haz clic en el boton "Iniciar Sesion" y seras redirigido a tu panel correspondiente.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={estilos.nota}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>Segun tu tipo de cuenta (SuperAdmin, Admin o Vendedor) seras redirigido a diferentes secciones del sistema.</p>
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'recuperar' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <h2>Recuperar Contrasena</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>1</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Olvidaste tu Contrasena</h3>
                                            <p>En la pagina de login, haz clic en "Olvidaste tu contrasena?"</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>2</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Ingresa tu Email</h3>
                                            <p>Escribe el correo electronico asociado a tu cuenta.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>3</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Contacta al Soporte</h3>
                                            <p>Seras redirigido a WhatsApp para solicitar el restablecimiento de tu contrasena al administrador.</p>
                                        </div>
                                    </div>
                                    <div className={estilos.paso}>
                                        <div className={estilos.pasoNumero}>4</div>
                                        <div className={estilos.pasoContenido}>
                                            <h3>Recibe tu Nueva Contrasena</h3>
                                            <p>El administrador te ayudara a restablecer tu contrasena y podras acceder nuevamente.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'contacto' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="chatbubble-outline"></ion-icon>
                                    <h2>Contactanos</h2>
                                </div>
                                <p className={estilos.texto}>
                                    Necesitas ayuda adicional o tienes alguna duda? Estamos aqui para ayudarte.
                                </p>
                                <div className={estilos.contactoCard}>
                                    <div className={estilos.contactoIcono}>
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                    </div>
                                    <div className={estilos.contactoInfo}>
                                        <h3>Soporte por WhatsApp</h3>
                                        <p>Contacta directamente con nuestro equipo de soporte para resolver cualquier duda o problema.</p>
                                    </div>
                                    <button
                                        onClick={abrirWhatsapp}
                                        disabled={!whatsappUrl}
                                        className={estilos.botonWhatsapp}
                                    >
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                        <span>Abrir WhatsApp</span>
                                    </button>
                                </div>
                                <div className={estilos.nota}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>Horario de atencion: Lunes a Viernes de 8:00 AM a 6:00 PM. Sabados de 9:00 AM a 1:00 PM.</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                <div className={estilos.footer}>
                    <Link href="/" className={estilos.enlaceVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Volver al inicio</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
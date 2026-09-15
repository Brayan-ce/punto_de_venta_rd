"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { obtenerWhatsappSoporte } from './servidor'
import { useLanguage } from '../i18n'
import estilos from './ayuda.module.css'

export default function Ayuda() {
    const { language } = useLanguage()
    const [tema, setTema] = useState('light')
    const [whatsappUrl, setWhatsappUrl] = useState(null)
    const [seccionActiva, setSeccionActiva] = useState('inicio')

    const contenido = language === 'en' ? {
        title: 'Help Center',
        subtitle: 'Find all the information you need to use IsiWeek',
        menu: { inicio: 'Home', registro: 'Register', login: 'Sign in', recuperar: 'Recover Password', contacto: 'Contact' },
        inicio: {
            title: 'Welcome to IsiWeek',
            text: 'IsiWeek is your complete point of sale system to manage your business in an easy and efficient way.',
            features: [
                'Sales and product management',
                'Real-time inventory control',
                'Customer and supplier records',
                'Daily cash register management',
                'Detailed reports and analytics',
                'Light and dark mode'
            ]
        },
        registro: {
            title: 'How to Register',
            steps: [
                { t: 'Open Registration', d: 'Click the "Sign up" button in the main menu or on the login page.' },
                { t: 'Fill Your Personal Data', d: 'Enter your full name, ID, email, phone and create a secure password.' },
                { t: 'Company Information', d: 'Fill in your company name, tax ID and legal name.' },
                { t: 'Send Request', d: 'Click "Sign up" and you will be redirected to WhatsApp to contact the administrator.' },
                { t: 'Wait for Approval', d: 'The administrator will review your request and notify you when your account is activated.' }
            ]
        },
        login: {
            title: 'Sign in',
            steps: [
                { t: 'Open Login', d: 'Click "Sign in" in the main menu.' },
                { t: 'Enter Credentials', d: 'Type your registered email and password.' },
                { t: 'Sign in', d: 'Click the "Sign in" button and you will be redirected to your corresponding panel.' }
            ],
            note: 'According to your account type (SuperAdmin, Admin or Seller), you will be redirected to different system sections.'
        },
        recuperar: {
            title: 'Recover Password',
            steps: [
                { t: 'Forgot your password', d: 'On the login page, click "Forgot your password?"' },
                { t: 'Enter your Email', d: 'Enter the email associated with your account.' },
                { t: 'Contact Support', d: 'You will be redirected to WhatsApp to request password reset from the administrator.' },
                { t: 'Receive New Password', d: 'The administrator will help you reset your password so you can access again.' }
            ]
        },
        contacto: {
            title: 'Contact Us',
            text: 'Need additional help or have any questions? We are here to help.',
            waTitle: 'WhatsApp Support',
            waText: 'Contact our support team directly to solve any question or issue.',
            waButton: 'Open WhatsApp',
            schedule: 'Support hours: Monday to Friday from 8:00 AM to 6:00 PM. Saturday from 9:00 AM to 1:00 PM.'
        },
        backHome: 'Back to home'
    } : {
        title: 'Centro de Ayuda',
        subtitle: 'Encuentra toda la informacion que necesitas para usar IsiWeek',
        menu: { inicio: 'Inicio', registro: 'Registro', login: 'Iniciar Sesion', recuperar: 'Recuperar Contrasena', contacto: 'Contacto' },
        inicio: {
            title: 'Bienvenido a IsiWeek',
            text: 'IsiWeek es tu sistema de punto de venta completo para gestionar tu negocio de manera facil y eficiente.',
            features: [
                'Gestion de ventas y productos',
                'Control de inventario en tiempo real',
                'Registro de clientes y proveedores',
                'Gestion de cajas diarias',
                'Reportes y estadisticas detalladas',
                'Modo claro y oscuro'
            ]
        },
        registro: {
            title: 'Como Registrarse',
            steps: [
                { t: 'Accede al Registro', d: 'Haz clic en el boton "Registrarme" en el menu principal o en la pagina de login.' },
                { t: 'Completa tus Datos Personales', d: 'Ingresa tu nombre completo, cedula, email, telefono y crea una contrasena segura.' },
                { t: 'Datos de tu Empresa', d: 'Completa el nombre de tu empresa, RNC y razon social.' },
                { t: 'Envia tu Solicitud', d: 'Haz clic en "Registrarme" y seras redirigido a WhatsApp para contactar al administrador.' },
                { t: 'Espera la Aprobacion', d: 'El administrador revisara tu solicitud y te notificara cuando tu cuenta sea activada.' }
            ]
        },
        login: {
            title: 'Iniciar Sesion',
            steps: [
                { t: 'Accede al Login', d: 'Haz clic en "Iniciar Sesion" en el menu principal.' },
                { t: 'Ingresa tus Credenciales', d: 'Escribe tu correo electronico y contrasena registrados.' },
                { t: 'Inicia Sesion', d: 'Haz clic en el boton "Iniciar Sesion" y seras redirigido a tu panel correspondiente.' }
            ],
            note: 'Segun tu tipo de cuenta (SuperAdmin, Admin o Vendedor) seras redirigido a diferentes secciones del sistema.'
        },
        recuperar: {
            title: 'Recuperar Contrasena',
            steps: [
                { t: 'Olvidaste tu Contrasena', d: 'En la pagina de login, haz clic en "Olvidaste tu contrasena?"' },
                { t: 'Ingresa tu Email', d: 'Escribe el correo electronico asociado a tu cuenta.' },
                { t: 'Contacta al Soporte', d: 'Seras redirigido a WhatsApp para solicitar el restablecimiento de tu contrasena al administrador.' },
                { t: 'Recibe tu Nueva Contrasena', d: 'El administrador te ayudara a restablecer tu contrasena y podras acceder nuevamente.' }
            ]
        },
        contacto: {
            title: 'Contactanos',
            text: 'Necesitas ayuda adicional o tienes alguna duda? Estamos aqui para ayudarte.',
            waTitle: 'Soporte por WhatsApp',
            waText: 'Contacta directamente con nuestro equipo de soporte para resolver cualquier duda o problema.',
            waButton: 'Abrir WhatsApp',
            schedule: 'Horario de atencion: Lunes a Viernes de 8:00 AM a 6:00 PM. Sabados de 9:00 AM a 1:00 PM.'
        },
        backHome: 'Volver al inicio'
    }

    const landing = language === 'en' ? {
        login: 'Sign in', demo: 'Request demo', eyebrow: 'Complete Management System', hero: <>Your business. Your control. <em>Everything in one place.</em></>, description: 'IsiWeek is a management system designed to control sales, inventory, invoicing, customers, collections, and your business operations from one platform.', discover: 'Discover IsiWeek', benefitsButton: 'View benefits', daily: 'Built for daily work', clear: 'Clear, simple control', imageAlt: 'Team assisting a business', imageLabel: 'Everything your business needs', statement: <>Stop managing your business blindly. <strong>Start managing it with IsiWeek.</strong></>, sectionEyebrow: 'One platform, more control', sectionTitle: 'The important things cannot slip away.', sectionText: 'Organize every part of your operation and have the information ready when you need it.', benefits: [['cart-outline', 'Fast sales', 'Charge, apply discounts, and issue receipts from one place.'], ['cube-outline', 'Up-to-date inventory', 'Know your stock, movements, and top-selling products.'], ['receipt-outline', 'Organized invoicing', 'Keep your receipts, customers, and operations easy to find.'], ['people-outline', 'Customers and collections', 'Track every customer, credit, installment, and pending payment.'], ['analytics-outline', 'Decisions with data', 'Review clear reports for sales, expenses, and business performance.'], ['phone-portrait-outline', 'Connected operations', 'Manage from one platform with tools built for your daily work.']], operationEyebrow: 'Made to move forward', operationTitle: 'A complete view of your business, without the complexity.', operationText: 'From the first sale to the closing report, IsiWeek brings operations together so you and your team work with order and speed.', operationImageAlt: 'People reviewing business operations', operationPoints: ['Sell and record every movement', 'Review results with real reports', 'Serve every customer better'], finalEyebrow: 'Your next step', finalTitle: 'Make your business work with you.', finalText: 'Discover IsiWeek and find a clearer way to stay in control.', finalImageAlt: 'Satisfied business team', finalDemo: 'Request a demonstration'
    } : {
        login: 'Iniciar sesión', demo: 'Solicitar demo', eyebrow: 'Sistema de Gestión Total', hero: <>Tu negocio. Tu control. <em>Todo en un solo lugar.</em></>, description: 'IsiWeek es un sistema de gestión diseñado para controlar ventas, inventario, facturación, clientes, cobros y las operaciones de tu negocio desde una sola plataforma.', discover: 'Quiero conocer IsiWeek', benefitsButton: 'Ver beneficios', daily: 'Pensado para el trabajo diario', clear: 'Control claro y simple', imageAlt: 'Equipo atendiendo un negocio', imageLabel: 'Todo lo que tu negocio necesita', statement: <>Deja de administrar tu negocio a ciegas. <strong>Empieza a gestionarlo con IsiWeek.</strong></>, sectionEyebrow: 'Una plataforma, más control', sectionTitle: 'Lo importante no se te puede escapar.', sectionText: 'Organiza cada parte de tu operación y ten la información lista cuando la necesites.', benefits: [['cart-outline', 'Ventas ágiles', 'Cobra, aplica descuentos y emite comprobantes desde un solo lugar.'], ['cube-outline', 'Inventario al día', 'Conoce tu existencia, movimientos y productos de mayor rotación.'], ['receipt-outline', 'Facturación organizada', 'Mantén tus comprobantes, clientes y operaciones siempre localizables.'], ['people-outline', 'Clientes y cobros', 'Da seguimiento a cada cliente, crédito, cuota y pago pendiente.'], ['analytics-outline', 'Decisiones con datos', 'Consulta reportes claros de ventas, gastos y desempeño de tu negocio.'], ['phone-portrait-outline', 'Tu operación conectada', 'Administra desde la plataforma con herramientas preparadas para tu día a día.']], operationEyebrow: 'Hecho para avanzar', operationTitle: 'Una visión completa de tu negocio, sin complicarte.', operationText: 'Desde la primera venta hasta el reporte de cierre, IsiWeek reúne la operación para que tú y tu equipo trabajen con orden y rapidez.', operationImageAlt: 'Personas revisando la operación de un negocio', operationPoints: ['Vende y registra cada movimiento', 'Consulta resultados con reportes reales', 'Atiende mejor a cada cliente'], finalEyebrow: 'Tu próximo paso', finalTitle: 'Haz que tu negocio trabaje contigo.', finalText: 'Conoce IsiWeek y descubre una manera más clara de llevar el control.', finalImageAlt: 'Equipo de negocio satisfecho', finalDemo: 'Solicitar una demostración'
    }

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
        const respaldarCambioTema = (evento) => {
            if (!evento.target.closest?.('button[aria-label="Cambiar tema"]')) return

            const temaAntes = document.documentElement.getAttribute('data-theme') || tema
            window.setTimeout(() => {
                const temaDespues = document.documentElement.getAttribute('data-theme') || temaAntes
                if (temaDespues !== temaAntes) return

                const nuevoTema = temaAntes === 'light' ? 'dark' : 'light'
                localStorage.setItem('tema', nuevoTema)
                document.documentElement.setAttribute('data-theme', nuevoTema)
                setTema(nuevoTema)
                window.dispatchEvent(new Event('temaChange'))
            }, 0)
        }

        document.addEventListener('click', respaldarCambioTema)
        return () => document.removeEventListener('click', respaldarCambioTema)
    }, [tema])

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

    const scrollToBeneficios = () => {
        document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className={`${estilos.landing} ${tema === 'dark' ? estilos.landingDark : ''}`}>
            <header className={estilos.landingNav}>
                <Link href="/" className={estilos.brandLanding}>
                    <img src="/logo.png" alt="ISIWEEK" />
                    <span>IsiWeek</span>
                </Link>
                <div className={estilos.navAcciones}>
                    <Link href="/login" className={estilos.linkLogin}>{landing.login}</Link>
                    <button type="button" onClick={abrirWhatsapp} className={estilos.navCta} disabled={!whatsappUrl}>{landing.demo}</button>
                </div>
            </header>

            <main>
                <section className={estilos.heroLanding}>
                    <div className={estilos.heroCopy}>
                        <span className={estilos.eyebrow}>{landing.eyebrow}</span>
                        <h1>{landing.hero}</h1>
                        <p>{landing.description}</p>
                        <div className={estilos.heroAcciones}>
                            <button type="button" onClick={abrirWhatsapp} className={estilos.ctaPrincipal} disabled={!whatsappUrl}><ion-icon name="rocket-outline"></ion-icon> {landing.discover}</button>
                            <button type="button" onClick={scrollToBeneficios} className={estilos.ctaSecundario}>{landing.benefitsButton} <ion-icon name="arrow-down-outline"></ion-icon></button>
                        </div>
                        <div className={estilos.confianza}><span><ion-icon name="checkmark-circle"></ion-icon> {landing.daily}</span><span><ion-icon name="checkmark-circle"></ion-icon> {landing.clear}</span></div>
                    </div>
                    <div className={estilos.heroMedia}>
                        <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85" alt={landing.imageAlt} />
                        <div className={estilos.heroEtiqueta}><img src="/logo-pwa.png" alt="" /><span>{landing.imageLabel}</span></div>
                    </div>
                </section>

                <section className={estilos.fraseFuerte}>
                    <div><ion-icon name="pulse-outline"></ion-icon><p>{landing.statement}</p></div>
                </section>

                <section id="beneficios" className={estilos.beneficiosSeccion}>
                    <div className={estilos.seccionIntro}><span className={estilos.eyebrow}>{landing.sectionEyebrow}</span><h2>{landing.sectionTitle}</h2><p>{landing.sectionText}</p></div>
                    <div className={estilos.beneficiosGrid}>{landing.benefits.map(([icono, titulo, texto]) => <article className={estilos.beneficio} key={titulo}><div><ion-icon name={icono}></ion-icon></div><h3>{titulo}</h3><p>{texto}</p></article>)}</div>
                </section>

                <section className={estilos.operacionSeccion}>
                    <div className={estilos.operacionImagen}><img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85" alt={landing.operationImageAlt} /></div>
                    <div className={estilos.operacionTexto}><span className={estilos.eyebrow}>{landing.operationEyebrow}</span><h2>{landing.operationTitle}</h2><p>{landing.operationText}</p><ul>{landing.operationPoints.map(point => <li key={point}><ion-icon name="checkmark-outline"></ion-icon> {point}</li>)}</ul></div>
                </section>

                <section className={estilos.ctaFinal}>
                    <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85" alt={landing.finalImageAlt} />
                    <div><span className={estilos.eyebrow}>{landing.finalEyebrow}</span><h2>{landing.finalTitle}</h2><p>{landing.finalText}</p><button type="button" onClick={abrirWhatsapp} className={estilos.ctaPrincipal} disabled={!whatsappUrl}><ion-icon name="logo-whatsapp"></ion-icon> {landing.finalDemo}</button></div>
                </section>
            </main>
            <footer className={estilos.landingFooter}><img src="/logo.png" alt="IsiWeek" /><span>IsiWeek · {landing.eyebrow}</span><Link href="/login">{landing.login}</Link></footer>
        </div>
    )

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={`${estilos.contenido} ${estilos[tema]}`}>
                <div className={estilos.header}>
                    <h1 className={estilos.titulo}>{contenido.title}</h1>
                    <p className={estilos.subtitulo}>
                        {contenido.subtitle}
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
                                <span>{contenido.menu.inicio}</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'registro' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('registro')}
                            >
                                <ion-icon name="person-add-outline"></ion-icon>
                                <span>{contenido.menu.registro}</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'login' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('login')}
                            >
                                <ion-icon name="log-in-outline"></ion-icon>
                                <span>{contenido.menu.login}</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'recuperar' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('recuperar')}
                            >
                                <ion-icon name="lock-closed-outline"></ion-icon>
                                <span>{contenido.menu.recuperar}</span>
                            </button>
                            <button
                                className={`${estilos.menuItem} ${seccionActiva === 'contacto' ? estilos.activo : ''}`}
                                onClick={() => setSeccionActiva('contacto')}
                            >
                                <ion-icon name="chatbubble-outline"></ion-icon>
                                <span>{contenido.menu.contacto}</span>
                            </button>
                        </nav>
                    </aside>

                    <main className={`${estilos.principal} ${estilos[tema]}`}>
                        {seccionActiva === 'inicio' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="home-outline"></ion-icon>
                                    <h2>{contenido.inicio.title}</h2>
                                </div>
                                <p className={estilos.texto}>
                                    {contenido.inicio.text}
                                </p>
                                <div className={estilos.caracteristicas}>
                                    {contenido.inicio.features.map((feature) => (
                                        <div className={estilos.caracteristica} key={feature}>
                                            <ion-icon name="checkmark-circle"></ion-icon>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'registro' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="person-add-outline"></ion-icon>
                                    <h2>{contenido.registro.title}</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    {contenido.registro.steps.map((step, idx) => (
                                        <div className={estilos.paso} key={step.t}>
                                            <div className={estilos.pasoNumero}>{idx + 1}</div>
                                            <div className={estilos.pasoContenido}>
                                                <h3>{step.t}</h3>
                                                <p>{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'login' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="log-in-outline"></ion-icon>
                                    <h2>{contenido.login.title}</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    {contenido.login.steps.map((step, idx) => (
                                        <div className={estilos.paso} key={step.t}>
                                            <div className={estilos.pasoNumero}>{idx + 1}</div>
                                            <div className={estilos.pasoContenido}>
                                                <h3>{step.t}</h3>
                                                <p>{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={estilos.nota}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>{contenido.login.note}</p>
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'recuperar' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="lock-closed-outline"></ion-icon>
                                    <h2>{contenido.recuperar.title}</h2>
                                </div>
                                <div className={estilos.pasos}>
                                    {contenido.recuperar.steps.map((step, idx) => (
                                        <div className={estilos.paso} key={step.t}>
                                            <div className={estilos.pasoNumero}>{idx + 1}</div>
                                            <div className={estilos.pasoContenido}>
                                                <h3>{step.t}</h3>
                                                <p>{step.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {seccionActiva === 'contacto' && (
                            <div className={estilos.seccion}>
                                <div className={estilos.seccionHeader}>
                                    <ion-icon name="chatbubble-outline"></ion-icon>
                                    <h2>{contenido.contacto.title}</h2>
                                </div>
                                <p className={estilos.texto}>
                                    {contenido.contacto.text}
                                </p>
                                <div className={estilos.contactoCard}>
                                    <div className={estilos.contactoIcono}>
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                    </div>
                                    <div className={estilos.contactoInfo}>
                                        <h3>{contenido.contacto.waTitle}</h3>
                                        <p>{contenido.contacto.waText}</p>
                                    </div>
                                    <button
                                        onClick={abrirWhatsapp}
                                        disabled={!whatsappUrl}
                                        className={estilos.botonWhatsapp}
                                    >
                                        <ion-icon name="logo-whatsapp"></ion-icon>
                                        <span>{contenido.contacto.waButton}</span>
                                    </button>
                                </div>
                                <div className={estilos.nota}>
                                    <ion-icon name="information-circle-outline"></ion-icon>
                                    <p>{contenido.contacto.schedule}</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                <div className={estilos.footer}>
                    <Link href="/" className={estilos.enlaceVolver}>
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>{contenido.backHome}</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
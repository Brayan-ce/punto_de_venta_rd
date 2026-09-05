"use client"
import {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {useRouter, usePathname} from 'next/navigation'
import Link from 'next/link'
import {obtenerDatosAdmin, cerrarSesion} from './servidor'
import { obtenerNotificaciones } from '../notificaciones/servidor'
import {useLanguage} from '@/_Pages/admin/i18n'
import {useModulos} from '@/hooks/useModulos'
import {formatCurrency} from '@/utils/monedaUtils'
import {obtenerDatosOffline} from '@/lib/offline/offlineServidor'
import {getOfflineManager} from '@/lib/offline/OfflineManager'
import {
    NAVIGATION_CATALOG,
    obtenerItemsTop,
    obtenerCategoriasNavegacion,
    obtenerAccionesDiarias
} from '@/lib/navigation/catalogo'
import estilos from './header.module.css'
import PrinterButton from '../ventas/imprimir/PrinterButton'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function HeaderAdmin() {
    const router = useRouter()
    const pathname = usePathname()
    const { language, toggleLanguage, t } = useLanguage()
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
    const [tema, setTema] = useState('light')
    const [datosUsuario, setDatosUsuario] = useState(null)
    const [datosEmpresa, setDatosEmpresa] = useState(null)
    const [logoPlataforma, setLogoPlataforma] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({})
    const [sidebarColapsado, setSidebarColapsado] = useState(false)
    const [hoverSubmenu, setHoverSubmenu] = useState(null)
    const [popoverPosition, setPopoverPosition] = useState({ top: 0 })
    const [userSystemMode, setUserSystemMode] = useState('POS')
    const [menuNotifAbierto, setMenuNotifAbierto] = useState(false)
    const [notifData, setNotifData] = useState({ cuotasProximas: [], cuotasVencidas: [], alertas: [], stats: { proximas: 0, vencidas: 0, alertas: 0 }, config: { mostrarProximas: true, mostrarVencidas: true, mostrarAlertas: true } })
    const [notifTab, setNotifTab] = useState('proximas')
    const [totalNotif, setTotalNotif] = useState(0)
    const [cargandoNotif, setCargandoNotif] = useState(false)
    const [offlinePreparado, setOfflinePreparado] = useState(false)
    const [offlineCargando, setOfflineCargando] = useState(false)
    const [sincronizando, setSincronizando] = useState(false)
    const [online, setOnline] = useState(true)
    const popoverTimeoutRef = useRef(null)

    // Mapping de labels en español a keys de traducción
    const labelMapping = {
      'Vender': 'header.vender',
      'Mis Ventas': 'header.misVentas',
      'Productos': 'header.productos',
      'Clientes': 'header.clientes',
      'Dashboard': 'header.dashboard',
      'Reportes': 'header.reportes',
            'Sucursales': 'header.sucursales',
            'Operaciones': 'header.operaciones',
            'Transferencias': 'header.transferencias',
            'Ajustes': 'header.ajustes',
            'Dashboard Financiamiento': 'header.dashboardFinanciamiento',
                'Dashboard Sucursales': 'header.dashboard',
                'Stock por Sucursal': 'header.inventario',
            'Préstamos': 'header.contratos',
            'Cuotas': 'header.cuotas',
            'Notificaciones': 'header.notificaciones',
            'Pagos': 'header.pagos',
            'Alertas': 'header.alertas',
            'Planes': 'header.planes',
            'Pedidos': 'header.pedidos',
            'Tienda IsiWeek': 'header.tiendaIsiweek',
      'Punto de Venta': 'header.puntoDeVenta',
      'Crédito': 'header.credito',
      'Financiamiento': 'header.financiamiento',
      'Catálogo Online': 'header.catalogoOnline',
            'Catalogo Online': 'header.catalogoOnline',
      'Usuario': 'header.usuarios',
      'Configuracion': 'header.configuracion',
            'Configuración': 'header.configuracion',
      'Acciones Diarias': 'header.acciones',
      'Sistema': 'header.sistema',
      'Usuarios': 'header.usuarios',
      'Gestión Empresarial': 'header.gestion',
      'Compras': 'header.compras',
      'Inventario': 'header.inventario',
            'Proveedores': 'header.proveedores',
            'Cotizaciones': 'header.cotizaciones',
            'Conduces': 'header.conduces',
            'Despachos': 'header.conduces',
            'Categorias': 'header.categorias',
            'Categorías': 'header.categorias',
            'Marcas': 'header.marcas',
            'Cajas': 'header.cajas',
            'Gastos': 'header.gastos',
            'Menu Simple': 'header.menuSimple',
            'Dashboard Simple': 'header.dashboardSimple',
            'Mis Obras': 'header.misObras',
            'Trabajadores': 'header.trabajadores',
            'Asistencia Diaria': 'header.asistenciaDiaria',
            'Gastos de Obra': 'header.gastosObra',
            'Reportes Simples': 'header.reportesSimples',
            'Dashboard Construcción': 'header.dashboardConstruccion',
            'Obras': 'header.obras',
            'Proyectos': 'header.proyectos',
            'Plantillas de Proyectos': 'header.plantillasProyectos',
            'Presupuesto': 'header.presupuesto',
            'Bitácora': 'header.bitacora',
            'Servicios': 'header.servicios',
            'Personal': 'header.personal',
            'Compras Obra': 'header.comprasObra',
            'Conduces Obra': 'header.conducesObra',
            'Isicrub': 'header.isicrub'
    }

    const translateLabel = (label) => {
      const key = labelMapping[label]
      return key ? t(key) : label
    }

    const {tieneModulo, systemMode} = useModulos()

    // ✅ Si el tipo del usuario es 'financiamiento', limitar toda la navegación
    const esSoloFinanciamiento = datosUsuario?.tipo === 'financiamiento'
    const esSoloSucursales = datosUsuario?.tipo === 'sucursales'

    const tieneModuloHeader = useCallback((codigoModulo) => {
        if (codigoModulo === 'sucursales' && !esSoloSucursales) {
            return false
        }
        return tieneModulo(codigoModulo)
    }, [tieneModulo, esSoloSucursales])

    const obtenerDashboardPrincipal = useMemo(() => {
        if (esSoloSucursales) return '/sucursales'

        // ✅ Usuarios de financiamiento siempre van a su dashboard
        if (esSoloFinanciamiento) return '/admin/financiamiento'

        if (userSystemMode === 'OBRAS' && tieneModuloHeader('constructora')) {
            return '/admin/manejo-simple'
        }

        const esRutaConstructora = pathname.startsWith('/admin/manejo-simple') || 
                                   pathname.startsWith('/admin/constructora') ||
                                   pathname.startsWith('/admin/obras') ||
                                   pathname.startsWith('/admin/proyectos') ||
                                   pathname.startsWith('/admin/bitacora') ||
                                   pathname.startsWith('/admin/presupuesto') ||
                                   pathname.startsWith('/admin/servicios') ||
                                   pathname.startsWith('/admin/personal') ||
                                   pathname.startsWith('/admin/compras-obra') ||
                                   pathname.startsWith('/admin/conduces-obra')

        if (esRutaConstructora && tieneModuloHeader('constructora')) {
            return '/admin/manejo-simple'
        }

        return '/admin/dashboard'
    }, [pathname, tieneModuloHeader, userSystemMode, esSoloFinanciamiento, esSoloSucursales])

    useEffect(() => {
        const estadoGuardado = localStorage.getItem('sidebarSeccionesAbiertas')
        if (estadoGuardado) {
            try {
                setSeccionesAbiertas(JSON.parse(estadoGuardado))
            } catch (e) {
                console.error('Error al cargar estado del sidebar:', e)
            }
        }
        
        const sidebarColapsadoGuardado = localStorage.getItem('sidebarColapsado')
        if (sidebarColapsadoGuardado !== null) {
            setSidebarColapsado(sidebarColapsadoGuardado === 'true')
        }
    }, [])

    useEffect(() => {
        if (Object.keys(seccionesAbiertas).length > 0) {
            localStorage.setItem('sidebarSeccionesAbiertas', JSON.stringify(seccionesAbiertas))
        }
    }, [seccionesAbiertas])

    useEffect(() => {
        localStorage.setItem('sidebarColapsado', sidebarColapsado.toString())
    }, [sidebarColapsado])

    useEffect(() => {
        const s = document.createElement('style')
        s.id = 'header-mobile-fix'
        s.textContent = `
            @media (max-width: 992px) {
                .${estilos.header} { height: 56px !important; }
                .${estilos.contenedor} { padding: 0 12px !important; gap: 8px !important; }
                .${estilos.acciones} { gap: 6px !important; }
                .${estilos.acciones} .${estilos.botonTema} { width: 38px !important; height: 38px !important; min-width: 38px !important; border-radius: 10px !important; display: inline-flex !important; }
                .${estilos.acciones} .${estilos.botonTema} ion-icon { font-size: 20px !important; display: block !important; }
                .${estilos.notifWrap} { display: block !important; }
                .${estilos.notifWrap} .${estilos.botonNotif} { width: 38px !important; height: 38px !important; min-width: 38px !important; }
                .${estilos.botonIdioma} { display: inline-flex !important; }
                .${estilos.botonMenu} { display: inline-flex !important; width: 42px !important; height: 42px !important; min-width: 42px !important; }
                .${estilos.usuarioInfo} { display: none !important; }
                .${estilos.usuario} { padding: 4px 6px !important; background: rgba(2,132,199,0.1) !important; border-radius: 10px !important; gap: 4px !important; }
                .${estilos.chevronIcon} { display: inline-flex !important; font-size: 14px !important; color: #0284c7 !important; }
                .${estilos.avatar}, .${estilos.avatarDefault} { width: 32px !important; height: 32px !important; min-width: 32px !important; }
            }
            @media (max-width: 480px) {
                .${estilos.header} { height: 52px !important; }
                .${estilos.contenedor} { padding: 0 8px !important; gap: 6px !important; }
                .${estilos.acciones} { gap: 4px !important; }
                .${estilos.acciones} .${estilos.botonTema} { width: 34px !important; height: 34px !important; min-width: 34px !important; }
                .${estilos.acciones} .${estilos.botonTema} ion-icon { font-size: 18px !important; }
                .${estilos.notifWrap} .${estilos.botonNotif} { width: 34px !important; height: 34px !important; min-width: 34px !important; }
                .${estilos.botonMenu} { width: 38px !important; height: 38px !important; min-width: 38px !important; }
                .${estilos.avatar}, .${estilos.avatarDefault} { width: 28px !important; height: 28px !important; min-width: 28px !important; }
                .${estilos.usuario} { padding: 3px 5px !important; gap: 3px !important; }
                .${estilos.chevronIcon} { font-size: 12px !important; }
            }
        `
        document.head.appendChild(s)
        return () => s.remove()
    }, [])

    useEffect(() => {
        if (sidebarColapsado) {
            document.body.classList.add('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '72px')
        } else {
            document.body.classList.remove('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '260px')
        }
        
        return () => {
            document.body.classList.remove('sidebar-colapsado')
            document.documentElement.style.setProperty('--sidebar-width', '260px')
        }
    }, [sidebarColapsado])

    const toggleSidebar = () => {
        setSidebarColapsado(!sidebarColapsado)
    }

    const navegacionPrincipal = useMemo(() => {
        if (esSoloSucursales) {
            return NAVIGATION_CATALOG.sucursales.items.filter(i => i.top)
        }

        if (esSoloFinanciamiento) {
            // ✅ Solo los items top del catálogo de financiamiento
            return NAVIGATION_CATALOG.financiamiento.items.filter(i => i.top)
        }
        const esManejoSimple = pathname.startsWith('/admin/manejo-simple')
        let items = obtenerItemsTop(tieneModuloHeader, systemMode, 5, esManejoSimple)
        // Ocultar ventas y cajas si el modo es OBRAS
        if (systemMode === 'OBRAS') {
            items = items.filter(item => !(item.href === '/admin/ventas' || item.href === '/vender' || item.href === '/admin/cajas'))
        }
        return items
    }, [tieneModuloHeader, systemMode, esSoloFinanciamiento, esSoloSucursales, pathname])

    const categoriasNavegacion = useMemo(() => {
        if (esSoloSucursales) {
            const itemsSucursales = NAVIGATION_CATALOG.sucursales.items
            const itemDashboard = itemsSucursales.find((item) => item.href === '/sucursales')
            const itemsOperaciones = itemsSucursales.filter((item) => [
                '/sucursales/sedes',
                '/sucursales/stock',
                '/sucursales/productos',
                '/sucursales/transferencias',
                '/sucursales/accesos'
            ].includes(item.href))
            const itemsSistema = itemsSucursales.filter((item) => [
                '/sucursales/ajustes',
                '/sucursales/reportes/transferencias'
            ].includes(item.href))

            return [
                {
                    label: 'Sucursales',
                    icon: 'git-compare-outline',
                    modulo: 'sucursales-dashboard',
                    systemMode: 'POS',
                    uniqueKey: 'sucursales-dashboard',
                    items: itemDashboard ? [itemDashboard] : []
                },
                {
                    label: 'Operaciones',
                    icon: 'layers-outline',
                    modulo: 'sucursales-operaciones',
                    systemMode: 'POS',
                    uniqueKey: 'sucursales-operaciones',
                    items: itemsOperaciones
                },
                {
                    label: 'Sistema',
                    icon: 'settings-outline',
                    modulo: 'sucursales-sistema',
                    systemMode: 'POS',
                    uniqueKey: 'sucursales-sistema',
                    items: itemsSistema
                }
            ].filter((categoria) => categoria.items.length > 0)
        }

        if (esSoloFinanciamiento) {
            // ✅ Solo la categoría de financiamiento en el sidebar
            return [{
                ...NAVIGATION_CATALOG.financiamiento,
                uniqueKey: 'financiamiento-0'
            }]
        }
        const esManejoSimple = pathname.startsWith('/admin/manejo-simple')
        return obtenerCategoriasNavegacion(tieneModuloHeader, systemMode, esManejoSimple)
    }, [tieneModuloHeader, systemMode, esSoloFinanciamiento, esSoloSucursales, pathname])

    const accionesDiarias = useMemo(() => {
        // ✅ Sin acciones diarias para financiamiento y sucursales
        if (esSoloFinanciamiento || esSoloSucursales) return []
        return obtenerAccionesDiarias(tieneModuloHeader, systemMode)
    }, [tieneModuloHeader, systemMode, esSoloFinanciamiento, esSoloSucursales])

    const basePathApp = esSoloFinanciamiento ? '/financiamiento' : esSoloSucursales ? '/sucursales' : '/admin'
    const mostrarNotificaciones = !esSoloSucursales && systemMode !== 'OBRAS'

    const cargarNotificaciones = useCallback(async () => {
        if (!mostrarNotificaciones) return
        setCargandoNotif(true)
        try {
            const res = await obtenerNotificaciones()
            if (res.success) {
                setNotifData({
                    cuotasProximas: res.cuotasProximas || [],
                    cuotasVencidas: res.cuotasVencidas || [],
                    alertas: res.alertas || [],
                    stats: res.stats || { proximas: 0, vencidas: 0, alertas: 0 },
                    config: res.config || { mostrarProximas: true, mostrarVencidas: true, mostrarAlertas: true },
                })
                setTotalNotif((res.stats?.proximas || 0) + (res.stats?.vencidas || 0) + (res.stats?.alertas || 0))
            }
        } catch (e) {
            console.error('Error cargando notificaciones:', e)
        } finally {
            setCargandoNotif(false)
        }
    }, [mostrarNotificaciones])

    const textoAtraso = useCallback((dias) => {
        const n = parseInt(dias) || 0
        if (n <= 0) return t('header.notifHoy')
        if (n === 1) return t('header.notif1Dia')
        return t('header.notifNDias').replace('{n}', n)
    }, [t])

    const diasDesdeVencimiento = useCallback((fecha) => {
        if (!fecha) return 0
        const venc = new Date(fecha)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        venc.setHours(0, 0, 0, 0)
        return Math.max(0, Math.round((hoy - venc) / 86400000))
    }, [])

    const formatearMontoNotif = useCallback((valor) => formatCurrency(valor, {
        currency: datosEmpresa?.moneda || 'DOP',
        locale: language === 'en' ? 'en-US' : 'es-DO'
    }), [datosEmpresa?.moneda, language])

    const formatearFechaNotif = useCallback((fecha) => {
        if (!fecha) return ''
        try {
            return new Date(fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO', { day: '2-digit', month: 'short' })
        } catch {
            return ''
        }
    }, [language])

    const toggleSeccion = (modulo) => {
        setSeccionesAbiertas(prev => ({
            ...prev,
            [modulo]: !prev[modulo]
        }))
    }

    const esRutaActiva = (href) => {
        return pathname === href || pathname.startsWith(href + '/')
    }

    useEffect(() => {
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)

        const manejarCambioTema = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
            document.documentElement.setAttribute('data-theme', nuevoTema)
        }

        window.addEventListener('temaChange', manejarCambioTema)
        window.addEventListener('storage', (e) => {
            if (e.key === 'tema') {
                const nuevoTema = e.newValue || 'light'
                setTema(nuevoTema)
                document.documentElement.setAttribute('data-theme', nuevoTema)
            }
        })

        return () => {
            window.removeEventListener('temaChange', manejarCambioTema)
            window.removeEventListener('storage', manejarCambioTema)
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handleClick = (e) => {
            if (navigator.onLine) return
            const link = e.target.closest('a')
            if (!link) return
            const href = link.getAttribute('href')
            if (href && href.startsWith('/') && !href.startsWith('/api/') && !href.startsWith('/_next/') && !href.startsWith('/sw.js') && !href.startsWith('/manifest.json')) {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = href
            }
        }
        document.addEventListener('click', handleClick, true)
        return () => document.removeEventListener('click', handleClick, true)
    }, [])

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resultado = await obtenerDatosAdmin()
                if (resultado.success) {
                    localStorage.setItem('cachedAdminSession', JSON.stringify({
                        usuario: resultado.usuario,
                        empresa: resultado.empresa,
                        logoPlataforma: resultado.logoPlataforma,
                        systemMode: resultado.systemMode || 'POS',
                        timestamp: Date.now()
                    }))
                    setDatosUsuario(resultado.usuario)
                    setDatosEmpresa(resultado.empresa)
                    setLogoPlataforma(resultado.logoPlataforma)
                    setUserSystemMode(resultado.systemMode || 'POS')
                } else {
                    const cached = localStorage.getItem('cachedAdminSession')
                    if (cached) {
                        const parsed = JSON.parse(cached)
                        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                            setDatosUsuario(parsed.usuario)
                            setDatosEmpresa(parsed.empresa)
                            setLogoPlataforma(parsed.logoPlataforma)
                            setUserSystemMode(parsed.systemMode)
                        } else {
                            localStorage.removeItem('cachedAdminSession')
                            router.push('/login')
                        }
                    } else {
                        router.push('/login')
                    }
                }
            } catch (error) {
                const cached = localStorage.getItem('cachedAdminSession')
                if (cached) {
                    const parsed = JSON.parse(cached)
                    if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                        setDatosUsuario(parsed.usuario)
                        setDatosEmpresa(parsed.empresa)
                        setLogoPlataforma(parsed.logoPlataforma)
                        setUserSystemMode(parsed.systemMode)
                    } else {
                        localStorage.removeItem('cachedAdminSession')
                        router.push('/login')
                    }
                } else {
                    router.push('/login')
                }
            } finally {
                setCargando(false)
            }
        }
        cargarDatos()
    }, [router])

    useEffect(() => {
        if (cargando || !mostrarNotificaciones) return
        cargarNotificaciones()
        const intervalo = setInterval(() => cargarNotificaciones(), 120000)
        return () => clearInterval(intervalo)
    }, [cargando, mostrarNotificaciones, cargarNotificaciones])

    useEffect(() => {
        setOnline(navigator.onLine)
        const handleOnline = () => setOnline(true)
        const handleOffline = () => setOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    useEffect(() => {
        if (!datosUsuario?.offline_habilitado) return
        const mgr = getOfflineManager()
        if (!mgr) return
        mgr.estaPreparado().then(setOfflinePreparado)
    }, [datosUsuario?.offline_habilitado])

    useEffect(() => {
        const manejarClickFuera = (e) => {
            if (menuUsuarioAbierto && !e.target.closest(`.${estilos.usuario}`)) {
                setMenuUsuarioAbierto(false)
            }
            if (menuNotifAbierto && !e.target.closest(`.${estilos.notifWrap}`)) {
                setMenuNotifAbierto(false)
            }
            
            if (sidebarColapsado && hoverSubmenu && !e.target.closest(`.${estilos.sidebarPopover}`) && !e.target.closest(`.${estilos.sidebarSeccion}`)) {
                setHoverSubmenu(null)
            }
        }

        document.addEventListener('mousedown', manejarClickFuera)
        return () => document.removeEventListener('mousedown', manejarClickFuera)
    }, [menuUsuarioAbierto, menuNotifAbierto, sidebarColapsado, hoverSubmenu])

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto)
    }

    const cerrarMenu = () => {
        setMenuAbierto(false)
    }

    const toggleMenuUsuario = (e) => {
        e.stopPropagation()
        setMenuUsuarioAbierto(!menuUsuarioAbierto)
        setMenuNotifAbierto(false)
    }

    const toggleNotificaciones = () => {
        const abrir = !menuNotifAbierto
        setMenuNotifAbierto(abrir)
        setMenuUsuarioAbierto(false)
        if (abrir) {
            cargarNotificaciones()
        }
    }

    const irNotificacion = (notif) => {
        setMenuNotifAbierto(false)
        router.push(`${basePathApp}/clientes/ver/${notif.cliente_id}?tab=pagos`)
    }

    useEffect(() => {
        const config = notifData.config
        if (!config) return
        const desactivada = (notifTab === 'proximas' && config.mostrarProximas === false)
            || (notifTab === 'vencidas' && config.mostrarVencidas === false)
            || (notifTab === 'alertas' && config.mostrarAlertas === false)
        if (desactivada) {
            setNotifTab(config.mostrarProximas !== false ? 'proximas' : config.mostrarVencidas !== false ? 'vencidas' : 'alertas')
        }
    }, [notifTab, notifData.config])

    const toggleTema = () => {
        const nuevoTema = tema === 'light' ? 'dark' : 'light'
        setTema(nuevoTema)
        localStorage.setItem('tema', nuevoTema)
        document.documentElement.setAttribute('data-theme', nuevoTema)
        window.dispatchEvent(new Event('temaChange'))
    }

    const manejarCerrarSesion = async () => {
        await cerrarSesion()
        router.push('/login')
    }

    const prepararOffline = async () => {
        setOfflineCargando(true)
        try {
            const res = await obtenerDatosOffline()
            if (res.success) {
                const mgr = getOfflineManager()
                if (mgr) {
                    await mgr.prepararOffline({
                        productos: res.productos || [],
                        clientes: res.clientes || [],
                        empresa: res.empresa || null,
                        categorias: res.categorias || [],
                        unidades_medida: res.unidades_medida || [],
                        tablas: res.tablas || null,
                        usuario: res.usuario || null,
                        empresa_id: res.empresa_id || null,
                    })
                    setOfflinePreparado(true)
                    const datosJson = {
                        version: 3,
                        exportado: new Date().toISOString(),
                        empresa_id: res.empresa_id,
                        usuario: res.usuario || null,
                        empresa: res.empresa || null,
                        tablas: res.tablas || {},
                    }
                    const blob = new Blob([JSON.stringify(datosJson)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `base_datos_offline_${new Date().toISOString().slice(0, 10)}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'precachePages',
                        urls: ['/', '/login', '/admin', '/vendedor'],
                    })
                }
            } else {
                console.error('Error al descargar datos offline:', res.mensaje)
            }
        } catch (error) {
            console.error('Error al preparar offline:', error)
        } finally {
            setOfflineCargando(false)
        }
    }

    const sincronizar = async () => {
        setSincronizando(true)
        try {
            const mgr = getOfflineManager()
            if (!mgr) return
            const pendientes = await mgr.obtenerSyncPendiente()
            if (pendientes.length === 0) return
            const {recibirSyncOperaciones} = await import('@/lib/offline/offlineServidor')
            const res = await recibirSyncOperaciones(pendientes)
            if (res.success && res.resultados) {
                for (const r of res.resultados) {
                    if (r.exito) {
                        await mgr.marcarSyncCompletado(r.id)
                    }
                }
            }
        } catch (error) {
            console.error('Error al sincronizar:', error)
        } finally {
            setSincronizando(false)
        }
    }

    const exportarBD = async () => {
        setSincronizando(true)
        try {
            const { obtenerDatosOffline } = await import('@/lib/offline/offlineServidor')
            const res = await obtenerDatosOffline()
            if (!res.success) {
                alert(res.mensaje)
                return
            }
            const datos = {
                version: 3,
                exportado: new Date().toISOString(),
                empresa_id: res.empresa_id,
                usuario: res.usuario || null,
                empresa: res.empresa || null,
                tablas: res.tablas || {},
            }
            const blob = new Blob([JSON.stringify(datos)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `base_datos_offline_${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            alert(
                language === 'en'
                    ? 'Database exported. Transfer this file to your computer and upload it in Configuration > Offline > Upload new database.'
                    : 'Base de datos exportada. Lleva este archivo a tu equipo y súbelo en Configuración > Offline > Subir base de datos nueva.'
            )
        } catch (error) {
            console.error('Error al exportar base de datos:', error)
            alert(language === 'en' ? 'Error exporting database' : 'Error al exportar base de datos')
        } finally {
            setSincronizando(false)
        }
    }

    const obtenerTipoUsuario = () => {
        if (!datosUsuario) return ''
        if (datosUsuario.tipo === 'admin') return t('header.administrador')
        if (datosUsuario.tipo === 'vendedor') return t('header.vendedor')
        if (datosUsuario.tipo === 'financiamiento') return t('header.financiamiento')
        if (datosUsuario.tipo === 'sucursales') return 'Sucursales'
        return datosUsuario.tipo
    }

    const rutaPerfil = esSoloSucursales ? '/sucursales/perfil' : '/admin/perfil'

    if (cargando) {
        return <LoadingScreen minimal />
    }

    return (
        <>
            <header className={`${estilos.header} ${estilos[tema]}`}>
                <div className={estilos.contenedor}>
                    <button
                        className={estilos.botonMenu}
                        onClick={toggleMenu}
                        aria-label={t('header.openMenu')}
                    >
                        <ion-icon name="menu-outline"></ion-icon>
                    </button>

                    <Link href={obtenerDashboardPrincipal} className={estilos.logo}>
                        {logoPlataforma ? (
                            <img
                                src={logoPlataforma}
                                alt="Logo"
                                className={estilos.logoImagen}
                            />
                        ) : (
                            <span className={estilos.logoTexto}>{t('header.puntoDeVenta')}</span>
                        )}
                    </Link>

                    <nav className={estilos.navDesktop}>
                        {navegacionPrincipal.map((item) => {
                            const esActivo = pathname === item.href || pathname.startsWith(item.href + '/')

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${estilos.navItem} ${esActivo ? estilos.activo : ''}`}
                                >
                                    <ion-icon name={item.icon}></ion-icon>
                                    <span>{translateLabel(item.label)}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className={estilos.acciones}>
                        {mostrarNotificaciones && (
                            <div className={estilos.notifWrap}>
                                <button
                                    type="button"
                                    className={`${estilos.botonTema} ${estilos.botonNotif} ${menuNotifAbierto ? estilos.botonNotifActivo : ''}`}
                                    onClick={toggleNotificaciones}
                                    aria-label={t('header.notificaciones')}
                                    title={t('header.notificaciones')}
                                    aria-expanded={menuNotifAbierto}
                                >
                                    <ion-icon name={menuNotifAbierto ? 'notifications' : 'notifications-outline'}></ion-icon>
                                    {totalNotif > 0 && (
                                        <span className={estilos.notifBadge}>
                                            {totalNotif > 99 ? '99+' : totalNotif}
                                        </span>
                                    )}
                                </button>

                                {menuNotifAbierto && (
                                    <>
                                        <div className={estilos.notifBackdrop} onClick={() => setMenuNotifAbierto(false)} aria-hidden="true" />
                                        <div className={`${estilos.notifPanel} ${estilos[tema]}`} role="dialog" aria-label={t('header.notifTitulo')}>
                                            <div className={estilos.notifHeader}>
                                                <div>
                                                    <h3>{t('header.notifTitulo')}</h3>
                                                    <p>{t('header.notifSubtitulo')}</p>
                                                </div>
                                                <button type="button" className={estilos.notifBtnRefresh} onClick={() => cargarNotificaciones()} title={t('header.notifActualizar')}>
                                                    <ion-icon name={cargandoNotif ? 'hourglass-outline' : 'refresh-outline'}></ion-icon>
                                                </button>
                                            </div>

                                            <div className={estilos.notifTabs}>
                                                {[
                                                    { key: 'proximas', label: t('header.notifProximas'), count: notifData.stats.proximas, visible: notifData.config?.mostrarProximas !== false },
                                                    { key: 'vencidas', label: t('header.notifVencidas'), count: notifData.stats.vencidas, visible: notifData.config?.mostrarVencidas !== false },
                                                    { key: 'alertas', label: t('header.notifAlertas'), count: notifData.stats.alertas, visible: notifData.config?.mostrarAlertas !== false },
                                                ]
                                                    .filter((tab) => tab.visible)
                                                    .map((tab) => (
                                                        <button
                                                            key={tab.key}
                                                            type="button"
                                                            className={`${estilos.notifTab} ${notifTab === tab.key ? estilos.notifTabActivo : ''}`}
                                                            onClick={() => setNotifTab(tab.key)}
                                                        >
                                                            {tab.label}
                                                            {tab.count > 0 && <span className={estilos.notifTabCount}>{tab.count}</span>}
                                                        </button>
                                                    ))}
                                            </div>

                                            <div className={estilos.notifLista}>
                                                {cargandoNotif && !notifData.cuotasProximas.length && !notifData.cuotasVencidas.length && !notifData.alertas.length ? (
                                                    <LoadingScreen minimal />
                                                ) : (
                                                    (() => {
                                                        const tabValida = notifData.config?.mostrarProximas !== false ? 'proximas' : notifData.config?.mostrarVencidas !== false ? 'vencidas' : 'alertas'
                                                        const tabActiva = (notifTab === 'proximas' && notifData.config?.mostrarProximas === false)
                                                            || (notifTab === 'vencidas' && notifData.config?.mostrarVencidas === false)
                                                            || (notifTab === 'alertas' && notifData.config?.mostrarAlertas === false)
                                                            ? tabValida
                                                            : notifTab
                                                        const items = tabActiva === 'proximas'
                                                            ? notifData.cuotasProximas
                                                            : tabActiva === 'vencidas'
                                                                ? notifData.cuotasVencidas
                                                                : notifData.alertas

                                                        if (items.length === 0) {
                                                            return (
                                                                <div className={estilos.notifEstado}>
                                                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                                                    <strong>{t('header.notifVacio')}</strong>
                                                                    <span>{t('header.notifVacioDesc')}</span>
                                                                </div>
                                                            )
                                                        }

                                                        return items.map((notif) => {
                                                            const esAlerta = tabActiva === 'alertas'
                                                            return (
                                                                <button
                                                                    key={esAlerta ? `a-${notif.id}` : `${tabActiva}-${notif.id}`}
                                                                    type="button"
                                                                    className={`${estilos.notifItem} ${tabActiva === 'vencidas' ? estilos.notifItemVencida : ''}`}
                                                                    onClick={() => notif.cliente_id ? irNotificacion(notif) : setMenuNotifAbierto(false)}
                                                                >
                                                                    <div className={`${estilos.notifAvatar} ${esAlerta ? estilos.notifAvatarAlerta : ''}`}>
                                                                        {esAlerta
                                                                            ? <ion-icon name="warning-outline"></ion-icon>
                                                                            : (notif.cliente_nombre?.charAt(0)?.toUpperCase() || '?')}
                                                                    </div>
                                                                    <div className={estilos.notifContenido}>
                                                                        <div className={estilos.notifLineaTop}>
                                                                            <span className={estilos.notifNombre}>
                                                                                {esAlerta ? notif.mensaje : notif.cliente_nombre}
                                                                            </span>
                                                                            <span className={estilos.notifTiempo}>
                                                                                {esAlerta
                                                                                    ? notif.numero_contrato || ''
                                                                                    : tabActiva === 'vencidas'
                                                                                        ? textoAtraso(diasDesdeVencimiento(notif.fecha_vencimiento))
                                                                                        : formatearFechaNotif(notif.fecha_vencimiento)}
                                                                            </span>
                                                                        </div>
                                                                        <div className={estilos.notifDetalle}>
                                                                            {esAlerta ? (
                                                                                <span className={`${estilos.notifTag} ${estilos.notifTagFin}`}>
                                                                                    {notif.cliente_nombre || ''}
                                                                                </span>
                                                                            ) : (
                                                                                <span className={`${estilos.notifTag} ${estilos.notifTagFin}`}>
                                                                                    {notif.numero_contrato || ''} · {notif.plan_nombre || ''} · {t('header.notifCuota')} #{notif.numero}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {!esAlerta && (
                                                                            <div className={estilos.notifMonto}>
                                                                                {formatearMontoNotif(parseFloat(notif.monto) + parseFloat(notif.mora || 0))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <ion-icon name="chevron-forward-outline" className={estilos.notifChevron}></ion-icon>
                                                                </button>
                                                            )
                                                        })
                                                    })()
                                                )}
                                            </div>

                                            <div className={estilos.notifFooter}>
                                                <Link href={`${basePathApp}/notificaciones`} className={`${estilos.notifFooterLink} ${estilos.notifFooterLinkTodas}`} onClick={() => setMenuNotifAbierto(false)}>
                                                    <ion-icon name="notifications-outline" style={{marginRight: 6, verticalAlign: 'middle'}}></ion-icon>
                                                    {t('header.notifVerTodas')}
                                                </Link>
                                                <Link href={`${basePathApp}/pagos`} className={estilos.notifFooterLink} onClick={() => setMenuNotifAbierto(false)}>
                                                    {t('header.notifVerPagos')}
                                                </Link>
                                                <Link href={`${basePathApp}/clientes`} className={estilos.notifFooterLink} onClick={() => setMenuNotifAbierto(false)}>
                                                    {t('header.notifVerClientes')}
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ✅ Ocultar acceso a Cajas para usuarios de financiamiento o modo OBRAS */}
                        {(!esSoloFinanciamiento && !esSoloSucursales && systemMode !== 'OBRAS') && (
                            <Link href="/admin/cajas" className={estilos.botonTema} aria-label={t('header.cajas')}>
                                <ion-icon name="cube-outline"></ion-icon>
                            </Link>
                        )}

                        <button
                            className={estilos.botonTema}
                            onClick={toggleTema}
                            aria-label={tema === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                        </button>

                        <button
                            className={`${estilos.botonTema} ${estilos.botonIdioma}`}
                            onClick={toggleLanguage}
                            aria-label={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                            title={language === 'es' ? t('common.switchToEnglish') : t('common.switchToSpanish')}
                        >
                            <span>{language.toUpperCase()}</span>
                        </button>

                        <div className={estilos.usuario} onClick={toggleMenuUsuario}>
                            {datosUsuario?.avatar_url ? (
                                <img
                                    src={datosUsuario.avatar_url}
                                    alt={datosUsuario.nombre}
                                    className={estilos.avatar}
                                />
                            ) : (
                                <div className={estilos.avatarDefault}>
                                    <ion-icon name="person-outline"></ion-icon>
                                </div>
                            )}
                            <div className={estilos.usuarioInfo}>
                                <span className={estilos.nombreUsuario}>{datosUsuario?.nombre}</span>
                                <span className={estilos.tipoUsuario}>{obtenerTipoUsuario()}</span>
                            </div>
                            <ion-icon name="chevron-down-outline" className={estilos.chevronIcon}></ion-icon>

                            {menuUsuarioAbierto && (
                                <div className={`${estilos.menuDesplegable} ${estilos[tema]}`}>
                                    <Link
                                        href={rutaPerfil}
                                        className={estilos.menuDesplegableItem}
                                        onClick={() => setMenuUsuarioAbierto(false)}
                                    >
                                        <ion-icon name="person-circle-outline"></ion-icon>
                                        <span>{t('header.profile')}</span>
                                    </Link>

                                    <div className={estilos.separadorMenu}></div>

                                    {navegacionPrincipal.slice(0, 6).map((item) => {
                                        const esActivo = esRutaActiva(item.href)

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`${estilos.menuDesplegableItem} ${esActivo ? estilos.activo : ''}`}
                                                onClick={() => setMenuUsuarioAbierto(false)}
                                            >
                                                <ion-icon name={item.icon}></ion-icon>
                                                <span>{translateLabel(item.label)}</span>
                                            </Link>
                                        )
                                    })}

                                    <div className={estilos.separadorMenu}></div>

                                    <button
                                        className={`${estilos.menuDesplegableItem} ${estilos.itemSalir}`}
                                        onClick={manejarCerrarSesion}
                                    >
                                        <ion-icon name="log-out-outline"></ion-icon>
                                        <span>{t('header.logout')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <aside className={`${estilos.sidebarDesktop} ${estilos[tema]} ${sidebarColapsado ? estilos.sidebarColapsado : ''} ${cargando ? estilos.sidebarCargando : ''}`}>
                    <div className={estilos.sidebarHeader}>
                        <Link href={obtenerDashboardPrincipal} className={estilos.sidebarLogo}>
                            {datosEmpresa?.logo_url ? (
                                <img 
                                    src={datosEmpresa.logo_url} 
                                    alt={datosEmpresa.nombre_empresa || 'Logo'} 
                                    className={estilos.sidebarLogoImagen}
                                />
                            ) : (
                                <div className={estilos.sidebarLogoDefault}>
                                    <ion-icon name="business-outline"></ion-icon>
                                </div>
                            )}
                            {!sidebarColapsado && (
                                <div className={estilos.sidebarLogoTexto}>
                                    <span className={estilos.sidebarNombreSistema}>
                                        {datosEmpresa?.nombre_empresa || t('header.puntoDeVenta')}
                                    </span>
                                    {datosEmpresa?.rnc && (
                                        <span className={estilos.sidebarRnc}>RNC: {datosEmpresa.rnc}</span>
                                    )}
                                </div>
                            )}
                        </Link>
                        <button 
                            className={estilos.sidebarToggle}
                            onClick={toggleSidebar}
                            aria-label={sidebarColapsado ? (language === 'en' ? 'Expand sidebar' : 'Expandir sidebar') : (language === 'en' ? 'Collapse sidebar' : 'Colapsar sidebar')}
                            title={sidebarColapsado ? (language === 'en' ? 'Expand' : 'Expandir') : (language === 'en' ? 'Collapse' : 'Colapsar')}
                        >
                            <ion-icon name={sidebarColapsado ? 'chevron-forward-outline' : 'chevron-back-outline'}></ion-icon>
                        </button>
                    </div>

                <nav className={estilos.sidebarNav}>
                    {accionesDiarias.length > 0 && (
                        sidebarColapsado ? (
                            accionesDiarias.map((item) => {
                                const esActivo = esRutaActiva(item.href)
                                return (
                                    <div key={item.href} className={estilos.sidebarSeccion}>
                                        <Link
                                            href={item.href}
                                            className={`${estilos.sidebarItemCompacto} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            title={translateLabel(item.label)}
                                        >
                                            <ion-icon name={item.icon}></ion-icon>
                                        </Link>
                                    </div>
                                )
                            })
                        ) : (
                            <div className={estilos.sidebarSeccion}>
                                <span className={estilos.sidebarSeccionTitulo}>
                                    <ion-icon name="flash-outline"></ion-icon>
                                    {t('header.acciones')}
                                </span>
                                {accionesDiarias.map((item) => {
                                    const esActivo = esRutaActiva(item.href)
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`${estilos.sidebarItem} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            title={translateLabel(item.label)}
                                        >
                                            <ion-icon name={item.icon}></ion-icon>
                                            <span>{translateLabel(item.label)}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        )
                    )}

                    {categoriasNavegacion.map((categoria, index) => {
                        const keySeccion = categoria.uniqueKey || `${categoria.modulo}-${index}`
                        const estaAbierto = categoria.modulo === 'core' || seccionesAbiertas[keySeccion] !== false
                        const tieneSubmenu = categoria.items.length > 0
                        const esActivo = categoria.items.some(item => esRutaActiva(item.href))

                        return (
                            <div 
                                key={keySeccion}
                                className={estilos.sidebarSeccion}
                                onMouseEnter={(e) => {
                                    if (sidebarColapsado && tieneSubmenu) {
                                        if (popoverTimeoutRef.current) {
                                            clearTimeout(popoverTimeoutRef.current)
                                            popoverTimeoutRef.current = null
                                        }
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        setPopoverPosition({ top: rect.top })
                                        setHoverSubmenu(keySeccion)
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (sidebarColapsado) {
                                        popoverTimeoutRef.current = setTimeout(() => {
                                            setHoverSubmenu(prev => prev === keySeccion ? null : prev)
                                        }, 300)
                                    }
                                }}
                            >
                                {sidebarColapsado ? (
                                    <>
                                        <button
                                            className={`${estilos.sidebarItemCompacto} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            title={translateLabel(categoria.label)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (tieneSubmenu) {
                                                    setHoverSubmenu(hoverSubmenu === keySeccion ? null : keySeccion);
                                                } else {
                                                    window.location.href = categoria.items[0]?.href || obtenerDashboardPrincipal;
                                                }
                                            }}
                                        >
                                            <ion-icon name={categoria.icon}></ion-icon>
                                        </button>
                                        
                                        {hoverSubmenu === keySeccion && tieneSubmenu && (
                                            <div 
                                                className={estilos.sidebarPopover}
                                                data-popover-modulo={keySeccion}
                                                style={{ '--popover-top': `${popoverPosition.top}px` }}
                                                onMouseEnter={() => {
                                                    if (popoverTimeoutRef.current) {
                                                        clearTimeout(popoverTimeoutRef.current)
                                                        popoverTimeoutRef.current = null
                                                    }
                                                    setHoverSubmenu(keySeccion)
                                                }}
                                                onMouseLeave={() => {
                                                    popoverTimeoutRef.current = setTimeout(() => {
                                                        setHoverSubmenu(null)
                                                    }, 200)
                                                }}
                                            >
                                                <div className={estilos.sidebarPopoverTitulo}>
                                                    <ion-icon name={categoria.icon}></ion-icon>
                                                    <span>{translateLabel(categoria.label)}</span>
                                                </div>
                                                <div className={estilos.sidebarPopoverItems}>
                                                    {categoria.items.map((item) => {
                                                        const esItemActivo = esRutaActiva(item.href)
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                className={`${estilos.sidebarPopoverItem} ${esItemActivo ? estilos.sidebarPopoverItemActivo : ''}`}
                                                            >
                                                                <ion-icon name={item.icon}></ion-icon>
                                                                <span>{translateLabel(item.label)}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className={`${estilos.sidebarItemPrincipal} ${esActivo ? estilos.sidebarItemActivo : ''}`}
                                            onClick={() => categoria.modulo !== 'core' && toggleSeccion(keySeccion)}
                                            disabled={categoria.modulo === 'core'}
                                            title={translateLabel(categoria.label)}
                                        >
                                            <ion-icon name={categoria.icon}></ion-icon>
                                            <span>{translateLabel(categoria.label)}</span>
                                            {categoria.modulo !== 'core' && tieneSubmenu && (
                                                <ion-icon
                                                    name={estaAbierto ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                    className={estilos.sidebarChevron}
                                                ></ion-icon>
                                            )}
                                        </button>

                                        {estaAbierto && tieneSubmenu && (
                                            <div className={estilos.sidebarSubmenu}>
                                                {categoria.items.map((item) => {
                                                    const esItemActivo = esRutaActiva(item.href)
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            className={`${estilos.sidebarSubmenuItem} ${esItemActivo ? estilos.sidebarSubmenuItemActivo : ''}`}
                                                        >
                                                            <span>{translateLabel(item.label)}</span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </nav>

                    <div className={estilos.sidebarFooter}>
                        <button 
                            className={estilos.sidebarTemaBtn}
                            onClick={toggleTema}
                            title={sidebarColapsado ? (tema === 'light' ? t('header.darkMode') : t('header.lightMode')) : (tema === 'light' ? t('header.darkMode') : t('header.lightMode'))}
                            aria-label={tema === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
                            disabled={cargando}
                        >
                            <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                            {!sidebarColapsado && (
                                <span>{tema === 'light' ? t('header.darkMode') : t('header.lightMode')}</span>
                            )}
                        </button>

                        {datosUsuario?.offline_habilitado && offlinePreparado && (
                            <button
                                className={estilos.sidebarTemaBtn}
                                onClick={sincronizar}
                                disabled={sincronizando}
                                style={{ color: !online ? '#f97316' : '#10b981' }}
                                title={
                                    sincronizando
                                        ? (language === 'en' ? 'Syncing...' : 'Sincronizando...')
                                        : !online
                                            ? (language === 'en' ? 'Offline' : 'Sin conexión')
                                            : (language === 'en' ? 'Sync' : 'Sincronizar')
                                }
                            >
                                <ion-icon
                                    name={
                                        sincronizando
                                            ? 'sync-outline'
                                            : !online
                                                ? 'cloud-offline-outline'
                                                : 'cloud-done-outline'
                                    }
                                    className={sincronizando ? estilos.iconoGirando : ''}
                                ></ion-icon>
                                {!sidebarColapsado && (
                                    <span>{
                                        sincronizando
                                            ? (language === 'en' ? 'Syncing...' : 'Sincronizando...')
                                            : !online
                                                ? (language === 'en' ? 'Offline' : 'Sin conexión')
                                                : (language === 'en' ? 'Sync' : 'Sincronizar')
                                    }</span>
                                )}
                            </button>
                        )}

                        {datosUsuario?.offline_habilitado && offlinePreparado && (
                            <button
                                className={estilos.sidebarTemaBtn}
                                onClick={exportarBD}
                                disabled={sincronizando}
                                style={{ color: '#f97316' }}
                                title={language === 'en' ? 'Export database (JSON)' : 'Exportar base de datos (JSON)'}
                            >
                                <ion-icon name="download-outline"></ion-icon>
                                {!sidebarColapsado && (
                                    <span>{language === 'en' ? 'Export DB' : 'Exportar BD'}</span>
                                )}
                            </button>
                        )}

                        {datosUsuario && (
                            <Link 
                                href={rutaPerfil} 
                                className={estilos.sidebarUsuario}
                                title={sidebarColapsado ? `${datosUsuario?.nombre} - ${obtenerTipoUsuario()}` : ''}
                            >
                                {datosUsuario?.avatar_url ? (
                                    <img
                                        src={datosUsuario.avatar_url}
                                        alt={datosUsuario.nombre}
                                        className={estilos.sidebarUsuarioAvatar}
                                    />
                                ) : (
                                    <div className={estilos.sidebarUsuarioAvatarDefault}>
                                        <ion-icon name="person-outline"></ion-icon>
                                    </div>
                                )}
                                {!sidebarColapsado && (
                                    <div className={estilos.sidebarUsuarioInfo}>
                                        <span className={estilos.sidebarUsuarioNombre}>{datosUsuario?.nombre || (language === 'en' ? 'User' : 'Usuario')}</span>
                                        <span className={estilos.sidebarUsuarioRol}>{obtenerTipoUsuario() || (language === 'en' ? 'Admin' : 'Admin')}</span>
                                    </div>
                                )}
                            </Link>
                        )}
                    </div>
                </aside>

            {menuAbierto && (
                <>
                    <div
                        className={estilos.overlay}
                        onClick={cerrarMenu}
                    ></div>

                    <div className={`${estilos.menuLateral} ${estilos[tema]}`}>
                        <button
                            className={estilos.botonCerrar}
                            onClick={cerrarMenu}
                            aria-label={t('header.closeMenu')}
                        >
                            <ion-icon name="close-outline"></ion-icon>
                        </button>

                        <div className={estilos.menuContenido}>
                            <div className={estilos.menuHeader}>
                                <div className={estilos.menuEmpresa}>
                                    {datosEmpresa?.logo_url ? (
                                        <img
                                            src={datosEmpresa.logo_url}
                                            alt={datosEmpresa.nombre_empresa}
                                            className={estilos.menuLogoEmpresa}
                                        />
                                    ) : (
                                        <div className={estilos.menuLogoDefault}>
                                            <ion-icon name="business-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuEmpresaInfo}>
                                        <span className={estilos.menuEmpresaNombre}>{datosEmpresa?.nombre_empresa}</span>
                                        <span className={estilos.menuEmpresaRnc}>RNC: {datosEmpresa?.rnc}</span>
                                    </div>
                                </div>

                                <div className={estilos.menuUsuario}>
                                    {datosUsuario?.avatar_url ? (
                                        <img
                                            src={datosUsuario.avatar_url}
                                            alt={datosUsuario.nombre}
                                            className={estilos.menuAvatar}
                                        />
                                    ) : (
                                        <div className={estilos.menuAvatarDefault}>
                                            <ion-icon name="person-outline"></ion-icon>
                                        </div>
                                    )}
                                    <div className={estilos.menuUsuarioInfo}>
                                        <span className={estilos.menuUsuarioNombre}>{datosUsuario?.nombre}</span>
                                        <span className={estilos.menuUsuarioTipo}>{obtenerTipoUsuario()}</span>
                                    </div>
                                </div>
                            </div>

                            <nav className={estilos.menuNav}>
                                {accionesDiarias.length > 0 && (
                                    <div className={estilos.menuSeccion}>
                                        <span className={estilos.menuSeccionTitulo}>
                                            <ion-icon name="flash-outline"></ion-icon>
                                            {t('header.acciones')}
                                        </span>
                                        {accionesDiarias.map((item) => {
                                            const esActivo = esRutaActiva(item.href)
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`}
                                                    onClick={cerrarMenu}
                                                >
                                                    <ion-icon name={item.icon}></ion-icon>
                                                    <span>{translateLabel(item.label)}</span>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}

                                {categoriasNavegacion.map((categoria, index) => {
                                    const keySeccion = categoria.uniqueKey || `${categoria.modulo}-${index}`
                                    const estaAbierto = categoria.modulo === 'core' || seccionesAbiertas[keySeccion] !== false

                                    return (
                                        <div key={keySeccion} className={estilos.menuSeccion}>
                                            <button
                                                className={estilos.menuSeccionTituloBtn}
                                                onClick={() => categoria.modulo !== 'core' && toggleSeccion(keySeccion)}
                                                disabled={categoria.modulo === 'core'}
                                            >
                                                <ion-icon name={categoria.icon}></ion-icon>
                                                <span>{translateLabel(categoria.label)}</span>
                                                {categoria.modulo !== 'core' && (
                                                    <ion-icon
                                                        name={estaAbierto ? 'chevron-up-outline' : 'chevron-down-outline'}
                                                        className={estilos.chevronSeccion}
                                                    ></ion-icon>
                                                )}
                                            </button>

                                            {estaAbierto && (
                                                <div className={estilos.menuSeccionItems}>
                                                    {categoria.items.map((item) => {
                                                        const esActivo = esRutaActiva(item.href)
                                                        return (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                className={`${estilos.menuItem} ${esActivo ? estilos.activo : ''}`}
                                                                onClick={cerrarMenu}
                                                            >
                                                                <ion-icon name={item.icon}></ion-icon>
                                                                <span>{translateLabel(item.label)}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </nav>

                            <div className={estilos.menuFooter}>
                                <button className={estilos.menuItemPerfil} onClick={toggleTema}>
                                    <ion-icon name={tema === 'light' ? 'moon-outline' : 'sunny-outline'}></ion-icon>
                                    <span>{tema === 'light' ? t('header.darkMode') : t('header.lightMode')}</span>
                                </button>
                                <button className={estilos.menuItemPerfil} onClick={toggleLanguage}>
                                    <ion-icon name="language-outline"></ion-icon>
                                    <span>{language === 'es' ? 'English' : 'Español'}</span>
                                </button>
                                <button className={estilos.menuItemSalir} onClick={manejarCerrarSesion}>
                                    <ion-icon name="log-out-outline"></ion-icon>
                                    <span>{t('header.logout')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
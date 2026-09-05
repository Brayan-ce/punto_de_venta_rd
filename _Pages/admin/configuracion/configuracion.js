"use client"
import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
    obtenerConfiguracion, 
    actualizarEmpresa,
    obtenerMonedas,
    obtenerPaises,
    obtenerRegiones,
    obtenerMonedasPorPais,
    crearMoneda,
    actualizarMoneda,
    eliminarMoneda,
    obtenerUnidadesMedida,
    crearUnidadMedida,
    actualizarUnidadMedida,
    eliminarUnidadMedida,
    eliminarUnidadesMedida,
    obtenerConversiones,
    crearConversion,
    actualizarConversion,
    eliminarConversion,
    subirImagenEmpresa,
    obtenerOtpEstado,
    actualizarOtpEstado,
    obtenerOfflineEstado,
    actualizarOfflineEstado,
    confirmarOfflineDescargado,
    subirBaseDatos,
    obtenerNotificacionesConfig,
    actualizarNotificacionesConfig
} from './servidor'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './configuracion.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'
import { getOfflineManager } from '@/lib/offline/OfflineManager'
import { NAVIGATION_CATALOG } from '@/lib/navigation/catalogo'

const IMPUESTOS_PERMITIDOS = ['ITBIS', 'IVA', 'SALES TAX', 'GST', 'ISC']

export default function ConfiguracionAdmin() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [tema, setTema] = useState('light')
    const [cargando, setCargando] = useState(true)
    const [procesando, setProcesando] = useState(false)
    const [tabActiva, setTabActiva] = useState(searchParams.get('tab') || 'general')
    
    const [datosEmpresa, setDatosEmpresa] = useState({
        nombre_empresa: '',
        rnc: '',
        razon_social: '',
        nombre_comercial: '',
        actividad_economica: '',
        direccion: '',
        sector: '',
        municipio: '',
        provincia: '',
        pais_id: '',
        region_id: '',
        telefono: '',
        email: '',
        moneda: 'DOP',
        simbolo_moneda: 'RD$',
        locale: '',
        impuesto_nombre: 'ITBIS',
        impuesto_porcentaje: 0.00,
        mensaje_factura: '',
        logo_url: ''
    })
    const [archivoLogo, setArchivoLogo] = useState(null)
    const [previsualizacionLogo, setPrevisualizacionLogo] = useState('')
    const [mostrarModalRecorte, setMostrarModalRecorte] = useState(false)
    const [imagenParaRecortar, setImagenParaRecortar] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

    const [monedas, setMonedas] = useState([])
    const [monedasPais, setMonedasPais] = useState([])
    const [paises, setPaises] = useState([])
    const [regiones, setRegiones] = useState([])
    const [unidadesMedida, setUnidadesMedida] = useState([])
    const [conversiones, setConversiones] = useState([])
    const [otpHabilitado, setOtpHabilitado] = useState(false)
    const [procesandoOtp, setProcesandoOtp] = useState(false)
    const [offlineHabilitado, setOfflineHabilitado] = useState(false)
    const [procesandoOffline, setProcesandoOffline] = useState(false)
    const [notifConfig, setNotifConfig] = useState({ notif_mostrar_proximas: true, notif_mostrar_vencidas: true, notif_mostrar_alertas: true, notif_proximas_dias: 7 })
    const [procesandoNotif, setProcesandoNotif] = useState(false)
    const [offlinePreparado, setOfflinePreparado] = useState(false)
    const [offlineCargando, setOfflineCargando] = useState(false)
    const [offlineConfirmado, setOfflineConfirmado] = useState(false)
    const [procesandoConfirmar, setProcesandoConfirmar] = useState(false)
    const [empresaBloqueada, setEmpresaBloqueada] = useState(false)
    const [bdSubida, setBdSubida] = useState(false)
    const [archivoBD, setArchivoBD] = useState(null)
    const [subiendoBD, setSubiendoBD] = useState(false)
    // Selección múltiple de unidades
    const [seleccionUnidades, setSeleccionUnidades] = useState([])
        // Manejar selección de una unidad
        const toggleSeleccionUnidad = (id) => {
            setSeleccionUnidades(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
        };

        // Seleccionar todas
        const seleccionarTodasUnidades = () => {
            if (seleccionUnidades.length === unidadesMedida.length) {
                setSeleccionUnidades([]);
            } else {
                setSeleccionUnidades(unidadesMedida.map(u => u.id));
            }
        };

        // Eliminar en grupo
        const eliminarUnidadesGrupo = async () => {
            if (seleccionUnidades.length === 0) return;
            if (!confirm(language === 'en' ? `Delete ${seleccionUnidades.length} selected units?` : `¿Eliminar ${seleccionUnidades.length} unidades seleccionadas?`)) return;
            setProcesando(true);
            try {
                const resultado = await eliminarUnidadesMedida(seleccionUnidades);
                if (resultado.success) {
                    alert(resultado.mensaje);
                    setSeleccionUnidades([]);
                    await cargarDatos();
                } else {
                    alert(resultado.mensaje);
                }
            } catch (error) {
                console.error('Error al eliminar grupo:', error);
                alert(tr('Error al eliminar unidades', 'Error deleting units'));
            } finally {
                setProcesando(false);
            }
        };
    const [modalMoneda, setModalMoneda] = useState(false)
    const [modalUnidad, setModalUnidad] = useState(false)
    const [modalConversion, setModalConversion] = useState(false)
    const [editandoMoneda, setEditandoMoneda] = useState(null)
    const [editandoUnidad, setEditandoUnidad] = useState(null)
    const [editandoConversion, setEditandoConversion] = useState(null)

    const [formMoneda, setFormMoneda] = useState({
        codigo: '',
        nombre: '',
        simbolo: '',
        activo: true
    })

    const [formUnidad, setFormUnidad] = useState({
        codigo: '',
        nombre: '',
        abreviatura: '',
        activo: true
    })

    const [formConversion, setFormConversion] = useState({
        unidad_origen_id: '',
        unidad_destino_id: '',
        factor: '',
        activo: true
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
    }, [])

    const cargarRegionesYMonedas = async (paisId) => {
        const [resultadoRegiones, resultadoMonedasPais] = await Promise.all([
            obtenerRegiones(paisId),
            obtenerMonedasPorPais(paisId)
        ])

        if (resultadoRegiones.success) {
            setRegiones(resultadoRegiones.regiones || [])
        }

        if (resultadoMonedasPais.success) {
            setMonedasPais(resultadoMonedasPais.monedas || [])
        }
    }

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [resultadoConfig, resultadoMonedas, resultadoUnidades, resultadoPaises, resultadoConversiones, resultadoOtp, resultadoOffline, resultadoNotif] = await Promise.all([
                obtenerConfiguracion(),
                obtenerMonedas(),
                obtenerUnidadesMedida(),
                obtenerPaises(),
                obtenerConversiones(),
                obtenerOtpEstado(),
                obtenerOfflineEstado(),
                obtenerNotificacionesConfig()
            ])

            if (resultadoPaises.success) {
                setPaises(resultadoPaises.paises)
            }

            if (resultadoConfig.success) {
                const paisesDisponibles = resultadoPaises.success ? resultadoPaises.paises : []
                const paisDefault = paisesDisponibles.find(p => p.codigo_iso2 === 'DO') || paisesDisponibles[0]
                const paisIdInicial = resultadoConfig.empresa.pais_id || paisDefault?.id || ''
                const localeInicial = resultadoConfig.empresa.locale || paisDefault?.locale_default || 'es-DO'
                setDatosEmpresa({
                    nombre_empresa: resultadoConfig.empresa.nombre_empresa || '',
                    rnc: resultadoConfig.empresa.rnc || '',
                    razon_social: resultadoConfig.empresa.razon_social || '',
                    nombre_comercial: resultadoConfig.empresa.nombre_comercial || '',
                    actividad_economica: resultadoConfig.empresa.actividad_economica || '',
                    direccion: resultadoConfig.empresa.direccion || '',
                    sector: resultadoConfig.empresa.sector || '',
                    municipio: resultadoConfig.empresa.municipio || '',
                    provincia: resultadoConfig.empresa.provincia || '',
                    pais_id: paisIdInicial,
                    region_id: resultadoConfig.empresa.region_id || '',
                    telefono: resultadoConfig.empresa.telefono || '',
                    email: resultadoConfig.empresa.email || '',
                    moneda: resultadoConfig.empresa.moneda || paisDefault?.moneda_principal_codigo || 'DOP',
                    simbolo_moneda: resultadoConfig.empresa.simbolo_moneda || 'RD$',
                    locale: localeInicial,
                    impuesto_nombre: IMPUESTOS_PERMITIDOS.includes(String(resultadoConfig.empresa.impuesto_nombre || '').trim().toUpperCase())
                        ? String(resultadoConfig.empresa.impuesto_nombre).trim().toUpperCase()
                        : 'ITBIS',
                    impuesto_porcentaje: resultadoConfig.empresa.impuesto_porcentaje !== undefined && resultadoConfig.empresa.impuesto_porcentaje !== null ? resultadoConfig.empresa.impuesto_porcentaje : 0.00,
                    mensaje_factura: resultadoConfig.empresa.mensaje_factura || '',
                    logo_url: resultadoConfig.empresa.logo_url || ''
                })
                setPrevisualizacionLogo(resultadoConfig.empresa.logo_url || '')

                if (paisIdInicial) {
                    await cargarRegionesYMonedas(paisIdInicial)
                }
            }

            if (resultadoMonedas.success) {
                const monedasUnicas = resultadoMonedas.monedas.reduce((acc, moneda) => {
                    if (!acc.find(m => m.codigo === moneda.codigo)) {
                        acc.push(moneda)
                    }
                    return acc
                }, [])
                setMonedas(monedasUnicas)
            }

            if (resultadoUnidades.success) {
                setUnidadesMedida(resultadoUnidades.unidades || [])
            }

            if (resultadoConversiones && resultadoConversiones.success) {
                setConversiones(resultadoConversiones.conversiones || [])
            }

            if (resultadoOtp.success) {
                setOtpHabilitado(resultadoOtp.otp_habilitado)
            }

            if (resultadoOffline.success) {
                setOfflineHabilitado(resultadoOffline.offline_habilitado)
                setEmpresaBloqueada(resultadoOffline.empresa_bloqueada || false)
                setOfflineConfirmado(resultadoOffline.offline_confirmado || false)
            }

            if (resultadoNotif.success && resultadoNotif.config) {
                setNotifConfig(resultadoNotif.config)
            }
        } catch (error) {
            console.error('Error al cargar datos:', error)
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        const mgr = getOfflineManager()
        if (!mgr) return
        mgr.estaPreparado().then(setOfflinePreparado)
        mgr.getMetadata('bd_subida').then((v) => setBdSubida(v === 'true'))
    }, [])

    const [progresoOffline, setProgresoOffline] = useState({ visible: false, porcentaje: 0, mensaje: '' })

    useEffect(() => {
        if (!progresoOffline.visible && offlineCargando === false) return
    }, [progresoOffline.visible, offlineCargando])

    async function cachearChunksDePagina(url, chunkCache, pageCache) {
        try {
            const res = await fetch(url)
            if (!res.ok) return
            await pageCache.put(url, res.clone())
            const html = await res.text()
            const chunkMatches = html.matchAll(/[;"'](\/_next\/static\/[^"']+\.(?:js|css))[;"']/g)
            const chunkSet = new Set()
            for (const m of chunkMatches) chunkSet.add(m[1])
            for (const cu of chunkSet) {
                try {
                    const cr = await fetch(cu)
                    if (cr.ok) await chunkCache.put(cu, cr)
                } catch (_) {}
            }
        } catch (_) {}
    }

    const prepararOffline = async () => {
        setProgresoOffline({ visible: true, porcentaje: 0, mensaje: 'Descargando datos del servidor...' })
        try {
            const { obtenerDatosOffline } = await import('@/lib/offline/offlineServidor')
            const res = await obtenerDatosOffline()
            if (!res.success) {
                setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
                alert(res.mensaje)
                return
            }
            setProgresoOffline((p) => ({ ...p, porcentaje: 15, mensaje: 'Guardando en base de datos local...' }))
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
            }
            setProgresoOffline((p) => ({ ...p, porcentaje: 25, mensaje: 'Guardando archivos de la pagina actual...' }))
            if ('caches' in window) {
                const chunkCache = await caches.open('pv-chunks-v6')
                const pageCache = await caches.open('pv-pages-v6')
                const urlsParaCachear = new Set()
                document.querySelectorAll('script[src], link[rel=stylesheet][href]').forEach((el) => {
                    const url = el.src || el.href
                    if (url && url.includes('/_next/static/')) urlsParaCachear.add(url)
                })
                urlsParaCachear.add('/sw.js')
                urlsParaCachear.add('/manifest.json')
                urlsParaCachear.add('/logo-pwa.png')
                const chunkUrls = [...urlsParaCachear]
                let completados = 0
                await Promise.allSettled(
                    chunkUrls.map(async (url) => {
                        try {
                            const resChunk = await fetch(url)
                            if (resChunk.ok) await chunkCache.put(url, resChunk)
                        } catch (_) {}
                        completados++
                        setProgresoOffline((p) => ({ ...p, porcentaje: 25 + (completados / chunkUrls.length) * 10 }))
                    })
                )

                const todasLasUrls = new Set([
                    '/', '/login', '/admin', '/vendedor',
                    '/admin/ventas/nueva', '/admin/ventas', '/admin/productos',
                    '/admin/clientes', '/admin/dashboard', '/admin/inventario',
                    '/admin/compras', '/admin/proveedores', '/admin/cotizaciones',
                    '/admin/conduces', '/admin/categorias', '/admin/marcas',
                    '/admin/cajas', '/admin/gastos', '/admin/reportes',
                    '/admin/usuarios', '/admin/configuracion',
                    '/admin/financiamiento', '/admin/contratos', '/admin/cuotas',
                    '/admin/pagos', '/admin/alertas', '/admin/planes',
                    '/admin/financiamiento/clientes',
                    '/admin/depuracion',
                    '/admin/catalogo/pedidos', '/admin/catalogo', '/admin/tienda-isiweek',
                    '/admin/manejo-simple', '/admin/manejo-simple/obras',
                    '/admin/manejo-simple/trabajadores', '/admin/manejo-simple/asistencia',
                    '/admin/manejo-simple/gastos', '/admin/manejo-simple/reportes',
                ])
                Object.values(NAVIGATION_CATALOG).forEach((cat) => {
                    cat.items.forEach((item) => {
                        if (item.href) todasLasUrls.add(item.href)
                    })
                })
                const todasLasUrlsArr = [...todasLasUrls]
                let procesadas = 0
                const total = todasLasUrlsArr.length
                const progresoInicial = 35
                const rangoProgreso = 60
                for (const url of todasLasUrlsArr) {
                    await cachearChunksDePagina(url, chunkCache, pageCache)
                    procesadas++
                    const pct = progresoInicial + (procesadas / total) * rangoProgreso
                    setProgresoOffline({
                        visible: true,
                        porcentaje: Math.min(pct, 99),
                        mensaje: `Cacheando pagina ${procesadas}/${total}: ${url}`
                    })
                }
            }
            setProgresoOffline({ visible: true, porcentaje: 96, mensaje: 'Generando archivo JSON...' })
            const datosJson = {
                version: 3,
                exportado: new Date().toISOString(),
                empresa_id: res.empresa_id,
                usuario: res.usuario || null,
                empresa: res.empresa || null,
                errores_descarga: res.errores_descarga || [],
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
            setProgresoOffline({ visible: true, porcentaje: 100, mensaje: 'Descarga completada' })
            setOfflinePreparado(true)
            alert(tr('Datos descargados. Se descargo el archivo JSON con toda la base de datos de la empresa. Llevalo al dispositivo que trabajara offline (la app movil) y subelo ahi cuando termines.', 'Data downloaded. The JSON file with all the company database was downloaded. Take it to the device that will work offline (the mobile app) and upload it there when you are done.'))
            setTimeout(() => setProgresoOffline((p) => ({ ...p, visible: false })), 2000)
        } catch (error) {
            console.error('Error al preparar offline:', error)
            setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
            alert(tr('Error al descargar datos', 'Error downloading data'))
        }
    }

    const toggleOffline = async () => {
        setProcesandoOffline(true)
        try {
            const nuevoEstado = !offlineHabilitado
            if (!nuevoEstado && !bdSubida && offlineConfirmado) {
                alert(tr('Para desactivar el modo offline primero debes subir la base de datos modificada en el campo de abajo.', 'To disable offline mode you must first upload the modified database in the field below.'))
                setProcesandoOffline(false)
                return
            }
            const resultado = await actualizarOfflineEstado(nuevoEstado)
            if (resultado.success) {
                setOfflineHabilitado(nuevoEstado)
                if (nuevoEstado) {
                    setOfflineConfirmado(false)
                    setEmpresaBloqueada(false)
                    alert(tr('Modo offline activado. Ahora debes descargar los datos y presionar "Confirmar descargado" para dejar la empresa en modo offline total.', 'Offline mode activated. Now you must download the data and press "Confirm downloaded" to leave the company in full offline mode.'))
                } else {
                    setOfflineConfirmado(false)
                    setEmpresaBloqueada(false)
                    const mgr = getOfflineManager()
                    if (mgr) {
                        mgr.limpiar()
                        mgr.guardarMetadata('bd_subida', 'false')
                    }
                    setOfflinePreparado(false)
                    setBdSubida(false)
                    setArchivoBD(null)
                    alert(resultado.mensaje)
                }
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cambiar modo offline:', error)
            alert(tr('Error al cambiar modo offline', 'Error changing offline mode'))
        } finally {
            setProcesandoOffline(false)
        }
    }

    const descargarBD = async () => {
        setProcesandoOffline(true)
        setProgresoOffline({ visible: true, porcentaje: 5, mensaje: tr('Conectando con el servidor...', 'Connecting to the server...') })
        try {
            const { obtenerDatosOffline } = await import('@/lib/offline/offlineServidor')
            const res = await obtenerDatosOffline()
            if (!res.success) {
                setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
                alert(res.mensaje)
                return
            }
            setProgresoOffline({ visible: true, porcentaje: 40, mensaje: tr('Datos descargados, generando archivo...', 'Data downloaded, generating file...') })
            const datosJson = {
                version: 3,
                exportado: new Date().toISOString(),
                empresa_id: res.empresa_id,
                usuario: res.usuario || null,
                empresa: res.empresa || null,
                errores_descarga: res.errores_descarga || [],
                tablas: res.tablas || {},
            }
            setProgresoOffline({ visible: true, porcentaje: 70, mensaje: tr('Comprimiendo base de datos...', 'Compressing database...') })
            const blob = new Blob([JSON.stringify(datosJson)], { type: 'application/json' })
            setProgresoOffline({ visible: true, porcentaje: 90, mensaje: tr('Iniciando descarga...', 'Starting download...') })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `base_datos_offline_${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            setProgresoOffline({ visible: true, porcentaje: 100, mensaje: tr('Completado', 'Complete') })
            alert(tr('Base de datos descargada. Llevala al dispositivo que trabajara offline.', 'Database downloaded. Take it to the device that will work offline.'))
            setTimeout(() => setProgresoOffline((p) => ({ ...p, visible: false })), 2000)
        } catch (error) {
            console.error('Error al descargar base de datos:', error)
            setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
            alert(tr('Error al descargar la base de datos', 'Error downloading the database'))
        } finally {
            setProcesandoOffline(false)
        }
    }

    const confirmarDescarga = async () => {
        setProcesandoConfirmar(true)
        try {
            const resultado = await confirmarOfflineDescargado()
            if (resultado.success) {
                setOfflineConfirmado(true)
                setEmpresaBloqueada(true)
                setOfflinePreparado(true)
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al confirmar descarga:', error)
            alert(tr('Error al confirmar la descarga', 'Error confirming the download'))
        } finally {
            setProcesandoConfirmar(false)
        }
    }

    const desactivarOffline = async () => {
        setProcesandoOffline(true)
        try {
            const resultado = await actualizarOfflineEstado(false)
            if (resultado.success) {
                setOfflineHabilitado(false)
                setEmpresaBloqueada(false)
                setOfflineConfirmado(false)
                const mgr = getOfflineManager()
                if (mgr) {
                    mgr.limpiar()
                    mgr.guardarMetadata('bd_subida', 'false')
                }
                setOfflinePreparado(false)
                setBdSubida(false)
                setArchivoBD(null)
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al desactivar offline:', error)
            alert(tr('Error al desactivar modo offline', 'Error disabling offline mode'))
        } finally {
            setProcesandoOffline(false)
        }
    }

    const subirBase = async () => {
        if (!archivoBD) {
            alert(tr('Selecciona primero el archivo de base de datos exportado.', 'Select the exported database file first.'))
            return
        }
        setSubiendoBD(true)
        setProgresoOffline({ visible: true, porcentaje: 5, mensaje: tr('Leyendo archivo JSON...', 'Reading JSON file...') })
        try {
            const texto = await archivoBD.text()
            const datos = JSON.parse(texto)
            setProgresoOffline({ visible: true, porcentaje: 15, mensaje: tr('Conectando con el servidor...', 'Connecting to the server...') })
            const resultado = await subirBaseDatos(datos)
            if (resultado.success) {
                setProgresoOffline({ visible: true, porcentaje: 90, mensaje: tr('Base de datos subida, guardando estado...', 'Database uploaded, saving state...') })
                setBdSubida(true)
                setOfflineConfirmado(false)
                const mgr = getOfflineManager()
                if (mgr) mgr.guardarMetadata('bd_subida', 'true')
                setProgresoOffline({ visible: true, porcentaje: 100, mensaje: tr('Completado', 'Complete') })
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al subir base de datos:', error)
            setProgresoOffline({ visible: false, porcentaje: 0, mensaje: '' })
            alert(tr('El archivo no es válido. Verifica que sea el JSON exportado desde el dispositivo offline.', 'The file is not valid. Make sure it is the JSON exported from the offline device.'))
        } finally {
            setSubiendoBD(false)
            setTimeout(() => setProgresoOffline((p) => ({ ...p, visible: false })), 2000)
        }
    }

    const manejarCambio = (e) => {
        const { name, value } = e.target
        setDatosEmpresa(prev => ({
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

    const manejarCambioMoneda = (e) => {
        const monedasDisponibles = monedasPais.length > 0 ? monedasPais : monedas
        const monedaSeleccionada = monedasDisponibles.find(m => m.codigo === e.target.value)
        if (!monedaSeleccionada) return
        setDatosEmpresa(prev => ({
            ...prev,
            moneda: monedaSeleccionada.codigo,
            simbolo_moneda: monedaSeleccionada.simbolo
        }))
    }

    const manejarCambioPais = async (e) => {
        const paisId = e.target.value
        const paisSeleccionado = paises.find(p => p.id === parseInt(paisId))
        setDatosEmpresa(prev => ({
            ...prev,
            pais_id: paisId,
            region_id: '',
            provincia: '',
            locale: paisSeleccionado?.locale_default || prev.locale
        }))

        if (!paisId) {
            setRegiones([])
            setMonedasPais([])
            return
        }

        const [resultadoRegiones, resultadoMonedasPais] = await Promise.all([
            obtenerRegiones(paisId),
            obtenerMonedasPorPais(paisId)
        ])

        if (resultadoRegiones.success) {
            setRegiones(resultadoRegiones.regiones || [])
        }

        if (resultadoMonedasPais.success) {
            const monedasPaisData = resultadoMonedasPais.monedas || []
            setMonedasPais(monedasPaisData)
            const monedaPrincipal = monedasPaisData.find(mon => mon.es_principal) || monedasPaisData[0]
            if (monedaPrincipal) {
                setDatosEmpresa(prev => ({
                    ...prev,
                    moneda: monedaPrincipal.codigo,
                    simbolo_moneda: monedaPrincipal.simbolo
                }))
            }
        }
    }

    const manejarCambioRegion = (e) => {
        const regionId = e.target.value
        const regionSeleccionada = regiones.find(r => r.id === parseInt(regionId))
        setDatosEmpresa(prev => ({
            ...prev,
            region_id: regionId,
            provincia: regionSeleccionada?.nombre || ''
        }))
    }

    const abrirModalMoneda = (moneda = null) => {
        if (moneda) {
            setFormMoneda({
                codigo: moneda.codigo,
                nombre: moneda.nombre,
                simbolo: moneda.simbolo,
                activo: moneda.activo
            })
            setEditandoMoneda(moneda.id)
        } else {
            setFormMoneda({
                codigo: '',
                nombre: '',
                simbolo: '',
                activo: true
            })
            setEditandoMoneda(null)
        }
        setModalMoneda(true)
    }

    const abrirModalUnidad = (unidad = null) => {
        if (unidad) {
            setFormUnidad({
                codigo: unidad.codigo,
                nombre: unidad.nombre,
                abreviatura: unidad.abreviatura,
                activo: unidad.activo
            })
            setEditandoUnidad(unidad.id)
        } else {
            setFormUnidad({
                codigo: '',
                nombre: '',
                abreviatura: '',
                activo: true
            })
            setEditandoUnidad(null)
        }
        setModalUnidad(true)
    }

    const guardarMoneda = async () => {
        setProcesando(true)
        try {
            let resultado
            if (editandoMoneda) {
                resultado = await actualizarMoneda(editandoMoneda, formMoneda)
            } else {
                resultado = await crearMoneda(formMoneda)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                setModalMoneda(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al guardar', 'Error saving'))
        } finally {
            setProcesando(false)
        }
    }

    const guardarUnidad = async () => {
        setProcesando(true)
        try {
            let resultado
            if (editandoUnidad) {
                resultado = await actualizarUnidadMedida(editandoUnidad, formUnidad)
            } else {
                resultado = await crearUnidadMedida(formUnidad)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                setModalUnidad(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al guardar', 'Error saving'))
        } finally {
            setProcesando(false)
        }
    }

    const eliminarMonedaHandler = async (id, nombre) => {
        if (!confirm(language === 'en' ? `Delete currency ${nombre}?` : `¿Eliminar moneda ${nombre}?`)) return

        setProcesando(true)
        try {
            const resultado = await eliminarMoneda(id)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al eliminar', 'Error deleting'))
        } finally {
            setProcesando(false)
        }
    }

    const eliminarUnidadHandler = async (id, nombre) => {
        if (!confirm(language === 'en' ? `Delete unit ${nombre}?` : `¿Eliminar unidad ${nombre}?`)) return

        setProcesando(true)
        try {
            const resultado = await eliminarUnidadMedida(id)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al eliminar', 'Error deleting'))
        } finally {
            setProcesando(false)
        }
    }

    // Funciones para conversiones
    const abrirModalConversion = (conversion = null) => {
        if (conversion) {
            setFormConversion({
                unidad_origen_id: conversion.unidad_origen_id,
                unidad_destino_id: conversion.unidad_destino_id,
                factor: conversion.factor,
                activo: conversion.activo
            })
            setEditandoConversion(conversion.id)
        } else {
            setFormConversion({
                unidad_origen_id: '',
                unidad_destino_id: '',
                factor: '',
                activo: true
            })
            setEditandoConversion(null)
        }
        setModalConversion(true)
    }

    const guardarConversion = async () => {
        if (!formConversion.unidad_origen_id || !formConversion.unidad_destino_id || !formConversion.factor) {
            alert(tr('Complete todos los campos', 'Complete all fields'))
            return
        }

        if (formConversion.unidad_origen_id === formConversion.unidad_destino_id) {
            alert(tr('Las unidades origen y destino no pueden ser iguales', 'Source and target units cannot be the same'))
            return
        }

        setProcesando(true)
        try {
            let resultado
            if (editandoConversion) {
                resultado = await actualizarConversion(editandoConversion, formConversion)
            } else {
                resultado = await crearConversion(formConversion)
            }

            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
                setModalConversion(false)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al guardar', 'Error saving'))
        } finally {
            setProcesando(false)
        }
    }

    const eliminarConversionHandler = async (id) => {
        if (!confirm(language === 'en' ? 'Delete this conversion?' : '¿Eliminar esta conversión?')) return

        setProcesando(true)
        try {
            const resultado = await eliminarConversion(id)
            if (resultado.success) {
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al eliminar', 'Error deleting'))
        } finally {
            setProcesando(false)
        }
    }

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image()
            image.addEventListener('load', () => resolve(image))
            image.addEventListener('error', (error) => reject(error))
            image.setAttribute('crossOrigin', 'anonymous')
            image.src = url
        })

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png')
        })
    }

    const aplicarRecorte = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imagenParaRecortar, croppedAreaPixels)
            const archivo = new File([croppedImageBlob], 'logo_recortado.png', { type: 'image/png' })
            setArchivoLogo(archivo)
            setPrevisualizacionLogo(URL.createObjectURL(croppedImageBlob))
            setMostrarModalRecorte(false)
            setImagenParaRecortar(null)
        } catch (error) {
            console.error('Error al recortar imagen:', error)
        }
    }

    const cancelarRecorte = () => {
        setMostrarModalRecorte(false)
        setImagenParaRecortar(null)
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()

        setProcesando(true)
        try {
            let logoUrl = datosEmpresa.logo_url

            if (archivoLogo) {
                const formData = new FormData()
                formData.append('imagen', archivoLogo)
                const resultadoImagen = await subirImagenEmpresa(formData)
                if (resultadoImagen.success) {
                    logoUrl = resultadoImagen.url
                } else {
                    alert(resultadoImagen.mensaje || tr('Error al subir el logo', 'Error uploading logo'))
                    setProcesando(false)
                    return
                }
            }

            const resultado = await actualizarEmpresa({ ...datosEmpresa, logo_url: logoUrl })

            if (resultado.success) {
                setArchivoLogo(null)
                alert(resultado.mensaje)
                await cargarDatos()
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error:', error)
            alert(tr('Error al guardar', 'Error saving'))
        } finally {
            setProcesando(false)
        }
    }

    const toggleOtp = async () => {
        setProcesandoOtp(true)
        try {
            const nuevoEstado = !otpHabilitado
            const resultado = await actualizarOtpEstado(nuevoEstado)
            if (resultado.success) {
                setOtpHabilitado(nuevoEstado)
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje)
            }
        } catch (error) {
            console.error('Error al cambiar OTP:', error)
            alert(tr('Error al cambiar verificación en dos pasos', 'Error changing two-step verification'))
        } finally {
            setProcesandoOtp(false)
        }
    }

    const cambiarNotifConfig = async (campo, valor) => {
        setProcesandoNotif(true)
        try {
            const nuevoConfig = { ...notifConfig, [campo]: valor }
            const resultado = await actualizarNotificacionesConfig(nuevoConfig)
            if (resultado.success) {
                setNotifConfig(resultado.config)
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || tr('Error al actualizar', 'Error updating'))
            }
        } catch (error) {
            console.error('Error al cambiar configuracion de notificaciones:', error)
            alert(tr('Error al actualizar la configuración de notificaciones', 'Error updating notification settings'))
        } finally {
            setProcesandoNotif(false)
        }
    }

    const monedasDisponibles = (monedasPais.length > 0 ? monedasPais : monedas).filter(mon => mon.activo)

    if (cargando) {
        return <LoadingScreen />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Configuracion', 'Settings')}</h1>
                    <p className={estilos.subtitulo}>{tr('Administra la configuracion de tu empresa', 'Manage your company settings')}</p>
                </div>
            </div>

            <div className={estilos.tabs}>
                <button className={`${estilos.tab} ${tabActiva === 'general' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('general')}>
                    <ion-icon name="business-outline"></ion-icon>
                    <span>{tr('General', 'General')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'ubicacion' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('ubicacion')}>
                    <ion-icon name="location-outline"></ion-icon>
                    <span>{tr('Ubicacion', 'Location')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'financiero' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('financiero')}>
                    <ion-icon name="cash-outline"></ion-icon>
                    <span>{tr('Financiero', 'Financial')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'monedas' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('monedas')}>
                    <ion-icon name="logo-usd"></ion-icon>
                    <span>{tr('Monedas', 'Currencies')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'unidades' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('unidades')}>
                    <ion-icon name="scale-outline"></ion-icon>
                    <span>{tr('Unidades', 'Units')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'conversiones' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('conversiones')}>
                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                    <span>{tr('Conversiones', 'Conversions')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'seguridad' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('seguridad')}>
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                    <span>{tr('Seguridad', 'Security')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'notificaciones' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('notificaciones')}>
                    <ion-icon name="notifications-outline"></ion-icon>
                    <span>{tr('Notificaciones', 'Notifications')}</span>
                </button>
                <button className={`${estilos.tab} ${tabActiva === 'offline' ? estilos.tabActiva : ''}`} onClick={() => setTabActiva('offline')}>
                    <ion-icon name="cloud-offline-outline"></ion-icon>
                    <span>{tr('Offline', 'Offline')}</span>
                </button>
            </div>

            {(tabActiva === 'general' || tabActiva === 'ubicacion' || tabActiva === 'financiero') && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <form onSubmit={manejarSubmit} className={estilos.formulario}>
                        {tabActiva === 'general' && (
                            <>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Logo de la Empresa', 'Company Logo')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {previsualizacionLogo ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <img src={previsualizacionLogo} alt="Logo" style={{ height: '90px', maxWidth: '260px', objectFit: 'contain' }} />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <label htmlFor="logoEmpresaInput" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '2px solid #f97316', color: '#f97316', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                                                        <ion-icon name="sync-outline"></ion-icon>
                                                        <span>{tr('Cambiar', 'Change')}</span>
                                                    </label>
                                                    <button type="button" onClick={() => { setArchivoLogo(null); setPrevisualizacionLogo(''); setDatosEmpresa(d => ({ ...d, logo_url: '' })) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '2px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} disabled={procesando}>
                                                        <ion-icon name="trash-outline"></ion-icon>
                                                        <span>{tr('Quitar', 'Remove')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label htmlFor="logoEmpresaInput" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', minHeight: '140px', border: '2px dashed #f97316', borderRadius: '12px', cursor: 'pointer', color: '#f97316', background: 'rgba(249,115,22,0.04)', transition: 'all 0.2s' }}>
                                                <ion-icon name="cloud-upload-outline" style={{ fontSize: '36px' }}></ion-icon>
                                                <span style={{ fontWeight: '700', fontSize: '14px' }}>{tr('Haz clic para subir tu logo', 'Click to upload your logo')}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>PNG, JPG o JPEG — {tr('Máximo 5MB', 'Max 5MB')}</span>
                                            </label>
                                        )}
                                        <input
                                            type="file"
                                            id="logoEmpresaInput"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            disabled={procesando}
                                            onChange={(e) => {
                                                const archivo = e.target.files[0]
                                                if (!archivo) return
                                                if (archivo.size > 5 * 1024 * 1024) { alert(tr('El archivo es muy grande. Máximo 5MB', 'File too large. Max 5MB')); e.target.value = ''; return }
                                                if (!archivo.type.startsWith('image/')) { alert(tr('Solo se permiten imágenes', 'Only images allowed')); e.target.value = ''; return }
                                                const input = e.target
                                                const reader = new FileReader()
                                                reader.onload = (ev) => {
                                                    setImagenParaRecortar(ev.target.result)
                                                    setMostrarModalRecorte(true)
                                                    setCrop({ x: 0, y: 0 })
                                                    setZoom(1)
                                                    input.value = ''
                                                }
                                                reader.readAsDataURL(archivo)
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Nombre de la Empresa *', 'Company Name *')}</label>
                                    <input type="text" name="nombre_empresa" value={datosEmpresa.nombre_empresa} onChange={manejarCambio} disabled={procesando} />
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>RNC *</label>
                                        <input type="text" name="rnc" value={datosEmpresa.rnc} onChange={manejarCambio} disabled={procesando} maxLength="11" />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Razon Social *', 'Business Name *')}</label>
                                        <input type="text" name="razon_social" value={datosEmpresa.razon_social} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Nombre Comercial', 'Trade Name')}</label>
                                        <input type="text" name="nombre_comercial" value={datosEmpresa.nombre_comercial} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Actividad Economica', 'Economic Activity')}</label>
                                        <input type="text" name="actividad_economica" value={datosEmpresa.actividad_economica} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Telefono', 'Phone')}</label>
                                        <input type="tel" name="telefono" value={datosEmpresa.telefono} onChange={manejarCambio} disabled={procesando} maxLength="20" />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>Email</label>
                                        <input type="email" name="email" value={datosEmpresa.email} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                            </>
                        )}

                        {tabActiva === 'ubicacion' && (
                            <>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Direccion *', 'Address *')}</label>
                                    <textarea name="direccion" value={datosEmpresa.direccion} onChange={manejarCambio} rows="3" disabled={procesando} />
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Sector', 'Sector')}</label>
                                        <input type="text" name="sector" value={datosEmpresa.sector} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Municipio', 'City')}</label>
                                        <input type="text" name="municipio" value={datosEmpresa.municipio} onChange={manejarCambio} disabled={procesando} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Pais *', 'Country *')}</label>
                                        <select name="pais_id" value={datosEmpresa.pais_id} onChange={manejarCambioPais} disabled={procesando}>
                                            <option value="">{tr('Seleccionar pais', 'Select country')}</option>
                                            {paises.map(pais => (
                                                <option key={pais.id} value={pais.id}>{pais.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Region / Provincia', 'Region / State')}</label>
                                        {regiones.length > 0 ? (
                                            <select name="region_id" value={datosEmpresa.region_id} onChange={manejarCambioRegion} disabled={procesando}>
                                                <option value="">{tr('Seleccionar region', 'Select region')}</option>
                                                {regiones.map(region => (
                                                    <option key={region.id} value={region.id}>{region.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                name="provincia"
                                                value={datosEmpresa.provincia}
                                                onChange={manejarCambio}
                                                disabled={procesando}
                                                placeholder={tr('Provincia o region', 'State or region')}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {tabActiva === 'financiero' && (
                            <>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Moneda *', 'Currency *')}</label>
                                        <select name="moneda" value={datosEmpresa.moneda} onChange={manejarCambioMoneda} disabled={procesando}>
                                            {monedasDisponibles.map(mon => (
                                                <option key={`moneda-${mon.id}-${mon.codigo}`} value={mon.codigo}>
                                                    {mon.nombre} ({mon.simbolo})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Simbolo de Moneda', 'Currency Symbol')}</label>
                                        <input type="text" name="simbolo_moneda" value={datosEmpresa.simbolo_moneda} disabled className={estilos.inputDisabled} />
                                    </div>
                                </div>
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Nombre del Impuesto', 'Tax Name')}</label>
                                        <select
                                            name="impuesto_nombre"
                                            value={IMPUESTOS_PERMITIDOS.includes(String(datosEmpresa.impuesto_nombre || '').trim().toUpperCase()) ? String(datosEmpresa.impuesto_nombre).trim().toUpperCase() : 'ITBIS'}
                                            onChange={manejarCambio}
                                            disabled={procesando}
                                        >
                                            {IMPUESTOS_PERMITIDOS.map(opcion => (
                                                <option key={opcion} value={opcion}>{opcion}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={estilos.grupoInput}>
                                        <label>{tr('Porcentaje del Impuesto (%)', 'Tax Percentage (%)')}</label>
                                        <input type="number" name="impuesto_porcentaje" value={datosEmpresa.impuesto_porcentaje} onChange={manejarCambio} disabled={procesando} step="0.01" min="0" max="100" />
                                    </div>
                                </div>
                                <div className={estilos.grupoInput}>
                                    <label>{tr('Mensaje en Facturas', 'Invoice Message')}</label>
                                    <textarea name="mensaje_factura" value={datosEmpresa.mensaje_factura} onChange={manejarCambio} rows="4" disabled={procesando} placeholder={tr('Mensaje al pie de facturas', 'Message at the bottom of invoices')} />
                                </div>
                            </>
                        )}

                        <div className={estilos.formularioFooter}>
                            <button type="submit" className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                                <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar Cambios', 'Save Changes')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {tabActiva === 'monedas' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2>{tr('Gestion de Monedas', 'Currency Management')}</h2>
                        <button onClick={() => abrirModalMoneda()} className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>{tr('Nueva Moneda', 'New Currency')}</span>
                        </button>
                    </div>
                    <div className={estilos.grid}>
                        {monedas.map(moneda => (
                            <div key={`card-${moneda.id}`} className={`${estilos.itemCard} ${estilos[tema]}`}>
                                <div className={estilos.itemHeader}>
                                    <div>
                                        <h3>{moneda.nombre}</h3>
                                        <p>{moneda.codigo} - {moneda.simbolo}</p>
                                    </div>
                                    <span className={`${estilos.badge} ${moneda.activo ? estilos.activo : estilos.inactivo}`}>
                                        {moneda.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                                <div className={estilos.itemAcciones}>
                                    <button onClick={() => abrirModalMoneda(moneda)} className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => eliminarMonedaHandler(moneda.id, moneda.nombre)} className={`${estilos.btnIcono} ${estilos.eliminar}`}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tabActiva === 'unidades' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2>{tr('Unidades de Medida', 'Measurement Units')}</h2>
                        <div style={{display:'flex',alignItems:'center'}}>
                            <button onClick={() => abrirModalUnidad()} className={estilos.btnNuevo}>
                                <ion-icon name="add-circle-outline"></ion-icon>
                                <span>{tr('Nueva Unidad', 'New Unit')}</span>
                            </button>
                            <button
                                className={estilos.btnEliminarGrupo}
                                onClick={eliminarUnidadesGrupo}
                                disabled={procesando || seleccionUnidades.length === 0}
                                title={tr('Eliminar seleccionados', 'Delete selected')}
                            >
                                <ion-icon name="trash-outline"></ion-icon>
                                <span>{tr('Eliminar seleccionados', 'Delete selected')}</span>
                            </button>
                        </div>
                    </div>
                    <div style={{marginBottom:'10px'}}>
                        <input
                            type="checkbox"
                            className={estilos.checkboxSeleccion}
                            checked={seleccionUnidades.length === unidadesMedida.length && unidadesMedida.length > 0}
                            onChange={seleccionarTodasUnidades}
                            disabled={unidadesMedida.length === 0}
                            id="checkAllUnidades"
                        />
                        <label htmlFor="checkAllUnidades">{tr('Seleccionar todas', 'Select all')}</label>
                    </div>
                    <div className={estilos.grid}>
                        {unidadesMedida.map(unidad => (
                            <div
                                key={unidad.id}
                                className={
                                    `${estilos.itemCard} ${estilos[tema]} ` +
                                    (seleccionUnidades.includes(unidad.id) ? estilos.itemCardSeleccionada : '')
                                }
                            >
                                <div className={estilos.itemHeader}>
                                    <input
                                        type="checkbox"
                                        className={estilos.checkboxSeleccion}
                                        checked={seleccionUnidades.includes(unidad.id)}
                                        onChange={() => toggleSeleccionUnidad(unidad.id)}
                                        id={`checkUnidad${unidad.id}`}
                                    />
                                    <div>
                                        <h3>{unidad.nombre}</h3>
                                        <p>{unidad.codigo} - {unidad.abreviatura}</p>
                                    </div>
                                    <span className={`${estilos.badge} ${unidad.activo ? estilos.activo : estilos.inactivo}`}>
                                        {unidad.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                                <div className={estilos.itemAcciones}>
                                    <button onClick={() => abrirModalUnidad(unidad)} className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => eliminarUnidadHandler(unidad.id, unidad.nombre)} className={`${estilos.btnIcono} ${estilos.eliminar}`}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tabActiva === 'seguridad' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2><ion-icon name="shield-checkmark-outline" style={{marginRight: 8, verticalAlign: 'middle'}}></ion-icon>{tr('Verificación en Dos Pasos', 'Two-Step Verification')}</h2>
                    </div>
                    <div style={{maxWidth: 600, margin: '0 auto'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 12, border: '2px solid', ...(tema === 'dark' ? {background: '#0f172a', borderColor: '#334155'} : {background: '#f8fafc', borderColor: '#e5e7eb'})}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                                <div style={{fontSize: 32, color: otpHabilitado ? '#10b981' : '#94a3b8'}}>
                                    <ion-icon name={otpHabilitado ? 'shield-checkmark' : 'shield-outline'}></ion-icon>
                                </div>
                                <div>
                                    <div style={{fontWeight: 700, fontSize: 16, marginBottom: 4, color: tema === 'dark' ? '#f1f5f9' : '#0f172a'}}>
                                        {tr('OTP al iniciar sesión', 'OTP on login')}
                                    </div>
                                    <div style={{fontSize: 13, color: tema === 'dark' ? '#94a3b8' : '#64748b', lineHeight: 1.4}}>
                                        {otpHabilitado
                                            ? tr('Los usuarios de esta empresa deberán ingresar un código de 6 dígitos enviado a su correo al iniciar sesión.', 'Users in this company must enter a 6-digit code sent to their email when logging in.')
                                            : tr('Al activar esta opción, los usuarios de la empresa deberán verificar su identidad con un código enviado a su correo electrónico.', 'When enabled, company users must verify their identity with a code sent to their email.')
                                        }
                                    </div>
                                </div>
                            </div>
                            <label style={{position: 'relative', display: 'inline-block', width: 52, height: 28, cursor: procesandoOtp ? 'not-allowed' : 'pointer', opacity: procesandoOtp ? 0.6 : 1}}>
                                <input
                                    type="checkbox"
                                    checked={otpHabilitado}
                                    onChange={toggleOtp}
                                    disabled={procesandoOtp}
                                    style={{opacity: 0, width: 0, height: 0, position: 'absolute'}}
                                />
                                <span style={{
                                    position: 'absolute', cursor: procesandoOtp ? 'not-allowed' : 'pointer',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    borderRadius: 28, transition: 'all 0.3s ease',
                                    background: otpHabilitado ? '#10b981' : (tema === 'dark' ? '#475569' : '#cbd5e1')
                                }}>
                                    <span style={{
                                        position: 'absolute', left: otpHabilitado ? 26 : 3, top: 3,
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#fff', transition: 'all 0.3s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                </span>
                            </label>
                        </div>
                        <div style={{marginTop: 16, padding: '12px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...(tema === 'dark' ? {background: '#1e293b', color: '#94a3b8', border: '1px solid #334155'} : {background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'})}}>
                            <ion-icon name="information-circle-outline" style={{marginRight: 6, verticalAlign: 'middle'}}></ion-icon>
                            {tr('Necesitas tener configurado SMTP en el servidor para que funcione el envío de códigos.', 'You need SMTP configured on the server for code sending to work.')}
                        </div>
                    </div>
                </div>
            )}

            {tabActiva === 'notificaciones' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader} style={{marginBottom: 20}}>
                        <h2><ion-icon name="notifications-outline" style={{marginRight: 8, verticalAlign: 'middle'}}></ion-icon>{tr('Notificaciones del Header', 'Header Notifications')}</h2>
                        <p style={{marginTop: 6, color: '#64748b', fontSize: 13}}>{tr('Controla qué notificaciones se muestran en el flotante del header superior.', 'Control which notifications appear in the top header dropdown.')}</p>
                    </div>

                    <div style={{maxWidth: 620, margin: '0 auto'}}>
                        <div style={{marginBottom: 16, padding: '14px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, ...(tema === 'dark' ? {background: '#1e293b', color: '#94a3b8', border: '1px solid #334155'} : {background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0'})}}>
                            <ion-icon name="information-circle-outline" style={{marginRight: 6, verticalAlign: 'middle'}}></ion-icon>
                            {tr('Los cambios aplican al instante en la campana de notificaciones del header para todos los usuarios de la empresa.', 'Changes apply instantly to the notification bell in the header for all company users.')}
                        </div>

                        {[
                            {
                                campo: 'notif_mostrar_proximas',
                                titulo: tr('Cuotas próximas', 'Upcoming installments'),
                                desc: tr('Cuotas que vencen en los próximos días.', 'Installments due in the coming days.'),
                                icono: 'time-outline',
                                activo: notifConfig.notif_mostrar_proximas,
                                extra: notifConfig.notif_mostrar_proximas && (
                                    <div style={{marginTop: 12, display: 'flex', alignItems: 'center', gap: 10}}>
                                        <label style={{fontSize: 13, color: '#64748b'}}>{tr('Avisar con', 'Notify with')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="90"
                                            value={notifConfig.notif_proximas_dias}
                                            disabled={procesandoNotif}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 7
                                                const cl = { ...notifConfig, notif_proximas_dias: Math.min(Math.max(v, 1), 90) }
                                                setNotifConfig(cl)
                                                actualizarNotificacionesConfig(cl).then(r => r.success && setNotifConfig(r.config))
                                            }}
                                            style={{width: 70, padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: tema === 'dark' ? '#0f172a' : '#fff', color: tema === 'dark' ? '#f1f5f9' : '#0f172a', fontSize: 13, textAlign: 'center'}}
                                        />
                                        <label style={{fontSize: 13, color: '#64748b'}}>{tr('días de anticipación', 'days in advance')}</label>
                                    </div>
                                )
                            },
                            {
                                campo: 'notif_mostrar_vencidas',
                                titulo: tr('Cuotas vencidas', 'Overdue installments'),
                                desc: tr('Cuotas que ya pasaron su fecha de vencimiento.', 'Installments already past their due date.'),
                                icono: 'alert-circle-outline',
                                activo: notifConfig.notif_mostrar_vencidas,
                            },
                            {
                                campo: 'notif_mostrar_alertas',
                                titulo: tr('Alertas', 'Alerts'),
                                desc: tr('Alertas activas de financiamiento.', 'Active financing alerts.'),
                                icono: 'notifications-outline',
                                activo: notifConfig.notif_mostrar_alertas,
                            },
                        ].map((opcion) => (
                            <div
                                key={opcion.campo}
                                style={{
                                    marginBottom: 14,
                                    padding: '16px 20px',
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 16,
                                    ...(tema === 'dark' ? {background: '#1e293b', border: '1px solid #334155'} : {background: '#fff', border: '1px solid #e2e8f0'})
                                }}
                            >
                                <div style={{display: 'flex', alignItems: 'center', gap: 14, flex: 1}}>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 10, background: opcion.activo ? '#eff6ff' : (tema === 'dark' ? '#0f172a' : '#f1f5f9'), color: opcion.activo ? '#2563eb' : '#94a3b8', fontSize: 20, flexShrink: 0}}>
                                        <ion-icon name={opcion.icono}></ion-icon>
                                    </div>
                                    <div>
                                        <div style={{fontWeight: 600, fontSize: 14, color: tema === 'dark' ? '#f1f5f9' : '#0f172a'}}>{opcion.titulo}</div>
                                        <div style={{fontSize: 12.5, color: '#64748b', marginTop: 2}}>{opcion.desc}</div>
                                        {opcion.extra}
                                    </div>
                                </div>
                                <label style={{position: 'relative', display: 'inline-block', width: 52, height: 28, cursor: procesandoNotif ? 'not-allowed' : 'pointer', opacity: procesandoNotif ? 0.6 : 1, flexShrink: 0}}>
                                    <input
                                        type="checkbox"
                                        checked={!!opcion.activo}
                                        onChange={() => cambiarNotifConfig(opcion.campo, !opcion.activo)}
                                        disabled={procesandoNotif}
                                        style={{opacity: 0, width: 0, height: 0, position: 'absolute'}}
                                    />
                                    <span style={{
                                        position: 'absolute', cursor: procesandoNotif ? 'not-allowed' : 'pointer',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        borderRadius: 28, transition: 'all 0.3s ease',
                                        background: opcion.activo ? '#10b981' : (tema === 'dark' ? '#475569' : '#cbd5e1')
                                    }}>
                                        <span style={{
                                            position: 'absolute', left: opcion.activo ? 26 : 3, top: 3,
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#fff', transition: 'all 0.3s ease',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tabActiva === 'offline' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader} style={{marginBottom: 20}}>
                        <h2><ion-icon name="cloud-offline-outline" style={{marginRight: 8, verticalAlign: 'middle'}}></ion-icon>{tr('Modo Offline', 'Offline Mode')}</h2>
                    </div>
                    <div style={{maxWidth: 600, margin: '0 auto'}}>
                        <div style={{marginBottom: 16, padding: '16px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.6, ...(tema === 'dark' ? {background: '#1e293b', color: '#fbbf24', border: '1px solid #92400e'} : {background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'})}}>
                            <div style={{fontWeight: 700, fontSize: 14, marginBottom: 10}}>
                                <ion-icon name="list-outline" style={{marginRight: 6, verticalAlign: 'middle'}}></ion-icon>
                                {tr('Como usar el modo offline:', 'How to use offline mode:')}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <strong>{tr('Paso 1:', 'Step 1:')}</strong>
                                {tr(' Activa el interruptor "Trabajar sin conexion" de abajo.', ' Turn on the "Work offline" switch below.')}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <strong>{tr('Paso 2:', 'Step 2:')}</strong>
                                {tr(' Presiona el boton "Descargar base de datos (JSON)" para descargar TODOS los datos de la empresa en un archivo JSON y luego presiona "Confirmar descargado". Ese archivo es el que se usara en el dispositivo que trabajara sin internet.', ' Press the "Download database (JSON)" button to download ALL the company data in a JSON file and then press "Confirm downloaded". That file is what will be used on the device that will work without internet.')}
                            </div>
                            <div style={{marginBottom: 8}}>
                                <strong>{tr('Paso 3:', 'Step 3:')}</strong>
                                {tr(' Lleva el archivo JSON al dispositivo movil (la app) que trabajara sin conexion.', ' Take the JSON file to the mobile device (the app) that will work without connection.')}
                            </div>
                            <div>
                                <strong>{tr('Paso 4:', 'Step 4:')}</strong>
                                {tr(' Cuando termines, trae el archivo JSON modificado de vuelta y subelo aqui (campo "Subir base de datos nueva") para actualizar los datos de la empresa.', ' When you finish, bring the modified JSON file back and upload it here ("Upload new database" field) to update the company data.')}
                            </div>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderRadius: 12, border: '2px solid', ...(tema === 'dark' ? {background: '#0f172a', borderColor: '#334155'} : {background: '#f8fafc', borderColor: '#e5e7eb'})}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                                <div style={{fontSize: 32, color: offlineHabilitado ? '#10b981' : '#94a3b8'}}>
                                    <ion-icon name={offlineHabilitado ? 'cloud-done-outline' : 'cloud-offline-outline'}></ion-icon>
                                </div>
                                <div>
                                    <div style={{fontWeight: 700, fontSize: 16, marginBottom: 4, color: tema === 'dark' ? '#f1f5f9' : '#0f172a'}}>
                                        {tr('Trabajar sin conexión', 'Work offline')}
                                    </div>
                                    <div style={{fontSize: 13, color: tema === 'dark' ? '#94a3b8' : '#64748b', lineHeight: 1.4}}>
                                        {offlineHabilitado
                                            ? tr('Tu cuenta puede operar sin internet. Usa "Descargar base de datos (JSON)" y confirma la descarga antes de desconectarte.', 'Your account can operate without internet. Use "Download database (JSON)" and confirm the download before disconnecting.')
                                            : tr('Activa esta opción para permitir que tu usuario pueda trabajar sin conexión a internet cuando sea necesario.', 'Enable this option to allow your user to work without an internet connection when needed.')}
                                    </div>
                                </div>
                            </div>
                            <label style={{position: 'relative', display: 'inline-block', width: 52, height: 28, cursor: procesandoOffline ? 'not-allowed' : 'pointer', opacity: procesandoOffline ? 0.6 : 1}}>
                                <input
                                    type="checkbox"
                                    checked={offlineHabilitado}
                                    onChange={toggleOffline}
                                    disabled={procesandoOffline}
                                    style={{opacity: 0, width: 0, height: 0, position: 'absolute'}}
                                />
                                <span style={{
                                    position: 'absolute', cursor: procesandoOffline ? 'not-allowed' : 'pointer',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    borderRadius: 28, transition: 'all 0.3s ease',
                                    background: offlineHabilitado ? '#10b981' : (tema === 'dark' ? '#475569' : '#cbd5e1')
                                }}>
                                    <span style={{
                                        position: 'absolute', left: offlineHabilitado ? 26 : 3, top: 3,
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#fff', transition: 'all 0.3s ease',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                </span>
                            </label>
                        </div>
                        {offlineHabilitado && !offlineConfirmado && (
                            <div style={{marginTop: 16, padding: '16px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...(tema === 'dark' ? {background: '#1e293b', color: '#fbbf24', border: '1px solid #92400e'} : {background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'})}}>
                                <div style={{display: 'flex', alignItems: 'flex-start', gap: 8}}>
                                    <ion-icon name="warning-outline" style={{fontSize: 18, marginTop: 1, flexShrink: 0}}></ion-icon>
                                    <span>
                                        {tr('El modo offline está activado pero no has descargado los datos. Descarga ahora para confirmar la activación. Si no descargas, el modo offline se desactivará automáticamente.', 'Offline mode is enabled but you have not downloaded the data. Download now to confirm activation. If you do not download, offline mode will be automatically disabled.')}
                                    </span>
                                </div>
                                <div style={{display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid', ...(tema === 'dark' ? {borderColor: '#92400e'} : {borderColor: '#fde68a'})}}>
                                    <ion-icon name="shield-warning-outline" style={{fontSize: 18, marginTop: 1, flexShrink: 0}}></ion-icon>
                                    <span style={{fontWeight: 600}}>
                                        {tr('Advertencia de seguridad: no compartas este archivo con nadie. Contiene los datos de tu empresa y, si cae en manos equivocadas, podrían robarte la información y falsificar tu identidad.', 'Security warning: do not share this file with anyone. It contains your company data and, if it falls into the wrong hands, they could steal your information and impersonate you.')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={{marginTop: 16}}>
                            <button
                                onClick={descargarBD}
                                disabled={procesandoOffline}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '10px 24px', borderRadius: 8, border: 'none',
                                    fontSize: 14, fontWeight: 700, cursor: procesandoOffline ? 'not-allowed' : 'pointer',
                                    opacity: procesandoOffline ? 0.6 : 1,
                                    background: '#2563eb', color: '#fff',
                                }}
                            >
                                <ion-icon name={procesandoOffline ? 'hourglass-outline' : 'download-outline'} style={{fontSize: 18}}></ion-icon>
                                {procesandoOffline ? tr('Descargando...', 'Downloading...') : tr('Descargar base de datos (JSON)', 'Download database (JSON)')}
                            </button>
                        </div>
                        {progresoOffline.visible && !subiendoBD && (
                            <div style={{marginTop: 12}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                                    <div style={{flex: 1, height: 8, borderRadius: 4, background: tema === 'dark' ? '#334155' : '#e2e8f0', overflow: 'hidden'}}>
                                        <div style={{height: '100%', width: `${progresoOffline.porcentaje}%`, borderRadius: 4, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', transition: 'width 0.4s ease'}}></div>
                                    </div>
                                    <span style={{fontSize: 12, fontWeight: 600, color: tema === 'dark' ? '#94a3b8' : '#64748b', minWidth: 36, textAlign: 'right'}}>{progresoOffline.porcentaje}%</span>
                                </div>
                                <div style={{fontSize: 12, color: tema === 'dark' ? '#94a3b8' : '#64748b'}}>{progresoOffline.mensaje}</div>
                            </div>
                        )}

                        {offlineHabilitado && !offlineConfirmado && (
                            <div style={{marginTop: 12}}>
                                <button
                                    onClick={confirmarDescarga}
                                    disabled={procesandoConfirmar}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '10px 24px', borderRadius: 8, border: 'none',
                                        fontSize: 14, fontWeight: 600, cursor: procesandoConfirmar ? 'not-allowed' : 'pointer',
                                        opacity: procesandoConfirmar ? 0.7 : 1,
                                        background: procesandoConfirmar ? '#94a3b8' : '#10b981',
                                        color: '#fff',
                                    }}
                                >
                                    <ion-icon name={procesandoConfirmar ? 'hourglass-outline' : 'checkmark-circle-outline'} style={{fontSize: 18}}></ion-icon>
                                    {procesandoConfirmar
                                        ? tr('Confirmando...', 'Confirming...')
                                        : tr('Confirmar descargado', 'Confirm downloaded')}
                                </button>
                            </div>
                        )}

                        {offlineHabilitado && offlineConfirmado && (
                            <div style={{marginTop: 16, padding: '14px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...(tema === 'dark' ? {background: '#064e3b', color: '#6ee7b7', border: '1px solid #047857'} : {background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0'})}}>
                                <div style={{display: 'flex', alignItems: 'flex-start', gap: 8}}>
                                    <ion-icon name="lock-closed-outline" style={{fontSize: 18, marginTop: 1, flexShrink: 0}}></ion-icon>
                                    <div>
                                        <strong>{tr('Descarga confirmada. Modo offline total activado.', 'Download confirmed. Full offline mode activated.')}</strong>
                                        <div style={{marginTop: 4}}>
                                            {tr('La empresa quedó en modo offline total. No se re-habilitará hasta que subas la nueva base de datos modificada en el campo "Subir base de datos nueva" de abajo.', 'The company is now in full offline mode. It will only be re-enabled after you upload the new modified database in the "Upload new database" field below.')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!offlineHabilitado && (
                            <div style={{marginTop: 16, padding: '12px 20px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...(tema === 'dark' ? {background: '#1e293b', color: '#94a3b8', border: '1px solid #334155'} : {background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe'})}}>
                                <ion-icon name="information-circle-outline" style={{marginRight: 6, verticalAlign: 'middle'}}></ion-icon>
                                {tr('Al activar esta opción deberás descargar los datos y confirmar la descarga para dejar la empresa en modo offline total.', 'When enabled, you must download the data and confirm the download to leave the company in full offline mode.')}
                            </div>
                        )}

                        {offlineHabilitado && (
                            <div style={{marginTop: 16}}>
                                <div style={{padding: '20px 24px', borderRadius: 12, border: '2px solid', ...(tema === 'dark' ? {background: '#0f172a', borderColor: '#334155'} : {background: '#f8fafc', borderColor: '#e5e7eb'})}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16}}>
                                        <div style={{fontSize: 26, color: '#f97316'}}>
                                            <ion-icon name="cloud-upload-outline"></ion-icon>
                                        </div>
                                        <div>
                                            <div style={{fontWeight: 700, fontSize: 16, marginBottom: 4, color: tema === 'dark' ? '#f1f5f9' : '#0f172a'}}>
                                                {tr('Subir base de datos nueva', 'Upload new database')}
                                            </div>
                                            <div style={{fontSize: 13, color: tema === 'dark' ? '#94a3b8' : '#64748b', lineHeight: 1.4}}>
                                                {tr('Sube el archivo JSON exportado desde el dispositivo que trabajó offline. Esto reemplazará los datos de la empresa con los datos modificados.', 'Upload the JSON file exported from the device that worked offline. This will replace the company data with the modified data.')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        marginBottom: 16,
                                        padding: '14px 16px',
                                        borderRadius: 10,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                        border: '1px solid',
                                        ...(tema === 'dark' ? { background: '#1e293b', color: '#fbbf24', borderColor: '#92400e' } : { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }),
                                    }}>
                                        <ion-icon name="time-outline" style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}></ion-icon>
                                        <div>
                                            <strong>{tr('Tiempo estimado:', 'Estimated time:')}</strong>
                                            {tr(' La subida puede tardar de 3 a 7 minutos dependiendo del tamaño de la base de datos y la cantidad de información. Por favor, NO cierres la página, NO apagues el dispositivo y NO recargues la pantalla mientras se sube. Al terminar verás la barra de progreso al 100% y el mensaje de confirmación.', ' The upload can take 3 to 7 minutes depending on the size of the database and the amount of information. Please DO NOT close the page, DO NOT turn off the device and DO NOT reload the screen while it uploads. When it finishes you will see the progress bar at 100% and the confirmation message.')}
                                        </div>
                                    </div>
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center'}}>
                                        <input
                                            type="file"
                                            accept=".json,application/json"
                                            onChange={(e) => setArchivoBD(e.target.files[0] || null)}
                                            style={{flex: 1, minWidth: 200, fontSize: 13}}
                                        />
                                        <button
                                            onClick={subirBase}
                                            disabled={subiendoBD || !archivoBD}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                                padding: '10px 24px', borderRadius: 8, border: 'none',
                                                fontSize: 14, fontWeight: 600, cursor: (subiendoBD || !archivoBD) ? 'not-allowed' : 'pointer',
                                                opacity: (subiendoBD || !archivoBD) ? 0.7 : 1,
                                                background: '#f97316', color: '#fff',
                                            }}
                                        >
                                            <ion-icon name={subiendoBD ? 'hourglass-outline' : 'cloud-upload-outline'} style={{fontSize: 18}}></ion-icon>
                                            {subiendoBD ? tr('Subiendo...', 'Uploading...') : tr('Subir base de datos', 'Upload database')}
                                        </button>
                                    </div>
                                    {progresoOffline.visible && subiendoBD && (
                                        <div style={{marginTop: 12}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4}}>
                                                <div style={{flex: 1, height: 8, borderRadius: 4, background: tema === 'dark' ? '#334155' : '#e2e8f0', overflow: 'hidden'}}>
                                                    <div style={{height: '100%', width: `${progresoOffline.porcentaje}%`, borderRadius: 4, background: 'linear-gradient(90deg, #f97316, #fb923c)', transition: 'width 0.4s ease'}}></div>
                                                </div>
                                                <span style={{fontSize: 12, fontWeight: 600, color: tema === 'dark' ? '#94a3b8' : '#64748b', minWidth: 36, textAlign: 'right'}}>{progresoOffline.porcentaje}%</span>
                                            </div>
                                            <div style={{fontSize: 12, color: tema === 'dark' ? '#94a3b8' : '#64748b'}}>{progresoOffline.mensaje}</div>
                                        </div>
                                    )}
                                    <div style={{marginTop: 16, padding: '12px 16px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, ...(bdSubida ? (tema === 'dark' ? {background: '#064e3b', color: '#6ee7b7', border: '1px solid #047857'} : {background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0'}) : (tema === 'dark' ? {background: '#1e293b', color: '#94a3b8', border: '1px solid #334155'} : {background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0'}))}}>
                                        {bdSubida
                                            ? tr('Base de datos subida correctamente. Ahora puedes desactivar el modo offline.', 'Database uploaded successfully. Now you can disable offline mode.')
                                            : tr('Después de subir la base de datos se habilitará el botón para desactivar el modo offline.', 'After uploading the database, the button to disable offline mode will be enabled.')}
                                    </div>
                                    <div style={{marginTop: 16}}>
                                        <button
                                            onClick={desactivarOffline}
                                            disabled={!bdSubida || procesandoOffline}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                                padding: '10px 24px', borderRadius: 8, border: 'none',
                                                fontSize: 14, fontWeight: 700, cursor: (!bdSubida || procesandoOffline) ? 'not-allowed' : 'pointer',
                                                opacity: (!bdSubida || procesandoOffline) ? 0.5 : 1,
                                                background: bdSubida ? '#ef4444' : '#94a3b8', color: '#fff',
                                            }}
                                        >
                                            <ion-icon name="cloud-offline-outline" style={{fontSize: 18}}></ion-icon>
                                            {tr('Desactivar modo offline', 'Disable offline mode')}
                                        </button>
                                        {!bdSubida && (
                                            <span style={{display: 'inline-block', marginLeft: 12, fontSize: 12, color: tema === 'dark' ? '#94a3b8' : '#64748b'}}>
                                                {tr('Disponible solo después de subir la base de datos.', 'Available only after uploading the database.')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {modalMoneda && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoMoneda ? tr('Editar Moneda', 'Edit Currency') : tr('Nueva Moneda', 'New Currency')}</h3>
                            <button onClick={() => setModalMoneda(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Codigo *', 'Code *')}</label>
                                <input type="text" value={formMoneda.codigo} onChange={(e) => setFormMoneda({...formMoneda, codigo: e.target.value})} maxLength="3" />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Nombre *', 'Name *')}</label>
                                <input type="text" value={formMoneda.nombre} onChange={(e) => setFormMoneda({...formMoneda, nombre: e.target.value})} />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Simbolo *', 'Symbol *')}</label>
                                <input type="text" value={formMoneda.simbolo} onChange={(e) => setFormMoneda({...formMoneda, simbolo: e.target.value})} maxLength="5" />
                            </div>
                            <div className={estilos.grupoCheckbox}>
                                <input type="checkbox" id="activoMoneda" checked={formMoneda.activo} onChange={(e) => setFormMoneda({...formMoneda, activo: e.target.checked})} />
                                <label htmlFor="activoMoneda">{tr('Activo', 'Active')}</label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setModalMoneda(false)} className={estilos.btnCancelar}>{tr('Cancelar', 'Cancel')}</button>
                            <button onClick={guardarMoneda} className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar', 'Save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tabActiva === 'conversiones' && (
                <div className={`${estilos.seccion} ${estilos[tema]}`}>
                    <div className={estilos.seccionHeader}>
                        <h2>{tr('Conversiones entre Unidades', 'Unit Conversions')}</h2>
                        <button onClick={() => abrirModalConversion()} className={estilos.btnNuevo}>
                            <ion-icon name="add-circle-outline"></ion-icon>
                            <span>{tr('Nueva Conversión', 'New Conversion')}</span>
                        </button>
                    </div>
                    <div className={estilos.grid}>
                        {conversiones.map(conv => (
                            <div key={conv.id} className={`${estilos.itemCard} ${estilos[tema]}`}>
                                <div className={estilos.itemHeader}>
                                    <div>
                                        <h3>{conv.unidad_origen_nombre} → {conv.unidad_destino_nombre}</h3>
                                        <p>{conv.unidad_origen_abrev} → {conv.unidad_destino_abrev} ({tr('Factor', 'Factor')}: {parseFloat(conv.factor).toFixed(6)})</p>
                                        {conv.empresa_id && <small style={{color: '#666'}}>{tr('Específica de empresa', 'Company specific')}</small>}
                                    </div>
                                    <span className={`${estilos.badge} ${conv.activo ? estilos.activo : estilos.inactivo}`}>
                                        {conv.activo ? tr('Activo', 'Active') : tr('Inactivo', 'Inactive')}
                                    </span>
                                </div>
                                <div className={estilos.itemAcciones}>
                                    <button onClick={() => abrirModalConversion(conv)} className={estilos.btnIcono}>
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button onClick={() => eliminarConversionHandler(conv.id)} className={`${estilos.btnIcono} ${estilos.eliminar}`}>
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modalUnidad && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoUnidad ? tr('Editar Unidad', 'Edit Unit') : tr('Nueva Unidad', 'New Unit')}</h3>
                            <button onClick={() => setModalUnidad(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Codigo *', 'Code *')}</label>
                                <input type="text" value={formUnidad.codigo} onChange={(e) => setFormUnidad({...formUnidad, codigo: e.target.value})} maxLength="10" />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Nombre *', 'Name *')}</label>
                                <input type="text" value={formUnidad.nombre} onChange={(e) => setFormUnidad({...formUnidad, nombre: e.target.value})} />
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Abreviatura *', 'Abbreviation *')}</label>
                                <input type="text" value={formUnidad.abreviatura} onChange={(e) => setFormUnidad({...formUnidad, abreviatura: e.target.value})} maxLength="10" />
                            </div>
                            <div className={estilos.grupoCheckbox}>
                                <input type="checkbox" id="activoUnidad" checked={formUnidad.activo} onChange={(e) => setFormUnidad({...formUnidad, activo: e.target.checked})} />
                                <label htmlFor="activoUnidad">{tr('Activo', 'Active')}</label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setModalUnidad(false)} className={estilos.btnCancelar}>{tr('Cancelar', 'Cancel')}</button>
                            <button onClick={guardarUnidad} className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar', 'Save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalConversion && (
                <div className={estilos.modal}>
                    <div className={`${estilos.modalContenido} ${estilos[tema]}`}>
                        <div className={estilos.modalHeader}>
                            <h3>{editandoConversion ? tr('Editar Conversión', 'Edit Conversion') : tr('Nueva Conversión', 'New Conversion')}</h3>
                            <button onClick={() => setModalConversion(false)} className={estilos.btnCerrar}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBody}>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Unidad Origen *', 'Source Unit *')}</label>
                                <select 
                                    value={formConversion.unidad_origen_id} 
                                    onChange={(e) => setFormConversion({...formConversion, unidad_origen_id: e.target.value})}
                                    disabled={!!editandoConversion}
                                >
                                    <option value="">{tr('Seleccionar unidad', 'Select unit')}</option>
                                    {unidadesMedida.filter(u => u.id != formConversion.unidad_destino_id).map(um => (
                                        <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                                    ))}
                                </select>
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Unidad Destino *', 'Target Unit *')}</label>
                                <select 
                                    value={formConversion.unidad_destino_id} 
                                    onChange={(e) => setFormConversion({...formConversion, unidad_destino_id: e.target.value})}
                                    disabled={!!editandoConversion}
                                >
                                    <option value="">{tr('Seleccionar unidad', 'Select unit')}</option>
                                    {unidadesMedida.filter(u => u.id != formConversion.unidad_origen_id).map(um => (
                                        <option key={um.id} value={um.id}>{um.nombre} ({um.abreviatura})</option>
                                    ))}
                                </select>
                            </div>
                            <div className={estilos.grupoInput}>
                                <label>{tr('Factor de Conversión *', 'Conversion Factor *')}</label>
                                <input 
                                    type="number" 
                                    step="0.000001"
                                    value={formConversion.factor} 
                                    onChange={(e) => setFormConversion({...formConversion, factor: e.target.value})} 
                                    placeholder={tr('Ej: 2.20462 (1 kg = 2.20462 lb)', 'Ex: 2.20462 (1 kg = 2.20462 lb)')}
                                />
                                <small>{tr('Factor: cantidad_destino = cantidad_origen × factor', 'Factor: target_quantity = source_quantity x factor')}</small>
                            </div>
                            <div className={estilos.grupoCheckbox}>
                                <input 
                                    type="checkbox" 
                                    id="activoConversion" 
                                    checked={formConversion.activo} 
                                    onChange={(e) => setFormConversion({...formConversion, activo: e.target.checked})} 
                                />
                                <label htmlFor="activoConversion">{tr('Activo', 'Active')}</label>
                            </div>
                        </div>
                        <div className={estilos.modalFooter}>
                            <button onClick={() => setModalConversion(false)} className={estilos.btnCancelar}>{tr('Cancelar', 'Cancel')}</button>
                            <button onClick={guardarConversion} className={estilos.btnGuardar} disabled={procesando}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{procesando ? tr('Guardando...', 'Saving...') : tr('Guardar', 'Save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {mostrarModalRecorte && (
                <div className={estilos.modalRecorteOverlay}>
                    <div style={{ width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', background: tema === 'dark' ? '#1e293b' : '#ffffff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${tema === 'dark' ? '#334155' : '#e5e7eb'}` }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: tema === 'dark' ? '#f1f5f9' : '#0f172a' }}>{tr('Recortar Logo', 'Crop Logo')}</h3>
                            <button onClick={cancelarRecorte} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: tema === 'dark' ? '#94a3b8' : '#64748b', lineHeight: 1 }}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '460px', background: tema === 'dark' ? '#0f172a' : '#f8fafc' }}>
                            <Cropper
                                image={imagenParaRecortar}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: tema === 'dark' ? '#cbd5e1' : '#475569' }}>Zoom</label>
                            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: '100%' }} />
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: `2px solid ${tema === 'dark' ? '#334155' : '#e5e7eb'}` }}>
                            <button type="button" onClick={cancelarRecorte} style={{ padding: '10px 20px', borderRadius: '8px', border: `2px solid ${tema === 'dark' ? '#475569' : '#e2e8f0'}`, background: 'transparent', color: tema === 'dark' ? '#94a3b8' : '#64748b', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                {tr('Cancelar', 'Cancel')}
                            </button>
                            <button type="button" onClick={aplicarRecorte} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f97316', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ion-icon name="checkmark-outline"></ion-icon>
                                <span>{tr('Aplicar Recorte', 'Apply Crop')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
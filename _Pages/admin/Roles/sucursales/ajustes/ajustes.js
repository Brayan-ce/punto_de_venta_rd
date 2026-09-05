"use client"
import { useEffect, useState } from 'react'
import { useLanguage } from '@/_Pages/admin/i18n'
import { obtenerAjustesSucursal, actualizarPerfilAdminSucursal, actualizarSistemaSucursal } from './servidor'
import estilos from './ajustes.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function AjustesSucursales() {
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)

    const [tema, setTema] = useState('light')
    const [mounted, setMounted] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [guardandoPerfil, setGuardandoPerfil] = useState(false)
    const [guardandoSistema, setGuardandoSistema] = useState(false)
    const [estadoOperacion, setEstadoOperacion] = useState({ tipo: '', texto: '' })
    const [tabActiva, setTabActiva] = useState('perfil')
    const [resumen, setResumen] = useState({
        totalSucursales: 0,
        asignaciones: 0,
        transferenciasAbiertas: 0
    })
    const [perfilAdmin, setPerfilAdmin] = useState({
        nombre: '',
        cedula: '',
        email: '',
        avatar_url: '',
        system_mode: 'POS'
    })
    const [configSistema, setConfigSistema] = useState({
        nombre_empresa: '',
        rnc: '',
        razon_social: '',
        nombre_comercial: '',
        actividad_economica: '',
        direccion: '',
        sector: '',
        municipio: '',
        provincia: '',
        telefono: '',
        email: '',
        simbolo_moneda: 'RD$'
    })

    useEffect(() => {
        setMounted(true)
        const temaLocal = localStorage.getItem('tema') || 'light'
        setTema(temaLocal)
        cargarAjustes()

        const handleTemaChange = () => {
            const nuevoTema = localStorage.getItem('tema') || 'light'
            setTema(nuevoTema)
        }

        window.addEventListener('temaChange', handleTemaChange)
        return () => window.removeEventListener('temaChange', handleTemaChange)
    }, [])

    const cargarAjustes = async () => {
        setCargando(true)
        try {
            const res = await obtenerAjustesSucursal()
            if (res.success) {
                setPerfilAdmin({
                    nombre: res.perfil?.nombre || '',
                    cedula: res.perfil?.cedula || '',
                    email: res.perfil?.email || '',
                    avatar_url: res.perfil?.avatar_url || '',
                    system_mode: res.perfil?.system_mode || 'POS'
                })
                setConfigSistema({
                    nombre_empresa: res.sistema?.nombre_empresa || '',
                    rnc: res.sistema?.rnc || '',
                    razon_social: res.sistema?.razon_social || '',
                    nombre_comercial: res.sistema?.nombre_comercial || '',
                    actividad_economica: res.sistema?.actividad_economica || '',
                    direccion: res.sistema?.direccion || '',
                    sector: res.sistema?.sector || '',
                    municipio: res.sistema?.municipio || '',
                    provincia: res.sistema?.provincia || '',
                    telefono: res.sistema?.telefono || '',
                    email: res.sistema?.email || '',
                    simbolo_moneda: res.sistema?.simbolo_moneda || 'RD$'
                })
                setResumen({
                    totalSucursales: Number(res.resumen?.totalSucursales || 0),
                    asignaciones: Number(res.resumen?.asignaciones || 0),
                    transferenciasAbiertas: Number(res.resumen?.transferenciasAbiertas || 0)
                })
                setEstadoOperacion({ tipo: '', texto: '' })
            } else {
                setEstadoOperacion({
                    tipo: 'error',
                    texto: res.mensaje || tr('No se pudo cargar ajustes', 'Could not load settings')
                })
            }
        } catch (error) {
            console.error('Error al cargar ajustes:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('Error inesperado cargando ajustes', 'Unexpected error loading settings') })
        } finally {
            setCargando(false)
        }
    }

    const guardarPerfil = async (e) => {
        e.preventDefault()
        setGuardandoPerfil(true)
        setEstadoOperacion({ tipo: '', texto: '' })
        try {
            const res = await actualizarPerfilAdminSucursal(perfilAdmin)
            setEstadoOperacion({
                tipo: res.success ? 'ok' : 'error',
                texto: res.mensaje || (res.success ? tr('Perfil actualizado', 'Profile updated') : tr('No se pudo actualizar el perfil', 'Could not update profile'))
            })
            if (res.success) await cargarAjustes()
        } catch (error) {
            console.error('Error guardando perfil:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('Error guardando perfil', 'Error saving profile') })
        } finally {
            setGuardandoPerfil(false)
        }
    }

    const guardarSistema = async (e) => {
        e.preventDefault()
        setGuardandoSistema(true)
        setEstadoOperacion({ tipo: '', texto: '' })
        try {
            const res = await actualizarSistemaSucursal(configSistema)
            setEstadoOperacion({
                tipo: res.success ? 'ok' : 'error',
                texto: res.mensaje || (res.success ? tr('Configuracion guardada', 'Configuration saved') : tr('No se pudo guardar', 'Could not save'))
            })
            if (res.success) await cargarAjustes()
        } catch (error) {
            console.error('Error guardando sistema:', error)
            setEstadoOperacion({ tipo: 'error', texto: tr('Error guardando configuracion', 'Error saving settings') })
        } finally {
            setGuardandoSistema(false)
        }
    }

    const onPerfilChange = (e) => {
        const { name, value } = e.target
        setPerfilAdmin((prev) => ({ ...prev, [name]: value }))
    }

    const onSistemaChange = (e) => {
        const { name, value } = e.target
        setConfigSistema((prev) => ({ ...prev, [name]: value }))
    }

    if (!mounted) return null

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>{tr('Ajustes de Sucursales', 'Branch Settings')}</h1>
                    <p className={estilos.subtitulo}>{tr('Perfil del admin y configuracion del sistema para este modulo', 'Admin profile and system configuration for this module')}</p>
                </div>
                <button type="button" className={estilos.btnRefrescar} onClick={cargarAjustes}>
                    {tr('Actualizar', 'Refresh')}
                </button>
            </div>

            {estadoOperacion.texto && (
                <div className={`${estilos.estadoOperacion} ${estilos[estadoOperacion.tipo || 'ok']}`}>
                    {estadoOperacion.texto}
                </div>
            )}

            <div className={estilos.stats}>
                <div className={estilos.statCard}>
                    <h4>{tr('Sucursales', 'Branches')}</h4>
                    <p>{resumen.totalSucursales}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Asignaciones', 'Assignments')}</h4>
                    <p>{resumen.asignaciones}</p>
                </div>
                <div className={estilos.statCard}>
                    <h4>{tr('Transferencias Abiertas', 'Open Transfers')}</h4>
                    <p>{resumen.transferenciasAbiertas}</p>
                </div>
            </div>

            <div className={estilos.grid}>
                <div className={estilos.panel}>
                    <div className={estilos.tabs}>
                        <button
                            type="button"
                            className={`${estilos.tabBtn} ${tabActiva === 'perfil' ? estilos.tabActiva : ''}`}
                            onClick={() => setTabActiva('perfil')}
                        >
                            {tr('Perfil Admin', 'Admin Profile')}
                        </button>
                        <button
                            type="button"
                            className={`${estilos.tabBtn} ${tabActiva === 'sistema' ? estilos.tabActiva : ''}`}
                            onClick={() => setTabActiva('sistema')}
                        >
                            {tr('Sistema', 'System')}
                        </button>
                    </div>

                    {cargando ? <LoadingScreen /> : tabActiva === 'perfil' ? (
                        <form className={estilos.formulario} onSubmit={guardarPerfil}>
                            <div className={estilos.campoGrid}>
                                <div className={estilos.campo}>
                                    <label>{tr('Nombre completo', 'Full name')}</label>
                                    <input name="nombre" value={perfilAdmin.nombre} onChange={onPerfilChange} className={estilos.input} required />
                                </div>
                                <div className={estilos.campo}>
                                    <label>{tr('Cedula', 'ID')}</label>
                                    <input name="cedula" value={perfilAdmin.cedula} onChange={onPerfilChange} className={estilos.input} required />
                                </div>
                            </div>

                            <div className={estilos.campoGrid}>
                                <div className={estilos.campo}>
                                    <label>Email</label>
                                    <input type="email" name="email" value={perfilAdmin.email} onChange={onPerfilChange} className={estilos.input} required />
                                </div>
                                <div className={estilos.campo}>
                                    <label>{tr('Modo del sistema', 'System mode')}</label>
                                    <select name="system_mode" value={perfilAdmin.system_mode} onChange={onPerfilChange} className={estilos.select}>
                                        <option value="POS">POS</option>
                                        <option value="OBRAS">OBRAS</option>
                                    </select>
                                </div>
                            </div>

                            <div className={estilos.campo}>
                                <label>{tr('URL del avatar', 'Avatar URL')}</label>
                                <input name="avatar_url" value={perfilAdmin.avatar_url} onChange={onPerfilChange} className={estilos.input} placeholder="https://..." />
                            </div>

                            <button className={estilos.btnGuardar} type="submit" disabled={guardandoPerfil}>
                                {guardandoPerfil ? tr('Guardando...', 'Saving...') : tr('Guardar perfil', 'Save profile')}
                            </button>
                        </form>
                    ) : (
                        <form className={estilos.formulario} onSubmit={guardarSistema}>
                            <div className={estilos.campoGrid}>
                                <div className={estilos.campo}>
                                    <label>{tr('Nombre empresa', 'Company name')}</label>
                                    <input name="nombre_empresa" value={configSistema.nombre_empresa} onChange={onSistemaChange} className={estilos.input} required />
                                </div>
                                <div className={estilos.campo}>
                                    <label>RNC</label>
                                    <input name="rnc" value={configSistema.rnc} onChange={onSistemaChange} className={estilos.input} required />
                                </div>
                            </div>

                            <div className={estilos.campoGrid}>
                                <div className={estilos.campo}>
                                    <label>{tr('Razon social', 'Legal name')}</label>
                                    <input name="razon_social" value={configSistema.razon_social} onChange={onSistemaChange} className={estilos.input} required />
                                </div>
                                <div className={estilos.campo}>
                                    <label>{tr('Nombre comercial', 'Trade name')}</label>
                                    <input name="nombre_comercial" value={configSistema.nombre_comercial} onChange={onSistemaChange} className={estilos.input} required />
                                </div>
                            </div>

                            <div className={estilos.campoGrid}>
                                <div className={estilos.campo}>
                                    <label>{tr('Simbolo', 'Symbol')}</label>
                                    <input name="simbolo_moneda" value={configSistema.simbolo_moneda} onChange={onSistemaChange} className={estilos.input} />
                                </div>
                            </div>

                            <button className={estilos.btnGuardar} type="submit" disabled={guardandoSistema}>
                                {guardandoSistema ? tr('Guardando...', 'Saving...') : tr('Guardar configuracion', 'Save settings')}
                            </button>
                        </form>
                    )}
                </div>

                <div className={estilos.panel}>
                    <h3>{tr('Notas operativas', 'Operational notes')}</h3>
                    <ul className={estilos.listaNotas}>
                        <li>{tr('Este panel concentra configuracion, no operaciones del dia a dia.', 'This panel centralizes configuration, not day-to-day operations.')}</li>
                        <li>{tr('Gestion de stock y transferencias se mantiene en sus secciones.', 'Stock and transfers are managed in their own sections.')}</li>
                        <li>{tr('Si cambias moneda o impuestos, revisa precios y reportes.', 'If you change currency or taxes, review prices and reports.')}</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

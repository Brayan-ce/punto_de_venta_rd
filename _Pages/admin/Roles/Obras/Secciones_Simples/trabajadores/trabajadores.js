"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadoresSimples, eliminarTrabajadorSimple, obtenerMonedaEmpresa } from './servidor'
import Nuevo from './nuevo/Nuevo'
import Editar from './editar/Editar'
import Ver from './ver/Ver'
import { useLanguage } from '@/_Pages/admin/i18n'
import estilos from './trabajadores.module.css'
import LoadingScreen from '@/_EXTRAS/Componentes/LoadingScreen/LoadingScreen'

export default function Trabajadores() {
    const [tema, setTema] = useState('light')
    const [vista, setVista] = useState('lista')
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null)
    const [trabajadores, setTrabajadores] = useState([])
    const [cargando, setCargando] = useState(true)
    const { language } = useLanguage()
    const tr = (es, en) => (language === 'en' ? en : es)
    const [moneda, setMoneda] = useState('DOP RD$')
    const [filtros, setFiltros] = useState({
        busqueda: '',
        especialidad: '',
        activo: 'true'
    })

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
        cargarMoneda()
    }, [])

    useEffect(() => {
        if (vista === 'lista') {
            cargarTrabajadores()
        }
    }, [vista, filtros])

    async function cargarMoneda() {
        const res = await obtenerMonedaEmpresa()
        if (res.success) {
            setMoneda(`${res.codigo_moneda} ${res.simbolo_moneda}`)
        }
    }

    async function cargarTrabajadores() {
        setCargando(true)
        const res = await obtenerTrabajadoresSimples(filtros)
        if (res.success) {
            setTrabajadores(res.trabajadores)
        }
        setCargando(false)
    }

    async function handleEliminar(id, nombre) {
        if (!confirm(tr(`¿Estás seguro de eliminar a ${nombre}?\n\nEsto eliminará todos los registros asociados.`, `Are you sure you want to delete ${nombre}?\n\nThis will delete all associated records.`))) {
            return
        }

        const res = await eliminarTrabajadorSimple(id)
        if (res.success) {
            cargarTrabajadores()
        } else {
            alert(res.mensaje || tr('Error al eliminar el trabajador', 'Error deleting worker'))
        }
    }

    function volverALista() {
        setVista('lista')
        setTrabajadorSeleccionado(null)
        cargarTrabajadores()
    }

    if (vista === 'nuevo') {
        return <Nuevo onVolver={volverALista} moneda={moneda} />
    }

    if (vista === 'editar' && trabajadorSeleccionado) {
        return <Editar trabajadorId={trabajadorSeleccionado} onVolver={volverALista} moneda={moneda} />
    }

    if (vista === 'ver' && trabajadorSeleccionado) {
        return <Ver trabajadorId={trabajadorSeleccionado} onVolver={volverALista} moneda={moneda} />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        {tr('Trabajadores', 'Workers')}
                    </h1>
                    <p className={estilos.subtitulo}>
                        {tr('Gestión de personal y empleados', 'Staff and employee management')}
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={() => setVista('nuevo')}
                >
                    <ion-icon name="person-add-outline"></ion-icon>
                    <span>{tr('Nuevo Trabajador', 'New Worker')}</span>
                </button>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder={tr('Buscar por nombre, apellido o cédula...', 'Search by name, last name or ID...')}
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <select
                    value={filtros.especialidad}
                    onChange={(e) => setFiltros(prev => ({ ...prev, especialidad: e.target.value }))}
                    className={estilos.select}
                >
                    <option value="">{tr('Todas las especialidades', 'All specialties')}</option>
                    <option value="Albañil">Albañil</option>
                    <option value="Plomero">Plomero</option>
                    <option value="Electricista">Electricista</option>
                    <option value="Pintor">Pintor</option>
                    <option value="Carpintero">Carpintero</option>
                    <option value="Ayudante">Ayudante</option>
                    <option value="Otro">Otro</option>
                </select>
                <select
                    value={filtros.activo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, activo: e.target.value }))}
                    className={estilos.select}
                >
                    <option value="">{tr('Todos', 'All')}</option>
                    <option value="true">{tr('Activos', 'Active')}</option>
                    <option value="false">{tr('Inactivos', 'Inactive')}</option>
                </select>
            </div>

            {cargando ? <LoadingScreen /> : trabajadores.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="people-outline"></ion-icon>
                    <h3>{tr('No hay trabajadores registrados', 'No workers registered')}</h3>
                    <p>{tr('Agrega tu primer trabajador para comenzar', 'Add your first worker to get started')}</p>
                    <button 
                        className={estilos.btnCrear}
                        onClick={() => setVista('nuevo')}
                    >
                        <ion-icon name="person-add-outline"></ion-icon>
                        {tr('Crear Primer Trabajador', 'Create First Worker')}
                    </button>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {trabajadores.map(trabajador => {
                        const nombreCompleto = `${trabajador.nombre} ${trabajador.apellido || ''}`.trim()
                        
                        return (
                            <div key={trabajador.id} className={estilos.trabajadorCard}>
                                <div className={estilos.trabajadorHeader}>
                                    <div className={estilos.avatarContainer}>
                                        {trabajador.foto_url ? (
                                            <img src={trabajador.foto_url} alt={nombreCompleto} className={estilos.avatar} />
                                        ) : (
                                            <div className={estilos.avatarPlaceholder}>
                                                <ion-icon name="person-outline"></ion-icon>
                                            </div>
                                        )}
                                        {trabajador.activo ? (
                                            <span className={`${estilos.badge} ${estilos.activo}`}>
                                                <ion-icon name="checkmark-circle"></ion-icon>
                                                {tr('Activo', 'Active')}
                                            </span>
                                        ) : (
                                            <span className={`${estilos.badge} ${estilos.inactivo}`}>
                                                <ion-icon name="close-circle"></ion-icon>
                                                {tr('Inactivo', 'Inactive')}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className={estilos.trabajadorInfo}>
                                        <h3>{nombreCompleto}</h3>
                                        {trabajador.codigo_trabajador && (
                                            <span className={estilos.codigo}>{trabajador.codigo_trabajador}</span>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.trabajadorBody}>
                                    {trabajador.especialidad && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="construct-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>{tr('Especialidad', 'Specialty')}</span>
                                                <span className={estilos.infoValor}>{trabajador.especialidad}</span>
                                            </div>
                                        </div>
                                    )}

                                    {trabajador.cedula && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>{tr('Cédula', 'ID')}</span>
                                                <span className={estilos.infoValor}>{trabajador.cedula}</span>
                                            </div>
                                        </div>
                                    )}

                                    {trabajador.telefono && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="call-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>{tr('Teléfono', 'Phone')}</span>
                                                <span className={estilos.infoValor}>{trabajador.telefono}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={estilos.estadisticas}>
                                        <div className={estilos.stat}>
                                            <ion-icon name="wallet-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>{moneda} {(trabajador.salario_diario || 0).toLocaleString()}</span>
                                                <span className={estilos.statLabel}>{tr('Salario Diario', 'Daily Salary')}</span>
                                            </div>
                                        </div>
                                        <div className={estilos.stat}>
                                            <ion-icon name="business-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>{trabajador.obras_activas || 0}</span>
                                                <span className={estilos.statLabel}>{tr('Obras Activas', 'Active Projects')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {trabajador.fecha_ingreso && (
                                        <div className={estilos.fechaIngreso}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            <span>{tr('Ingreso:', 'Hired:')} {new Date(trabajador.fecha_ingreso).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={estilos.trabajadorFooter}>
                                    <button 
                                        className={estilos.btnVer}
                                        onClick={() => {
                                            setTrabajadorSeleccionado(trabajador.id)
                                            setVista('ver')
                                        }}
                                    >
                                        <ion-icon name="eye-outline"></ion-icon>
                                        {tr('Ver Detalle', 'View Detail')}
                                    </button>
                                    <button 
                                        className={estilos.btnEditar}
                                        onClick={() => {
                                            setTrabajadorSeleccionado(trabajador.id)
                                            setVista('editar')
                                        }}
                                    >
                                        <ion-icon name="create-outline"></ion-icon>
                                    </button>
                                    <button 
                                        className={estilos.btnEliminar}
                                        onClick={() => handleEliminar(trabajador.id, nombreCompleto)}
                                    >
                                        <ion-icon name="trash-outline"></ion-icon>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
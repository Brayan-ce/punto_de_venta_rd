"use client"
import { useState, useEffect } from 'react'
import { obtenerTrabajadoresSimples, eliminarTrabajadorSimple } from './servidor'
import Nuevo from './nuevo/Nuevo'
import Editar from './editar/Editar'
import Ver from './ver/Ver'
import estilos from './trabajadores.module.css'

export default function Trabajadores() {
    const [tema, setTema] = useState('light')
    const [vista, setVista] = useState('lista')
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null)
    const [trabajadores, setTrabajadores] = useState([])
    const [cargando, setCargando] = useState(true)
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
        if (vista === 'lista') {
            cargarTrabajadores()
        }
    }, [vista, filtros])

    async function cargarTrabajadores() {
        setCargando(true)
        const res = await obtenerTrabajadoresSimples(filtros)
        if (res.success) {
            setTrabajadores(res.trabajadores)
        }
        setCargando(false)
    }

    async function handleEliminar(id, nombre) {
        if (!confirm(`¿Estás seguro de eliminar a ${nombre}?\n\nEsto eliminará todos los registros asociados.`)) {
            return
        }

        const res = await eliminarTrabajadorSimple(id)
        if (res.success) {
            cargarTrabajadores()
        } else {
            alert(res.mensaje || 'Error al eliminar el trabajador')
        }
    }

    function volverALista() {
        setVista('lista')
        setTrabajadorSeleccionado(null)
        cargarTrabajadores()
    }

    if (vista === 'nuevo') {
        return <Nuevo onVolver={volverALista} />
    }

    if (vista === 'editar' && trabajadorSeleccionado) {
        return <Editar trabajadorId={trabajadorSeleccionado} onVolver={volverALista} />
    }

    if (vista === 'ver' && trabajadorSeleccionado) {
        return <Ver trabajadorId={trabajadorSeleccionado} onVolver={volverALista} />
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div className={estilos.headerInfo}>
                    <h1 className={estilos.titulo}>
                        <ion-icon name="people-outline"></ion-icon>
                        Trabajadores
                    </h1>
                    <p className={estilos.subtitulo}>
                        Gestión de personal y empleados
                    </p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={() => setVista('nuevo')}
                >
                    <ion-icon name="person-add-outline"></ion-icon>
                    <span>Nuevo Trabajador</span>
                </button>
            </div>

            <div className={estilos.filtros}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o cédula..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                    />
                </div>
                <select
                    value={filtros.especialidad}
                    onChange={(e) => setFiltros(prev => ({ ...prev, especialidad: e.target.value }))}
                    className={estilos.select}
                >
                    <option value="">Todas las especialidades</option>
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
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                </select>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="refresh-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando trabajadores...</span>
                </div>
            ) : trabajadores.length === 0 ? (
                <div className={estilos.vacio}>
                    <ion-icon name="people-outline"></ion-icon>
                    <h3>No hay trabajadores registrados</h3>
                    <p>Agrega tu primer trabajador para comenzar</p>
                    <button 
                        className={estilos.btnCrear}
                        onClick={() => setVista('nuevo')}
                    >
                        <ion-icon name="person-add-outline"></ion-icon>
                        Crear Primer Trabajador
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
                                                Activo
                                            </span>
                                        ) : (
                                            <span className={`${estilos.badge} ${estilos.inactivo}`}>
                                                <ion-icon name="close-circle"></ion-icon>
                                                Inactivo
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
                                                <span className={estilos.infoLabel}>Especialidad</span>
                                                <span className={estilos.infoValor}>{trabajador.especialidad}</span>
                                            </div>
                                        </div>
                                    )}

                                    {trabajador.cedula && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="card-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>Cédula</span>
                                                <span className={estilos.infoValor}>{trabajador.cedula}</span>
                                            </div>
                                        </div>
                                    )}

                                    {trabajador.telefono && (
                                        <div className={estilos.infoItem}>
                                            <ion-icon name="call-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.infoLabel}>Teléfono</span>
                                                <span className={estilos.infoValor}>{trabajador.telefono}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={estilos.estadisticas}>
                                        <div className={estilos.stat}>
                                            <ion-icon name="wallet-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>RD$ {(trabajador.salario_diario || 0).toLocaleString()}</span>
                                                <span className={estilos.statLabel}>Salario Diario</span>
                                            </div>
                                        </div>
                                        <div className={estilos.stat}>
                                            <ion-icon name="business-outline"></ion-icon>
                                            <div>
                                                <span className={estilos.statValor}>{trabajador.obras_activas || 0}</span>
                                                <span className={estilos.statLabel}>Obras Activas</span>
                                            </div>
                                        </div>
                                    </div>

                                    {trabajador.fecha_ingreso && (
                                        <div className={estilos.fechaIngreso}>
                                            <ion-icon name="calendar-outline"></ion-icon>
                                            <span>Ingreso: {new Date(trabajador.fecha_ingreso).toLocaleDateString()}</span>
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
                                        Ver Detalle
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
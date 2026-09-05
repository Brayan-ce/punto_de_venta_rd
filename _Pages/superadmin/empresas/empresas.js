"use client"
import { useEffect, useState } from 'react'
import { obtenerEmpresas, toggleEstadoEmpresa, crearEmpresa, actualizarEmpresa, eliminarEmpresa, obtenerConteoRegistrosEmpresa } from './servidor'
import ModulosEmpresa from './modulos/modulos'
import estilos from './empresas.module.css'

export default function EmpresasSuperAdmin() {
    const [tema, setTema] = useState('light')
    const [empresas, setEmpresas] = useState([])
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todas')
    const [busqueda, setBusqueda] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [mostrarModal, setMostrarModal] = useState(false)
    const [mostrarModalModulos, setMostrarModalModulos] = useState(false)
    const [empresaSeleccionadaModulos, setEmpresaSeleccionadaModulos] = useState(null)
    const [modoEdicion, setModoEdicion] = useState(false)
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
    const [erroresForm, setErroresForm] = useState({})

    const [formData, setFormData] = useState({
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
        moneda: 'DOP',
        simbolo_moneda: 'RD$',
        impuesto_nombre: 'ITBIS',
        impuesto_porcentaje: '18.00'
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
        cargarEmpresas()
    }, [])

    const cargarEmpresas = async () => {
        setCargando(true)
        try {
            const resultado = await obtenerEmpresas()
            if (resultado.success) {
                setEmpresas(resultado.empresas)
            }
        } catch (error) {
            console.error('Error al cargar empresas:', error)
        } finally {
            setCargando(false)
        }
    }

    const validarFormulario = () => {
        const errores = {}
        
        if (!formData.nombre_empresa.trim()) {
            errores.nombre_empresa = 'El nombre es requerido'
        }
        
        if (!formData.rnc.trim()) {
            errores.rnc = 'El RNC es requerido'
        } else if (formData.rnc.length < 9 || formData.rnc.length > 11) {
            errores.rnc = 'El RNC debe tener entre 9 y 11 caracteres'
        }
        
        if (!formData.razon_social.trim()) {
            errores.razon_social = 'La razon social es requerida'
        }
        
        if (!formData.nombre_comercial.trim()) {
            errores.nombre_comercial = 'El nombre comercial es requerido'
        }
        
        if (!formData.actividad_economica.trim()) {
            errores.actividad_economica = 'La actividad economica es requerida'
        }
        
        if (!formData.direccion.trim()) {
            errores.direccion = 'La direccion es requerida'
        }
        
        if (!formData.sector.trim()) {
            errores.sector = 'El sector es requerido'
        }
        
        if (!formData.municipio.trim()) {
            errores.municipio = 'El municipio es requerido'
        }
        
        if (!formData.provincia.trim()) {
            errores.provincia = 'La provincia es requerida'
        }
        
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errores.email = 'Email invalido'
        }

        setErroresForm(errores)
        return Object.keys(errores).length === 0
    }

    const manejarToggleEstado = async (empresaId, estadoActual) => {
        if (!confirm(`Estas seguro de ${estadoActual ? 'desactivar' : 'activar'} esta empresa?`)) {
            return
        }

        setProcesando(true)
        try {
            const resultado = await toggleEstadoEmpresa(empresaId, !estadoActual)
            if (resultado.success) {
                await cargarEmpresas()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al cambiar estado')
            }
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const abrirModalCrear = () => {
        setModoEdicion(false)
        setEmpresaSeleccionada(null)
        setFormData({
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
            moneda: 'DOP',
            simbolo_moneda: 'RD$',
            impuesto_nombre: 'ITBIS',
            impuesto_porcentaje: '18.00'
        })
        setErroresForm({})
        setMostrarModal(true)
    }

    const abrirModalEditar = (empresa) => {
        setModoEdicion(true)
        setEmpresaSeleccionada(empresa)
        setFormData({
            nombre_empresa: empresa.nombre_empresa,
            rnc: empresa.rnc,
            razon_social: empresa.razon_social,
            nombre_comercial: empresa.nombre_comercial || '',
            actividad_economica: empresa.actividad_economica || '',
            direccion: empresa.direccion,
            sector: empresa.sector || '',
            municipio: empresa.municipio || '',
            provincia: empresa.provincia,
            telefono: empresa.telefono || '',
            email: empresa.email || '',
            moneda: empresa.moneda || 'DOP',
            simbolo_moneda: empresa.simbolo_moneda || 'RD$',
            impuesto_nombre: empresa.impuesto_nombre || 'ITBIS',
            impuesto_porcentaje: empresa.impuesto_porcentaje || '18.00'
        })
        setErroresForm({})
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setModoEdicion(false)
        setEmpresaSeleccionada(null)
        setErroresForm({})
    }

    const manejarCambioInput = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (erroresForm[name]) {
            setErroresForm(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const manejarSubmit = async (e) => {
        e.preventDefault()
        
        if (!validarFormulario()) {
            return
        }

        setProcesando(true)
        try {
            let resultado
            if (modoEdicion) {
                resultado = await actualizarEmpresa(empresaSeleccionada.id, formData)
            } else {
                resultado = await crearEmpresa(formData)
            }

            if (resultado.success) {
                await cargarEmpresas()
                cerrarModal()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al procesar la solicitud')
            }
        } catch (error) {
            console.error('Error al guardar empresa:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const manejarEliminar = async (empresaId, nombreEmpresa) => {
        // Paso 1: Obtener conteo de registros asociados
        setProcesando(true)
        try {
            const resultadoConteo = await obtenerConteoRegistrosEmpresa(empresaId)
            if (!resultadoConteo.success) {
                alert(resultadoConteo.mensaje || 'Error al obtener información de la empresa')
                setProcesando(false)
                return
            }

            const { usuarios, productos, clientes, proveedores, ventas, compras, cajas, gastos, categorias, marcas, movimientos } = resultadoConteo.conteo
            const totalRegistros = usuarios + productos + clientes + proveedores + ventas + compras + cajas + gastos + categorias + marcas + movimientos

            // Construir mensaje de advertencia
            let mensajeAdvertencia = `⚠️ ELIMINACIÓN DEFINITIVA\n\n`
            mensajeAdvertencia += `Esta acción eliminará PERMANENTEMENTE:\n\n`
            mensajeAdvertencia += `• La empresa: ${nombreEmpresa}\n`
            
            if (totalRegistros > 0) {
                if (usuarios > 0) mensajeAdvertencia += `• ${usuarios} usuario(s) y TODOS sus registros\n`
                if (productos > 0) mensajeAdvertencia += `• ${productos} producto(s)\n`
                if (clientes > 0) mensajeAdvertencia += `• ${clientes} cliente(s)\n`
                if (proveedores > 0) mensajeAdvertencia += `• ${proveedores} proveedor(es)\n`
                if (ventas > 0) mensajeAdvertencia += `• ${ventas} venta(s)\n`
                if (compras > 0) mensajeAdvertencia += `• ${compras} compra(s)\n`
                if (cajas > 0) mensajeAdvertencia += `• ${cajas} caja(s)\n`
                if (gastos > 0) mensajeAdvertencia += `• ${gastos} gasto(s)\n`
                if (categorias > 0) mensajeAdvertencia += `• ${categorias} categoría(s)\n`
                if (marcas > 0) mensajeAdvertencia += `• ${marcas} marca(s)\n`
                if (movimientos > 0) mensajeAdvertencia += `• ${movimientos} movimiento(s) de inventario\n`
                mensajeAdvertencia += `\n`
            } else {
                mensajeAdvertencia += `• No tiene registros asociados\n\n`
            }
            
            mensajeAdvertencia += `❗ NO existe recuperación\n\n`
            mensajeAdvertencia += `Escribe "ELIMINAR DEFINITIVAMENTE" para continuar:`

            // Paso 2: Confirmación explícita con texto requerido
            const confirmacion = prompt(mensajeAdvertencia)
            
            if (confirmacion !== 'ELIMINAR DEFINITIVAMENTE') {
                if (confirmacion !== null) {
                    alert('Eliminación cancelada. Debes escribir exactamente "ELIMINAR DEFINITIVAMENTE" para continuar.')
                }
                setProcesando(false)
                return
            }

            // Paso 3: Ejecutar eliminación total
            const resultado = await eliminarEmpresa(empresaId)
            if (resultado.success) {
                await cargarEmpresas()
                alert(resultado.mensaje)
            } else {
                alert(resultado.mensaje || 'Error al eliminar empresa')
            }
        } catch (error) {
            console.error('Error al eliminar empresa:', error)
            alert('Error al procesar la solicitud')
        } finally {
            setProcesando(false)
        }
    }

    const empresasFiltradas = empresas.filter(empresa => {
        const cumpleFiltro = filtro === 'todas' || 
                            (filtro === 'activas' && empresa.activo) ||
                            (filtro === 'inactivas' && !empresa.activo)
        
        const cumpleBusqueda = busqueda === '' ||
                              empresa.nombre_empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
                              empresa.rnc.toLowerCase().includes(busqueda.toLowerCase())
        
        return cumpleFiltro && cumpleBusqueda
    })

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className={`${estilos.contenedor} ${estilos[tema]}`}>
            <div className={estilos.header}>
                <div>
                    <h1 className={estilos.titulo}>Empresas</h1>
                    <p className={estilos.subtitulo}>Gestiona todas las empresas registradas</p>
                </div>
                <button 
                    className={estilos.btnNuevo}
                    onClick={abrirModalCrear}
                >
                    <ion-icon name="add-circle-outline"></ion-icon>
                    <span>Nueva Empresa</span>
                </button>
            </div>

            <div className={estilos.controles}>
                <div className={estilos.busqueda}>
                    <ion-icon name="search-outline"></ion-icon>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RNC..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={estilos.inputBusqueda}
                    />
                </div>

                <div className={estilos.filtros}>
                    <button
                        className={`${estilos.filtroBtn} ${filtro === 'todas' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('todas')}
                    >
                        Todas
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${filtro === 'activas' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('activas')}
                    >
                        Activas
                    </button>
                    <button
                        className={`${estilos.filtroBtn} ${filtro === 'inactivas' ? estilos.activo : ''}`}
                        onClick={() => setFiltro('inactivas')}
                    >
                        Inactivas
                    </button>
                </div>
            </div>

            {cargando ? (
                <div className={estilos.cargando}>
                    <ion-icon name="hourglass-outline" className={estilos.iconoCargando}></ion-icon>
                    <span>Cargando empresas...</span>
                </div>
            ) : empresasFiltradas.length === 0 ? (
                <div className={`${estilos.vacio} ${estilos[tema]}`}>
                    <ion-icon name="folder-open-outline"></ion-icon>
                    <span>No hay empresas que coincidan con tu busqueda</span>
                </div>
            ) : (
                <div className={estilos.grid}>
                    {empresasFiltradas.map((empresa) => (
                        <div key={empresa.id} className={`${estilos.card} ${estilos[tema]}`}>
                            <div className={estilos.cardHeader}>
                                <h3 className={estilos.nombre}>{empresa.nombre_empresa}</h3>
                                <span className={`${estilos.badge} ${empresa.activo ? estilos.activo : estilos.inactivo}`}>
                                    {empresa.activo ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>

                            <div className={estilos.cardBody}>
                                <div className={estilos.fila}>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>RNC</span>
                                        <span className={estilos.valor}>{empresa.rnc}</span>
                                    </div>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Telefono</span>
                                        <span className={estilos.valor}>{empresa.telefono || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Razon Social</span>
                                    <span className={estilos.valor}>{empresa.razon_social}</span>
                                </div>

                                <div className={estilos.campo}>
                                    <span className={estilos.label}>Email</span>
                                    <span className={estilos.valor}>{empresa.email || 'N/A'}</span>
                                </div>

                                <div className={estilos.separador}></div>

                                <div className={estilos.fila}>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Direccion</span>
                                        <span className={estilos.valor}>{empresa.direccion}</span>
                                    </div>
                                    <div className={estilos.campo}>
                                        <span className={estilos.label}>Provincia</span>
                                        <span className={estilos.valor}>{empresa.provincia}</span>
                                    </div>
                                </div>

                                <div className={estilos.fecha}>
                                    Registrada: {formatearFecha(empresa.fecha_creacion)}
                                </div>
                            </div>

                            <div className={estilos.cardFooter}>
                                <button
                                    className={estilos.btnEditar}
                                    onClick={() => abrirModalEditar(empresa)}
                                    disabled={procesando}
                                >
                                    <ion-icon name="create-outline"></ion-icon>
                                    <span>Editar</span>
                                </button>
                                <button
                                    className={estilos.btnModulos}
                                    onClick={() => {
                                        setEmpresaSeleccionadaModulos(empresa)
                                        setMostrarModalModulos(true)
                                    }}
                                    disabled={procesando}
                                    title="Gestionar módulos"
                                >
                                    <ion-icon name="apps-outline"></ion-icon>
                                    <span>Módulos</span>
                                </button>
                                <button
                                    className={empresa.activo ? estilos.btnDesactivar : estilos.btnActivar}
                                    onClick={() => manejarToggleEstado(empresa.id, empresa.activo)}
                                    disabled={procesando}
                                >
                                    <ion-icon name={empresa.activo ? 'close-circle-outline' : 'checkmark-circle-outline'}></ion-icon>
                                    <span>{empresa.activo ? 'Desactivar' : 'Activar'}</span>
                                </button>
                                <button
                                    className={estilos.btnEliminar}
                                    onClick={() => manejarEliminar(empresa.id, empresa.nombre_empresa)}
                                    disabled={procesando}
                                >
                                    <ion-icon name="trash-outline"></ion-icon>
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mostrarModal && (
                <div className={estilos.modalOverlay} onClick={cerrarModal}>
                    <div className={`${estilos.modal} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>{modoEdicion ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
                            <button className={estilos.btnCerrar} onClick={cerrarModal}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>

                        <form onSubmit={manejarSubmit} className={estilos.modalBody}>
                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.subtituloForm}>Informacion General</h3>
                                
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Nombre Empresa *</label>
                                        <input
                                            type="text"
                                            name="nombre_empresa"
                                            value={formData.nombre_empresa}
                                            onChange={manejarCambioInput}
                                            className={erroresForm.nombre_empresa ? estilos.inputError : ''}
                                        />
                                        {erroresForm.nombre_empresa && (
                                            <span className={estilos.mensajeError}>{erroresForm.nombre_empresa}</span>
                                        )}
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>RNC *</label>
                                        <input
                                            type="text"
                                            name="rnc"
                                            value={formData.rnc}
                                            onChange={manejarCambioInput}
                                            maxLength="11"
                                            className={erroresForm.rnc ? estilos.inputError : ''}
                                        />
                                        {erroresForm.rnc && (
                                            <span className={estilos.mensajeError}>{erroresForm.rnc}</span>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Razon Social *</label>
                                    <input
                                        type="text"
                                        name="razon_social"
                                        value={formData.razon_social}
                                        onChange={manejarCambioInput}
                                        className={erroresForm.razon_social ? estilos.inputError : ''}
                                    />
                                    {erroresForm.razon_social && (
                                        <span className={estilos.mensajeError}>{erroresForm.razon_social}</span>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Nombre Comercial *</label>
                                    <input
                                        type="text"
                                        name="nombre_comercial"
                                        value={formData.nombre_comercial}
                                        onChange={manejarCambioInput}
                                        className={erroresForm.nombre_comercial ? estilos.inputError : ''}
                                    />
                                    {erroresForm.nombre_comercial && (
                                        <span className={estilos.mensajeError}>{erroresForm.nombre_comercial}</span>
                                    )}
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Actividad Economica *</label>
                                    <input
                                        type="text"
                                        name="actividad_economica"
                                        value={formData.actividad_economica}
                                        onChange={manejarCambioInput}
                                        className={erroresForm.actividad_economica ? estilos.inputError : ''}
                                    />
                                    {erroresForm.actividad_economica && (
                                        <span className={estilos.mensajeError}>{erroresForm.actividad_economica}</span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.subtituloForm}>Ubicacion</h3>
                                
                                <div className={estilos.grupoInput}>
                                    <label>Direccion *</label>
                                    <textarea
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={manejarCambioInput}
                                        rows="2"
                                        className={erroresForm.direccion ? estilos.inputError : ''}
                                    />
                                    {erroresForm.direccion && (
                                        <span className={estilos.mensajeError}>{erroresForm.direccion}</span>
                                    )}
                                </div>

                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Sector *</label>
                                        <input
                                            type="text"
                                            name="sector"
                                            value={formData.sector}
                                            onChange={manejarCambioInput}
                                            className={erroresForm.sector ? estilos.inputError : ''}
                                        />
                                        {erroresForm.sector && (
                                            <span className={estilos.mensajeError}>{erroresForm.sector}</span>
                                        )}
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Municipio *</label>
                                        <input
                                            type="text"
                                            name="municipio"
                                            value={formData.municipio}
                                            onChange={manejarCambioInput}
                                            className={erroresForm.municipio ? estilos.inputError : ''}
                                        />
                                        {erroresForm.municipio && (
                                            <span className={estilos.mensajeError}>{erroresForm.municipio}</span>
                                        )}
                                    </div>
                                </div>

                                <div className={estilos.grupoInput}>
                                    <label>Provincia *</label>
                                    <input
                                        type="text"
                                        name="provincia"
                                        value={formData.provincia}
                                        onChange={manejarCambioInput}
                                        className={erroresForm.provincia ? estilos.inputError : ''}
                                    />
                                    {erroresForm.provincia && (
                                        <span className={estilos.mensajeError}>{erroresForm.provincia}</span>
                                    )}
                                </div>
                            </div>

                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.subtituloForm}>Contacto</h3>
                                
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Telefono</label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={manejarCambioInput}
                                            maxLength="20"
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={manejarCambioInput}
                                            className={erroresForm.email ? estilos.inputError : ''}
                                        />
                                        {erroresForm.email && (
                                            <span className={estilos.mensajeError}>{erroresForm.email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.seccionForm}>
                                <h3 className={estilos.subtituloForm}>Configuracion Fiscal</h3>
                                
                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Moneda</label>
                                        <select
                                            name="moneda"
                                            value={formData.moneda}
                                            onChange={manejarCambioInput}
                                        >
                                            <option value="DOP">DOP - Peso Dominicano</option>
                                            <option value="USD">USD - Dolar</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Simbolo Moneda</label>
                                        <input
                                            type="text"
                                            name="simbolo_moneda"
                                            value={formData.simbolo_moneda}
                                            onChange={manejarCambioInput}
                                            maxLength="5"
                                        />
                                    </div>
                                </div>

                                <div className={estilos.filaForm}>
                                    <div className={estilos.grupoInput}>
                                        <label>Nombre Impuesto</label>
                                        <input
                                            type="text"
                                            name="impuesto_nombre"
                                            value={formData.impuesto_nombre}
                                            onChange={manejarCambioInput}
                                        />
                                    </div>

                                    <div className={estilos.grupoInput}>
                                        <label>Porcentaje Impuesto</label>
                                        <input
                                            type="number"
                                            name="impuesto_porcentaje"
                                            value={formData.impuesto_porcentaje}
                                            onChange={manejarCambioInput}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={estilos.modalFooter}>
                                <button
                                    type="button"
                                    className={estilos.btnCancelar}
                                    onClick={cerrarModal}
                                    disabled={procesando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={estilos.btnGuardar}
                                    disabled={procesando}
                                >
                                    {procesando ? 'Procesando...' : modoEdicion ? 'Actualizar' : 'Crear Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Módulos */}
            {mostrarModalModulos && empresaSeleccionadaModulos && (
                <div className={estilos.modalOverlay} onClick={() => setMostrarModalModulos(false)}>
                    <div className={`${estilos.modalModulos} ${estilos[tema]}`} onClick={(e) => e.stopPropagation()}>
                        <div className={estilos.modalHeader}>
                            <h2>Gestionar Módulos</h2>
                            <button className={estilos.btnCerrar} onClick={() => setMostrarModalModulos(false)}>
                                <ion-icon name="close-outline"></ion-icon>
                            </button>
                        </div>
                        <div className={estilos.modalBodyModulos}>
                            <ModulosEmpresa 
                                empresaId={empresaSeleccionadaModulos.id}
                                nombreEmpresa={empresaSeleccionadaModulos.nombre_empresa}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    AlertCircle,
    Phone,
    Mail,
    FileText,
    X,
    Check,
    GitMerge
} from 'lucide-react'
import {
    fusionarClientes,
    descartarDuplicado as descartarDuplicadoAction,
    detectarClientesDuplicados as detectarDuplicadosAction
} from '@/_Pages/superadmin/depuracion/clientes/servidor'
import s from './clientes.module.css'

export default function ClientesDepuracion({ duplicadosIniciales = [] }) {
    const [duplicados, setDuplicados] = useState(duplicadosIniciales)
    const [filtroCriterio, setFiltroCriterio] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [modalFusion, setModalFusion] = useState(null)
    const [clientePrincipalSeleccionado, setClientePrincipalSeleccionado] = useState(null)
    const [motivoFusion, setMotivoFusion] = useState('')
    const [cargando, setCargando] = useState(false)
    const [tema, setTema] = useState('light')

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.body.classList.contains('dark-mode') ||
                document.documentElement.classList.contains('dark')
            setTema(isDark ? 'dark' : 'light')
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    // Filtrar duplicados
    const duplicadosFiltrados = duplicados.filter(dup => {
        const clientePrincipalNombre = dup.cliente_principal_nombre || '';
        const clienteDuplicadoNombre = dup.cliente_duplicado_nombre || '';
        const nombreEmpresa = dup.nombre_empresa || '';

        const coincideBusqueda =
            clientePrincipalNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            clienteDuplicadoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            nombreEmpresa.toLowerCase().includes(busqueda.toLowerCase())

        const coincideCriterio = filtroCriterio === 'todos' || dup.criterio_deteccion === filtroCriterio

        return coincideBusqueda && coincideCriterio
    })

    const abrirModalFusion = (duplicado) => {
        setModalFusion(duplicado)
        const principalEsC1 = (duplicado.cliente_principal_compras || 0) >= (duplicado.cliente_duplicado_compras || 0)
        setClientePrincipalSeleccionado(principalEsC1 ? duplicado.cliente_principal_id : duplicado.cliente_duplicado_id)
        setMotivoFusion('')
    }

    const cerrarModal = () => {
        setModalFusion(null)
        setClientePrincipalSeleccionado(null)
        setMotivoFusion('')
    }

    const ejecutarFusion = async () => {
        if (!motivoFusion || motivoFusion.length < 10) {
            alert('El motivo debe tener al menos 10 caracteres')
            return
        }

        setCargando(true)

        try {
            const clienteFusionadoId = clientePrincipalSeleccionado === modalFusion.cliente_principal_id
                ? modalFusion.cliente_duplicado_id
                : modalFusion.cliente_principal_id

            const resultado = await fusionarClientes({
                clientePrincipalId: clientePrincipalSeleccionado,
                clienteFusionadoId: clienteFusionadoId,
                motivo: motivoFusion
            })

            if (resultado.success) {
                setDuplicados(prev => prev.filter(d => d.id !== modalFusion.id))
                cerrarModal()
                alert('¡Fusión completada exitosamente!')
            } else {
                alert('Error: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error(error)
            alert('Error al procesar la fusión')
        } finally {
            setCargando(false)
        }
    }

    const descartarDuplicado = async (duplicadoId) => {
        if (confirm('¿Está seguro de descartar esta detección ("No es duplicado")?')) {
            try {
                const resultado = await descartarDuplicadoAction(duplicadoId, "Descarte manual por superadmin")
                if (resultado.success) {
                    setDuplicados(prev => prev.filter(d => d.id !== duplicadoId))
                } else {
                    alert('Error: ' + resultado.mensaje)
                }
            } catch (error) {
                console.error(error)
                alert('Error al descartar')
            }
        }
    }

    const detectarDuplicados = async () => {
        setCargando(true)
        try {
            const resultado = await detectarDuplicadosAction()
            if (resultado.success) {
                alert('Detección completada. Recargue la página para ver nuevos resultados.')
                window.location.reload()
            } else {
                alert('Error: ' + resultado.mensaje)
            }
        } catch (error) {
            console.error(error)
            alert('Error al ejecutar detección')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`${s.contenedor} ${s[tema]}`}>
            {/* Header */}
            <div className={s.header}>
                <div>
                    <h1 className={s.titulo}>
                        <Users className="w-8 h-8 text-blue-600" />
                        Depuración de Clientes
                    </h1>
                    <p className={s.subtitulo}>
                        Detectar y fusionar clientes duplicados
                    </p>
                </div>
                <button
                    onClick={detectarDuplicados}
                    disabled={cargando}
                    className={s.btnAccion}
                >
                    <Search className="w-5 h-5" />
                    {cargando ? 'Procesando...' : 'Ejecutar Detección Manual'}
                </button>
            </div>

            {/* Filtros */}
            <div className={`${s.filtrosBar} ${s[tema]}`}>
                <div className={s.inputGrupo}>
                    <Search className={s.inputIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o empresa..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={s.input}
                    />
                </div>

                <select
                    value={filtroCriterio}
                    onChange={(e) => setFiltroCriterio(e.target.value)}
                    className={s.select}
                >
                    <option value="todos">Todos los criterios</option>
                    <option value="telefono">Teléfono idéntico</option>
                    <option value="rnc">RNC idéntico</option>
                    <option value="email">Email idéntico</option>
                    <option value="nombre_similar">Nombre similar</option>
                </select>

                <div className={s.conteoCard}>
                    <span className={s.numeroResaltado}>{duplicadosFiltrados.length}</span>
                    <span>duplicados pendientes</span>
                </div>
            </div>

            {/* Lista de duplicados */}
            <div className={s.lista}>
                {duplicadosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron duplicados</h3>
                        <p className="text-gray-600">
                            {busqueda || filtroCriterio !== 'todos'
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Ejecuta la detección para encontrar clientes duplicados'
                            }
                        </p>
                    </div>
                ) : (
                    duplicadosFiltrados.map((dup) => (
                        <div key={dup.id} className={`${s.cardDuplicado} ${s[tema]}`}>
                            <div className={s.cardHeader}>
                                <div className={s.headerInfo}>
                                    <span className={`${s.badgeCriterio} ${dup.criterio_deteccion === 'telefono' ? s.telefono :
                                            dup.criterio_deteccion === 'rnc' ? s.rnc :
                                                dup.criterio_deteccion === 'email' ? s.email : s.similar
                                        }`}>
                                        {dup.criterio_deteccion === 'telefono' && 'Teléfono idéntico'}
                                        {dup.criterio_deteccion === 'rnc' && 'RNC idéntico'}
                                        {dup.criterio_deteccion === 'email' && 'Email idéntico'}
                                        {dup.criterio_deteccion === 'nombre_similar' && `Similitud: ${dup.similitud_porcentaje}%`}
                                    </span>
                                    <span className={s.empresaNombre}>{dup.nombre_empresa}</span>
                                    <span className={s.fechaDeteccion}>{new Date(dup.fecha_deteccion).toLocaleString('es-DO')}</span>
                                </div>
                                <div className={s.accionesHeader}>
                                    <button onClick={() => abrirModalFusion(dup)} className={s.btnFusionar}>
                                        <GitMerge size={16} /> Fusionar
                                    </button>
                                    <button onClick={() => descartarDuplicado(dup.id)} className={s.btnDescartar}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className={s.comparacion}>
                                {/* Cliente A */}
                                <div className={s.clientePanel}>
                                    <div className={s.clienteTitulo}>
                                        <span>Cliente A (Original)</span>
                                        <span className={s.clienteId}>ID: {dup.cliente_principal_id}</span>
                                    </div>
                                    <div className={s.itemDato}>
                                        <div className={s.itemLabel}>Nombre</div>
                                        <div className={s.itemValor}>{dup.cliente_principal_nombre}</div>
                                    </div>
                                    <div className={s.itemDato}>
                                        <div className={s.itemLabel}>Contacto</div>
                                        <div className={s.itemValor}><Phone size={14} className={s.iconDato} /> {dup.cliente_principal_telefono || '---'}</div>
                                        <div className={s.itemValor}><Mail size={14} className={s.iconDato} /> {dup.cliente_principal_email || '---'}</div>
                                    </div>
                                    <div className={s.statsPanel}>
                                        <div className={s.statItem}>
                                            <div className={s.itemLabel}>Total Compras</div>
                                            <div className={`${s.val} ${s.compras}`}>RD${(dup.cliente_principal_compras || 0).toLocaleString()}</div>
                                        </div>
                                        <div className={s.statItem}>
                                            <div className={s.itemLabel}>Ventas</div>
                                            <div className={`${s.val} ${s.ventas}`}>{dup.cliente_principal_ventas}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cliente B */}
                                <div className={s.clientePanel}>
                                    <div className={s.clienteTitulo}>
                                        <span>Cliente B (Candidato)</span>
                                        <span className={s.clienteId}>ID: {dup.cliente_duplicado_id}</span>
                                    </div>
                                    <div className={s.itemDato}>
                                        <div className={s.itemLabel}>Nombre</div>
                                        <div className={s.itemValor}>{dup.cliente_duplicado_nombre}</div>
                                    </div>
                                    <div className={s.itemDato}>
                                        <div className={s.itemLabel}>Contacto</div>
                                        <div className={s.itemValor}><Phone size={14} className={s.iconDato} /> {dup.cliente_duplicado_telefono || '---'}</div>
                                        <div className={s.itemValor}><Mail size={14} className={s.iconDato} /> {dup.cliente_duplicado_email || '---'}</div>
                                    </div>
                                    <div className={s.statsPanel}>
                                        <div className={s.statItem}>
                                            <div className={s.itemLabel}>Total Compras</div>
                                            <div className={`${s.val} ${s.compras}`}>RD${(dup.cliente_duplicado_compras || 0).toLocaleString()}</div>
                                        </div>
                                        <div className={s.statItem}>
                                            <div className={s.itemLabel}>Ventas</div>
                                            <div className={`${s.val} ${s.ventas}`}>{dup.cliente_duplicado_ventas}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Fusión */}
            {modalFusion && (
                <div className={s.modalOverlay}>
                    <div className={`${s.modal} ${s[tema]}`}>
                        <div className={s.modalHeader}>
                            <h2 className={s.modalTitle}><GitMerge size={28} /> Fusionar Clientes</h2>
                            <button onClick={cerrarModal} className="text-white hover:opacity-70 transition-opacity"><X size={24} /></button>
                        </div>
                        <div className={s.modalBody}>
                            <p className="text-sm text-gray-500 mb-4">Seleccione el cliente que desea CONSERVAR:</p>
                            <div className={s.opcionesGrid}>
                                <button
                                    onClick={() => setClientePrincipalSeleccionado(modalFusion.cliente_principal_id)}
                                    className={`${s.opcionBtn} ${clientePrincipalSeleccionado === modalFusion.cliente_principal_id ? s.activo : ''}`}
                                >
                                    <span className="font-bold block mb-1">Cliente A</span>
                                    <span className="text-sm block">{modalFusion.cliente_principal_nombre}</span>
                                    <span className="text-xs text-gray-500">{modalFusion.cliente_principal_ventas} ventas</span>
                                    {clientePrincipalSeleccionado === modalFusion.cliente_principal_id && <div className={s.checkIcon}><Check size={14} /></div>}
                                </button>
                                <button
                                    onClick={() => setClientePrincipalSeleccionado(modalFusion.cliente_duplicado_id)}
                                    className={`${s.opcionBtn} ${clientePrincipalSeleccionado === modalFusion.cliente_duplicado_id ? s.activo : ''}`}
                                >
                                    <span className="font-bold block mb-1">Cliente B</span>
                                    <span className="text-sm block">{modalFusion.cliente_duplicado_nombre}</span>
                                    <span className="text-xs text-gray-500">{modalFusion.cliente_duplicado_ventas} ventas</span>
                                    {clientePrincipalSeleccionado === modalFusion.cliente_duplicado_id && <div className={s.checkIcon}><Check size={14} /></div>}
                                </button>
                            </div>

                            <div className={`${s.alertaModal} ${s[tema]}`}>
                                <AlertCircle size={20} className="text-orange-500 mt-1" />
                                <div className="text-sm">
                                    <p className="font-bold mb-1">Resultado de la fusión:</p>
                                    <ul className="m-0 p-0 list-none opacity-80">
                                        <li>• Todas las ventas se reasignarán al cliente principal</li>
                                        <li>• Los totales de compras se sumarán</li>
                                        <li>• El cliente secundario quedará marcado como "fusionado"</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-bold block mb-2">Motivo de la fusión (min 10 car.)</label>
                                <textarea
                                    value={motivoFusion}
                                    onChange={(e) => setMotivoFusion(e.target.value)}
                                    rows={3}
                                    className={s.textarea}
                                    placeholder="Ej: Mismos datos, cliente B tiene info incompleta..."
                                />
                            </div>
                        </div>
                        <div className={s.modalFooter}>
                            <button onClick={cerrarModal} className={s.btnSecundario}>Cancelar</button>
                            <button
                                onClick={ejecutarFusion}
                                disabled={!clientePrincipalSeleccionado || motivoFusion.length < 10 || cargando}
                                className={s.btnPrimario}
                            >
                                {cargando ? 'Procesando...' : <><GitMerge size={20} /> Confirmar Fusión</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

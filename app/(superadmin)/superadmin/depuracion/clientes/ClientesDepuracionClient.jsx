'use client'

import { useState } from 'react'
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

export default function ClientesDepuracionClient({ duplicadosIniciales = [] }) {
    const [duplicados, setDuplicados] = useState(duplicadosIniciales)
    const [filtroCriterio, setFiltroCriterio] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [modalFusion, setModalFusion] = useState(null)
    const [clientePrincipalSeleccionado, setClientePrincipalSeleccionado] = useState(null)
    const [motivoFusion, setMotivoFusion] = useState('')
    const [cargando, setCargando] = useState(false)

    // Filtrar duplicados
    const duplicadosFiltrados = duplicados.filter(dup => {
        // Asegurar que existan los objetos antes de acceder a sus propiedades
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
        // Por defecto sugerimos el que tiene más compras como principal
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
                alert('Error: ' + result.mensaje)
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
                    alert('Error: ' + result.mensaje)
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
                // Idealmente recargaríamos la data aquí
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
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Depuración de Clientes
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Detectar y fusionar clientes duplicados
                        </p>
                    </div>
                    <button
                        onClick={detectarDuplicados}
                        disabled={cargando}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        {cargando ? 'Procesando...' : 'Ejecutar Detección Manual'}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Búsqueda */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o empresa..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filtro por criterio */}
                    <div>
                        <select
                            value={filtroCriterio}
                            onChange={(e) => setFiltroCriterio(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="todos">Todos los criterios</option>
                            <option value="telefono">Teléfono idéntico</option>
                            <option value="rnc">RNC idéntico</option>
                            <option value="email">Email idéntico</option>
                            <option value="nombre_similar">Nombre similar</option>
                        </select>
                    </div>

                    {/* Estadísticas */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="px-4 py-2 bg-blue-50 rounded-lg">
                            <span className="text-blue-600 font-bold text-lg">
                                {duplicadosFiltrados.length}
                            </span>
                            <span className="text-gray-600 ml-2">duplicados pendientes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de duplicados */}
            <div className="space-y-4">
                {duplicadosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No se encontraron duplicados
                        </h3>
                        <p className="text-gray-600">
                            {busqueda || filtroCriterio !== 'todos'
                                ? 'Intenta ajustar los filtros de búsqueda'
                                : 'Ejecuta la detección para encontrar clientes duplicados'
                            }
                        </p>
                    </div>
                ) : (
                    duplicadosFiltrados.map((dup) => (
                        <div
                            key={dup.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Header del duplicado */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${dup.criterio_deteccion === 'telefono'
                                                ? 'bg-blue-100 text-blue-700'
                                                : dup.criterio_deteccion === 'rnc'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : dup.criterio_deteccion === 'email'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {dup.criterio_deteccion === 'telefono' && 'Teléfono idéntico'}
                                            {dup.criterio_deteccion === 'rnc' && 'RNC idéntico'}
                                            {dup.criterio_deteccion === 'email' && 'Email idéntico'}
                                            {dup.criterio_deteccion === 'nombre_similar' && `Similitud: ${dup.similitud_porcentaje}%`}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {dup.nombre_empresa}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(dup.fecha_deteccion).toLocaleString('es-DO')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => abrirModalFusion(dup)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <GitMerge className="w-4 h-4" />
                                            Fusionar
                                        </button>
                                        <button
                                            onClick={() => descartarDuplicado(dup.id)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Descartar"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comparación de clientes */}
                            <div className="grid grid-cols-2 divide-x divide-gray-200">
                                {/* Cliente A (Principal en registro) */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Cliente A (Original)</h3>
                                        <span className="text-xs text-gray-500">ID: {dup.cliente_principal_id}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Nombre</label>
                                            <p className="text-gray-900 font-medium">{dup.cliente_principal_nombre}</p>
                                        </div>

                                        {dup.cliente_principal_telefono && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_principal_telefono}</span>
                                            </div>
                                        )}

                                        {dup.cliente_principal_email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_principal_email}</span>
                                            </div>
                                        )}

                                        {dup.cliente_principal_doc && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_principal_doc}</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Total Compras</label>
                                                <p className="text-lg font-bold text-green-600">
                                                    RD${(dup.cliente_principal_compras || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Ventas</label>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {dup.cliente_principal_ventas}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cliente B (Detectado como duplicado) */}
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Cliente B (Candidato)</h3>
                                        <span className="text-xs text-gray-500">ID: {dup.cliente_duplicado_id}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 uppercase">Nombre</label>
                                            <p className="text-gray-900 font-medium">{dup.cliente_duplicado_nombre}</p>
                                        </div>

                                        {dup.cliente_duplicado_telefono ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_duplicado_telefono}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Phone className="w-4 h-4" />
                                                <span className="text-sm italic">Sin teléfono</span>
                                            </div>
                                        )}

                                        {dup.cliente_duplicado_email ? (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_duplicado_email}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Mail className="w-4 h-4" />
                                                <span className="text-sm italic">Sin email</span>
                                            </div>
                                        )}

                                        {dup.cliente_duplicado_doc ? (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">{dup.cliente_duplicado_doc}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <FileText className="w-4 h-4" />
                                                <span className="text-sm italic">Sin documento</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500">Total Compras</label>
                                                <p className="text-lg font-bold text-green-600">
                                                    RD${(dup.cliente_duplicado_compras || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Ventas</label>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {dup.cliente_duplicado_ventas}
                                                </p>
                                            </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header del modal */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <GitMerge className="w-7 h-7" />
                                        Fusionar Clientes
                                    </h2>
                                    <p className="text-blue-100 mt-1">
                                        Esta acción es irreversible. Seleccione el cliente principal.
                                    </p>
                                </div>
                                <button
                                    onClick={cerrarModal}
                                    className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Selección de cliente principal */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Seleccione el cliente que desea CONSERVAR:
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Opción Cliente A */}
                                    <button
                                        onClick={() => setClientePrincipalSeleccionado(modalFusion.cliente_principal_id)}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${clientePrincipalSeleccionado === modalFusion.cliente_principal_id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-gray-900">Cliente A</span>
                                            {clientePrincipalSeleccionado === modalFusion.cliente_principal_id && (
                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {modalFusion.cliente_principal_nombre}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {modalFusion.cliente_principal_ventas} ventas • RD${(modalFusion.cliente_principal_compras || 0).toFixed(2)}
                                        </p>
                                    </button>

                                    {/* Opción Cliente B */}
                                    <button
                                        onClick={() => setClientePrincipalSeleccionado(modalFusion.cliente_duplicado_id)}
                                        className={`p-4 border-2 rounded-xl text-left transition-all ${clientePrincipalSeleccionado === modalFusion.cliente_duplicado_id
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-gray-900">Cliente B</span>
                                            {clientePrincipalSeleccionado === modalFusion.cliente_duplicado_id && (
                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {modalFusion.cliente_duplicado_nombre}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {modalFusion.cliente_duplicado_ventas} ventas • RD${(modalFusion.cliente_duplicado_compras || 0).toFixed(2)}
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Preview de la fusión */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-yellow-900 mb-1">
                                            Resultado de la fusión:
                                        </p>
                                        <ul className="space-y-1 text-yellow-800">
                                            <li>• Todas las ventas se reasignarán al cliente principal</li>
                                            <li>• Los totales de compras se sumarán</li>
                                            <li>• El cliente secundario quedará marcado como "fusionado"</li>
                                            <li>• Esta acción NO se puede deshacer</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Motivo de fusión */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo de la fusión (mínimo 10 caracteres) *
                                </label>
                                <textarea
                                    value={motivoFusion}
                                    onChange={(e) => setMotivoFusion(e.target.value)}
                                    rows={3}
                                    placeholder="Ej: Clientes con mismo teléfono y nombre similar. Cliente B tiene datos incompletos."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {motivoFusion.length}/10 caracteres mínimos
                                </p>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-3">
                                <button
                                    onClick={cerrarModal}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={ejecutarFusion}
                                    disabled={!clientePrincipalSeleccionado || motivoFusion.length < 10 || cargando}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cargando ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Fusionando...
                                        </>
                                    ) : (
                                        <>
                                            <GitMerge className="w-5 h-5" />
                                            Confirmar Fusión
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

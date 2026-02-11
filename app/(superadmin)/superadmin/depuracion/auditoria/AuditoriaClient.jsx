'use client'

import { useState } from 'react'
import {
    Search,
    Filter,
    Calendar,
    Database,
    User,
    Building,
    Eye,
    ArrowRight
} from 'lucide-react'
import { obtenerRegistrosAuditoria } from '@/_Pages/superadmin/depuracion/auditoria/servidor'

export default function AuditoriaClient({ registrosIniciales = [] }) {
    const [registros, setRegistros] = useState(registrosIniciales)
    const [filtros, setFiltros] = useState({
        modulo: 'todos',
        accion: 'todas',
        empresa: '',
        usuario: '',
        fechaDesde: '',
        fechaHasta: ''
    })
    const [cargando, setCargando] = useState(false)
    const [registroSeleccionado, setRegistroSeleccionado] = useState(null)

    const modulos = ['clientes', 'cajas', 'suscripciones', 'alertas', 'ventas', 'seguridad']

    const handleBuscar = async (e) => {
        e.preventDefault()
        setCargando(true)

        // Preparar objeto de filtros para el server action
        // Nota: El server action espera `empresaId` y `usuarioId` numéricos si se usan, 
        // pero aquí estamos filtrando por texto simple o ID en la búsqueda.
        // Para una implementación real completa, idealmente tendríamos comboboxes con búsqueda de entidades.
        // Por ahora, pasaremos el objeto tal cual y dejaremos que el UI maneje el filtrado visual 
        // o que el server action se actualice para búsqueda difusa si se requiere.
        // Dado el server action actual, haremos una recarga simple o filtrado client-side si los datos son pocos.
        // Para simplificar y dado que `obtenerRegistrosAuditoria` tiene LIMIT 100, 
        // asumiremos que recargamos data del servidor con los filtros disponibles.

        // NOTA: El server action actual filtra por ID exacto. 
        // Vamos a simular el filtrado en cliente para la búsqueda de texto
        // y usar el servidor solo para fechas/modulos si fuera necesario.
        // Para hacerlo robusto, volveremos a pedir al servidor.

        try {
            // Mapeo simple de filtros de UI a Server Action params
            const params = {
                modulo: filtros.modulo,
                accion: filtros.accion,
                fechaDesde: filtros.fechaDesde || null,
                fechaHasta: filtros.fechaHasta || null
                // empresaId y usuarioId requieren IDs numéricos exactos en el server action actual.
                // Si el usuario escribe texto, no funcionará. Lo omitiremos del request al server
                // y filtraremos en cliente los resultados obtenidos por texto.
            }

            const res = await obtenerRegistrosAuditoria(params)

            if (res.success) {
                let resultadoFinal = res.registros

                // Filtrado adicional en cliente para texto libre
                if (filtros.empresa) {
                    const term = filtros.empresa.toLowerCase()
                    resultadoFinal = resultadoFinal.filter(r =>
                        (r.nombre_empresa || '').toLowerCase().includes(term) ||
                        String(r.empresa_id).includes(term)
                    )
                }

                if (filtros.usuario) {
                    const term = filtros.usuario.toLowerCase()
                    resultadoFinal = resultadoFinal.filter(r =>
                        (r.usuario_nombre || '').toLowerCase().includes(term) ||
                        String(r.usuario_id).includes(term)
                    )
                }

                setRegistros(resultadoFinal)
            }
        } catch (error) {
            console.error(error)
            alert('Error al buscar registros')
        } finally {
            setCargando(false)
        }
    }

    const verDetalles = (registro) => {
        setRegistroSeleccionado(registro)
    }

    const cerrarModal = () => {
        setRegistroSeleccionado(null)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Database className="w-8 h-8 text-blue-600" />
                    Auditoría del Sistema
                </h1>
                <p className="text-gray-600 mt-2">
                    Registro histórico de cambios y acciones
                </p>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <form onSubmit={handleBuscar} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Modulo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
                            <select
                                value={filtros.modulo}
                                onChange={e => setFiltros({ ...filtros, modulo: e.target.value })}
                                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="todos">Todos</option>
                                {modulos.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                            </select>
                        </div>

                        {/* Fechas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <input
                                type="date"
                                value={filtros.fechaDesde}
                                onChange={e => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <input
                                type="date"
                                value={filtros.fechaHasta}
                                onChange={e => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Botón Buscar */}
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                {cargando ? 'Buscando...' : <><Search className="w-4 h-4" /> Buscar</>}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <input
                            type="text"
                            placeholder="Filtrar por Empresa (Nombre o ID)"
                            value={filtros.empresa}
                            onChange={e => setFiltros({ ...filtros, empresa: e.target.value })}
                            className="border-gray-300 rounded-lg text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Filtrar por Usuario (Nombre o ID)"
                            value={filtros.usuario}
                            onChange={e => setFiltros({ ...filtros, usuario: e.target.value })}
                            className="border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </form>
            </div>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Fecha/Hora</th>
                                <th className="px-6 py-3">Módulo</th>
                                <th className="px-6 py-3">Acción</th>
                                <th className="px-6 py-3">Empresa / Usuario</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3 text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {registros.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron registros de auditoría.
                                    </td>
                                </tr>
                            ) : (
                                registros.map(reg => (
                                    <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {new Date(reg.fecha_accion).toLocaleString('es-DO')}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium uppercase
                                        ${reg.modulo === 'clientes' ? 'bg-blue-100 text-blue-700' :
                                                    reg.modulo === 'cajas' ? 'bg-yellow-100 text-yellow-700' :
                                                        reg.modulo === 'suscripciones' ? 'bg-purple-100 text-purple-700' :
                                                            reg.modulo === 'alertas' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                }
                                    `}>
                                                {reg.modulo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-900 font-medium">
                                            {reg.accion.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-medium flex items-center gap-1">
                                                    <Building className="w-3 h-3 text-gray-400" />
                                                    {reg.nombre_empresa || 'N/A'}
                                                </span>
                                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {reg.usuario_nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate" title={reg.descripcion}>
                                            {reg.descripcion}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => verDetalles(reg)}
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {ModalDetalle({ registro: registroSeleccionado, onClose: cerrarModal })}
        </div>
    )
}

function ModalDetalle({ registro, onClose }) {
    if (!registro) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-gray-500" />
                        Detalle de Auditoría #{registro.id}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Info General */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Fecha</p>
                            <p className="text-gray-900">{new Date(registro.fecha_accion).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Tipo Acción</p>
                            <p className="text-gray-900 capitalize">{registro.tipo_accion}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Módulo</p>
                            <p className="text-gray-900 capitalize">{registro.modulo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Acción</p>
                            <p className="text-gray-900">{registro.accion}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 uppercase font-bold mb-1">Descripción</p>
                        <p className="text-blue-900 font-medium">{registro.descripcion}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Actor (Usuario)</p>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{registro.usuario_nombre}</p>
                                    <p className="text-xs text-gray-500">ID: {registro.usuario_id} | Tipo: {registro.tipo_usuario}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Entidad Afectada</p>
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{registro.nombre_empresa || 'N/A'}</p>
                                    <p className="text-xs text-gray-500">
                                        Tipo: {registro.entidad_tipo} | ID: {registro.entidad_id}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto">
                        <div>
                            <p className="text-gray-500 mb-2 uppercase border-b border-gray-700 pb-1">Datos Anteriores (JSON)</p>
                            <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(registro.datos_anteriores, null, 2) || 'null'}
                            </pre>
                        </div>
                        <div className="border-l border-gray-700 pl-4">
                            <p className="text-green-500 mb-2 uppercase border-b border-gray-700 pb-1">Datos Nuevos (JSON)</p>
                            <pre className="whitespace-pre-wrap break-all">
                                {JSON.stringify(registro.datos_nuevos, null, 2) || 'null'}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}

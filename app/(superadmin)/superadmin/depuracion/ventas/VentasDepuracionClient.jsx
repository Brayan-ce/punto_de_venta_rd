'use client'

import { useState } from 'react'
import {
    ShoppingCart,
    AlertOctagon,
    Eye,
    FileText
} from 'lucide-react'

export default function VentasDepuracionClient({ ventasAnomalas = [] }) {
    const [ventas, setVentas] = useState(ventasAnomalas)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                    Depuración de Ventas
                </h1>
                <p className="text-gray-600 mt-2">
                    Detección de ventas anómalas (monto cero, sin items, etc.)
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Empresa</th>
                                <th className="px-6 py-3">NCF / No. Interno</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Anomalía Detectada</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <AlertOctagon className="w-12 h-12 mx-auto text-green-300 mb-3" />
                                        <p className="text-lg font-medium text-gray-900">Todo en orden</p>
                                        <p className="text-sm">No se detectaron ventas anómalas en el sistema.</p>
                                    </td>
                                </tr>
                            ) : (
                                ventas.map(venta => (
                                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            {new Date(venta.fecha_venta).toLocaleString('es-DO')}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {venta.nombre_empresa}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs text-gray-500">{venta.ncf || 'Sin NCF'}</span>
                                                <span className="text-xs text-gray-400">Int: {venta.numero_interno}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-bold text-gray-900">
                                            RD$ {parseFloat(venta.total || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                {venta.tipo_anomalia}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 capitalize text-gray-600">
                                            {venta.estado}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1 w-full">
                                                <Eye className="w-3 h-3" /> Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

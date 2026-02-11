"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

// =====================================================
// RE-EXPORT TEMPORAL: Funciones de Módulos Independientes
// =====================================================
// Durante la migración, re-exportamos desde los nuevos módulos
// para mantener compatibilidad con código existente.
// TODO: Eliminar estos re-exports después de migrar todos los imports
// =====================================================

// Re-exportar funciones de planes desde los módulos refactorizados
import {
    obtenerPlanesFinanciamiento,
    eliminarPlanFinanciamiento
} from '../planes/servidor.js'

import { crearPlanFinanciamiento } from '../planes/nuevo/servidor.js'
import { actualizarPlanFinanciamiento, obtenerPlanPorId } from '../planes/editar/servidor.js'

export {
    obtenerPlanesFinanciamiento,
    obtenerPlanPorId,
    crearPlanFinanciamiento,
    actualizarPlanFinanciamiento,
    eliminarPlanFinanciamiento
}

// Re-exportar funciones de contratos desde el nuevo módulo
import {
    obtenerContratos,
    obtenerContratoPorId,
    obtenerCuotasPorContrato,
    crearContratoFinanciamiento,
    actualizarContratoFinanciamiento,
    cancelarContratoFinanciamiento
} from '../contratos/servidor.js'

export {
    obtenerContratos,
    obtenerContratoPorId,
    obtenerCuotasPorContrato,
    crearContratoFinanciamiento,
    actualizarContratoFinanciamiento,
    cancelarContratoFinanciamiento
}

// Re-exportar funciones de cuotas desde el nuevo módulo
import {
    obtenerCuotas,
    obtenerCuotaPorId,
    actualizarCuota,
    calcularMoraCuota,
    obtenerEstadisticasCuotas
} from '../cuotas/servidor.js'

export {
    obtenerCuotas,
    obtenerCuotaPorId,
    actualizarCuota,
    calcularMoraCuota,
    obtenerEstadisticasCuotas
}

// Re-exportar funciones de pagos desde el nuevo módulo
import {
    obtenerPagos,
    obtenerPagoPorId,
    registrarPagoCuota,
    revertirPago,
    obtenerEstadisticasPagos
} from '../pagos/servidor.js'

export {
    obtenerPagos,
    obtenerPagoPorId,
    registrarPagoCuota,
    revertirPago,
    obtenerEstadisticasPagos
}

// Re-exportar funciones de alertas desde el nuevo módulo
import {
    obtenerAlertas,
    obtenerAlertaPorId,
    crearAlerta,
    marcarAlertaResuelta,
    marcarAlertaVista,
    descartarAlerta,
    asignarAlerta,
    obtenerEstadisticasAlertas
} from '../alertas/servidor.js'

export {
    obtenerAlertas,
    obtenerAlertaPorId,
    crearAlerta,
    marcarAlertaResuelta,
    marcarAlertaVista,
    descartarAlerta,
    asignarAlerta,
    obtenerEstadisticasAlertas
}

// Re-exportar funciones de activos desde los módulos correspondientes
import {
    obtenerActivos,
    obtenerEstadisticasActivos
} from '../activos/servidor.js'

import {
    obtenerActivoPorId,
    actualizarActivo
} from '../activos/editar/servidor.js'

import {
    crearActivo
} from '../activos/nuevo/servidor.js'

export {
    obtenerActivos,
    obtenerActivoPorId,
    crearActivo,
    actualizarActivo,
    obtenerEstadisticasActivos
}

// =====================================================
// FUNCIONES DEL DASHBOARD
// =====================================================
// Este archivo ahora solo contiene funciones específicas
// del dashboard de financiamiento. La lógica de negocio
// está en los módulos independientes.
// =====================================================

/**
 * Obtiene métricas del dashboard de financiamiento
 * @returns {Object} { success: boolean, metricas?: Object, mensaje?: string }
 */
export async function obtenerDashboardFinanciamiento() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        // Contratos activos
        const [contratosActivos] = await connection.execute(
            `SELECT COUNT(*) as total FROM contratos_financiamiento
             WHERE empresa_id = ? AND estado = 'activo'`,
            [empresaId]
        )

        // Cuotas vencidas
        const [cuotasVencidas] = await connection.execute(
            `SELECT COUNT(*) as total FROM cuotas_financiamiento
             WHERE empresa_id = ? AND estado = 'vencida'`,
            [empresaId]
        )

        // Saldo pendiente total
        const [saldoPendiente] = await connection.execute(
            `SELECT COALESCE(SUM(saldo_pendiente), 0) as total
             FROM contratos_financiamiento
             WHERE empresa_id = ? AND estado = 'activo'`,
            [empresaId]
        )

        // Cobrado este mes
        const fechaInicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString().split('T')[0]

        const [cobradoMes] = await connection.execute(
            `SELECT COALESCE(SUM(monto_pago), 0) as total
             FROM pagos_financiamiento
             WHERE empresa_id = ? AND DATE(fecha_pago) >= ? AND estado = 'confirmado'`,
            [empresaId, fechaInicioMes]
        )

        // Alertas críticas
        const [alertasCriticas] = await connection.execute(
            `SELECT COUNT(*) as total FROM alertas_financiamiento
             WHERE empresa_id = ? AND severidad = 'critica' AND estado = 'activa'`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            metricas: {
                contratosActivos: parseInt(contratosActivos[0].total),
                cuotasVencidas: parseInt(cuotasVencidas[0].total),
                saldoPendiente: parseFloat(saldoPendiente[0].total),
                cobradoMes: parseFloat(cobradoMes[0].total),
                alertasCriticas: parseInt(alertasCriticas[0].total)
            }
        }

    } catch (error) {
        console.error('Error al obtener dashboard:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar dashboard' }
    }
}

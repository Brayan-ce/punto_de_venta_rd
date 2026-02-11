"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

// ============================================
// BUSCAR CLIENTE PARA EVALUACIÓN
// ============================================

export async function buscarClienteParaEvaluacion(termino) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const terminoLimpio = termino?.toString().trim()

        if (!terminoLimpio || terminoLimpio.length < 2) {
            return { success: false, mensaje: 'Ingrese al menos 2 caracteres' }
        }

        connection = await db.getConnection()

        const like = `%${terminoLimpio}%`

        const [clientes] = await connection.execute(
            `SELECT 
                c.id,
                c.numero_documento,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as nombre_completo,
                c.telefono,
                c.email
            FROM clientes c
            WHERE c.empresa_id = ? 
            AND c.activo = TRUE
            AND c.estado = 'activo'
            AND (
                c.numero_documento LIKE ?
                OR c.nombre LIKE ?
                OR c.apellidos LIKE ?
                OR c.telefono LIKE ?
                OR c.email LIKE ?
            )
            ORDER BY c.nombre ASC
            LIMIT 10`,
            [empresaId, like, like, like, like, like]
        )

        return {
            success: true,
            clientes
        }

    } catch (error) {
        console.error('[buscarClienteParaEvaluacion]', error)
        return { success: false, mensaje: 'Error al buscar cliente' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================
// EVALUAR OTORGAMIENTO DE CRÉDITO
// ============================================

export async function evaluarOtorgamientoCredito(clienteId, montoSolicitado = 0) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        // Obtener datos completos del crédito del cliente
        const [creditoRes] = await connection.execute(
            `SELECT 
                cc.*,
                CONCAT(c.nombre, ' ', IFNULL(c.apellidos, '')) as nombre_completo,
                c.numero_documento as cliente_documento,
                c.telefono,
                c.email
            FROM credito_clientes cc
            INNER JOIN clientes c ON c.id = cc.cliente_id
            WHERE cc.cliente_id = ? 
            AND cc.empresa_id = ?
            AND cc.activo = TRUE`,
            [clienteId, empresaId]
        )

        if (creditoRes.length === 0) {
            return {
                success: true,
                aprobado: false,
                motivo: 'El cliente no tiene crédito configurado',
                datos: null
            }
        }

        const credito = creditoRes[0]

        // Obtener alertas activas
        const [alertasRes] = await connection.execute(
            `SELECT 
                tipo_alerta,
                severidad,
                titulo,
                mensaje
            FROM alertas_credito
            WHERE cliente_id = ? 
            AND empresa_id = ?
            AND estado = 'activa'
            ORDER BY 
                FIELD(severidad, 'critica', 'alta', 'media', 'baja')
            LIMIT 5`,
            [clienteId, empresaId]
        )

        // Obtener deudas vencidas
        const [deudasRes] = await connection.execute(
            `SELECT 
                COUNT(*) as total_vencidas,
                SUM(saldo_pendiente) as monto_vencido
            FROM cuentas_por_cobrar
            WHERE cliente_id = ?
            AND empresa_id = ?
            AND estado_cxc = 'vencida'`,
            [clienteId, empresaId]
        )

        const deudas = deudasRes[0]

        // LÓGICA DE DECISIÓN
        let aprobado = true
        let motivo = ''

        // Regla 1: Estado bloqueado o suspendido
        if (credito.estado_credito === 'bloqueado') {
            aprobado = false
            motivo = 'Cliente bloqueado por incumplimiento'
        } else if (credito.estado_credito === 'suspendido') {
            aprobado = false
            motivo = 'Crédito suspendido temporalmente'
        }

        // Regla 2: Clasificación D
        else if (credito.clasificacion === 'D') {
            aprobado = false
            motivo = 'Clasificación crediticia muy baja (D - Moroso)'
        }

        // Regla 3: Sin saldo disponible
        else if (credito.saldo_disponible <= 0) {
            aprobado = false
            motivo = 'Sin saldo disponible'
        }

        // Regla 4: Monto solicitado excede saldo disponible
        else if (montoSolicitado > 0 && montoSolicitado > credito.saldo_disponible) {
            aprobado = false
            motivo = `Monto solicitado (${formatearMoneda(montoSolicitado)}) excede saldo disponible (${formatearMoneda(credito.saldo_disponible)})`
        }

        // Regla 5: Deudas vencidas
        else if (deudas.total_vencidas > 0) {
            aprobado = false
            motivo = `Cliente tiene ${deudas.total_vencidas} factura(s) vencida(s) - ${formatearMoneda(deudas.monto_vencido)}`
        }

        // Regla 6: Alertas críticas
        else if (alertasRes.some(a => a.severidad === 'critica')) {
            aprobado = false
            motivo = 'Cliente tiene alertas críticas activas'
        }

        return {
            success: true,
            aprobado,
            motivo: aprobado ? 'Cliente aprobado para crédito' : motivo,
            datos: {
                ...credito,
                alertas: alertasRes,
                deudas: {
                    totalVencidas: deudas.total_vencidas || 0,
                    montoVencido: parseFloat(deudas.monto_vencido || 0)
                }
            }
        }

    } catch (error) {
        console.error('[evaluarOtorgamientoCredito]', error)
        return { success: false, mensaje: 'Error al evaluar otorgamiento' }
    } finally {
        if (connection) connection.release()
    }
}

function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP'
    }).format(monto || 0)
}

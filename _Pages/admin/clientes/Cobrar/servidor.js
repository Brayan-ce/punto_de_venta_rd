"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene las cuentas por cobrar de un cliente específico o toda la empresa
 */
export async function obtenerCuentasPorCobrar(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        let query = `
            SELECT 
                cxc.*,
                c.nombre as cliente_nombre,
                c.apellidos as cliente_apellidos,
                c.numero_documento,
                v.numero_factura
            FROM cuentas_por_cobrar cxc
            INNER JOIN clientes c ON cxc.cliente_id = c.id
            LEFT JOIN ventas v ON cxc.venta_id = v.id
            WHERE cxc.empresa_id = ?
        `
        const params = [empresaId]

        // Filtro por cliente
        if (filtros.cliente_id) {
            query += " AND cxc.cliente_id = ?"
            params.push(filtros.cliente_id)
        }

        // Filtro por estado
        if (filtros.estado) {
            query += " AND cxc.estado_cxc = ?"
            params.push(filtros.estado)
        } else {
            // Por defecto solo deudas pendientes
            query += " AND cxc.estado_cxc IN ('activa', 'vencida', 'parcial')"
        }

        query += " ORDER BY cxc.fecha_vencimiento ASC, cxc.dias_atraso DESC"

        const [cuentas] = await connection.execute(query, params)

        // Formatear datos
        const cuentasFormateadas = cuentas.map(cxc => ({
            id: cxc.id,
            creditoClienteId: cxc.credito_cliente_id,
            clienteId: cxc.cliente_id,
            clienteNombre: `${cxc.cliente_nombre} ${cxc.cliente_apellidos || ''}`.trim(),
            numeroDocumento: cxc.numero_documento,
            ventaId: cxc.venta_id,
            numeroFactura: cxc.numero_factura || cxc.numero_documento,
            origen: cxc.origen,
            montoTotal: Number(cxc.monto_total),
            montoPagado: Number(cxc.monto_pagado),
            saldoPendiente: Number(cxc.saldo_pendiente),
            fechaEmision: cxc.fecha_emision,
            fechaVencimiento: cxc.fecha_vencimiento,
            diasAtraso: cxc.dias_atraso,
            estadoCxc: cxc.estado_cxc,
            rangoAntiguedad: cxc.rango_antiguedad,
            numeroAbonos: cxc.numero_abonos,
            fechaUltimoAbono: cxc.fecha_ultimo_abono,
            notas: cxc.notas
        }))

        return { success: true, cuentas: cuentasFormateadas }

    } catch (error) {
        console.error('Error al obtener CxC:', error)
        return { success: false, mensaje: 'Error al cargar cuentas por cobrar' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Registra un pago/abono a una cuenta por cobrar
 */
export async function registrarPago(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'No tienes permisos para registrar pagos' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const { cxc_id, monto_pagado, metodo_pago, referencia_pago, notas } = datos

        // Validar que la cuenta existe y obtener datos
        const [cxc] = await connection.execute(
            `SELECT 
                id, cliente_id, monto_total, monto_pagado, saldo_pendiente, estado_cxc
            FROM cuentas_por_cobrar 
            WHERE id = ? AND empresa_id = ?`,
            [cxc_id, empresaId]
        )

        if (cxc.length === 0) {
            await connection.rollback()
            return { success: false, mensaje: 'Cuenta por cobrar no encontrada' }
        }

        const cuenta = cxc[0]

        // Validaciones
        if (cuenta.estado_cxc === 'pagada') {
            await connection.rollback()
            return { success: false, mensaje: 'Esta cuenta ya está completamente pagada' }
        }

        if (monto_pagado <= 0) {
            await connection.rollback()
            return { success: false, mensaje: 'El monto debe ser mayor a cero' }
        }

        if (monto_pagado > cuenta.saldo_pendiente) {
            await connection.rollback()
            return { 
                success: false, 
                mensaje: `El monto excede el saldo pendiente de $${cuenta.saldo_pendiente.toFixed(2)}`
            }
        }

        // Validar referencia para ciertos métodos de pago
        if (['transferencia', 'cheque'].includes(metodo_pago) && !referencia_pago) {
            await connection.rollback()
            return { 
                success: false, 
                mensaje: 'La referencia es obligatoria para transferencias y cheques'
            }
        }

        // Insertar el pago (el trigger se encarga de actualizar todo)
        await connection.execute(
            `INSERT INTO pagos_credito (
                cxc_id, empresa_id, cliente_id, monto_pagado, 
                metodo_pago, referencia_pago, notas, registrado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cxc_id, 
                empresaId, 
                cuenta.cliente_id, 
                monto_pagado,
                metodo_pago, 
                referencia_pago || null, 
                notas || null, 
                userId
            ]
        )

        await connection.commit()

        return { 
            success: true, 
            mensaje: 'Pago registrado exitosamente',
            montoPagado: monto_pagado,
            nuevoSaldo: cuenta.saldo_pendiente - monto_pagado
        }

    } catch (error) {
        if (connection) await connection.rollback()
        console.error('Error al registrar pago:', error)
        return { success: false, mensaje: 'Error al procesar el pago' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Obtiene el historial de pagos de un cliente o cuenta específica
 */
export async function obtenerHistorialPagos(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        connection = await db.getConnection()

        let query = `
            SELECT 
                p.*,
                c.nombre as cliente_nombre,
                c.apellidos as cliente_apellidos,
                cxc.numero_documento,
                u.nombre as registrado_por_nombre
            FROM pagos_credito p
            INNER JOIN clientes c ON p.cliente_id = c.id
            INNER JOIN cuentas_por_cobrar cxc ON p.cxc_id = cxc.id
            LEFT JOIN usuarios u ON p.registrado_por = u.id
            WHERE p.empresa_id = ?
        `
        const params = [empresaId]

        if (filtros.cliente_id) {
            query += " AND p.cliente_id = ?"
            params.push(filtros.cliente_id)
        }

        if (filtros.cxc_id) {
            query += " AND p.cxc_id = ?"
            params.push(filtros.cxc_id)
        }

        query += " ORDER BY p.fecha_pago DESC LIMIT 100"

        const [pagos] = await connection.execute(query, params)

        const pagosFormateados = pagos.map(p => ({
            id: p.id,
            cxcId: p.cxc_id,
            clienteNombre: `${p.cliente_nombre} ${p.cliente_apellidos || ''}`.trim(),
            numeroDocumento: p.numero_documento,
            montoPagado: Number(p.monto_pagado),
            metodoPago: p.metodo_pago,
            referenciaPago: p.referencia_pago,
            notas: p.notas,
            registradoPor: p.registrado_por_nombre,
            fechaPago: p.fecha_pago
        }))

        return { success: true, pagos: pagosFormateados }

    } catch (error) {
        console.error('Error al obtener historial de pagos:', error)
        return { success: false, mensaje: 'Error al cargar historial' }
    } finally {
        if (connection) connection.release()
    }
}
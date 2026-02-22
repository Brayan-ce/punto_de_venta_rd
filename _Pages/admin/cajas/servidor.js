"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

export async function obtenerCajaActiva() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajas] = await connection.execute(
            `SELECT * FROM cajas 
             WHERE empresa_id = ? 
               AND usuario_id = ? 
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC 
             LIMIT 1`,
            [empresaId, userId]
        )

        if (cajas.length === 0) {
            connection.release()
            return {
                success: true,
                caja: null
            }
        }

        const cajaBase = cajas[0]

        const [totalesVentas] = await connection.execute(
            `SELECT 
                COALESCE(SUM(CASE WHEN estado = 'emitida' THEN total ELSE 0 END), 0) as total_ventas,
                COALESCE(SUM(CASE WHEN estado = 'emitida' AND metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
                COALESCE(SUM(CASE WHEN estado = 'emitida' AND metodo_pago = 'tarjeta_debito' THEN total ELSE 0 END), 0) as total_tarjeta_debito,
                COALESCE(SUM(CASE WHEN estado = 'emitida' AND metodo_pago = 'tarjeta_credito' THEN total ELSE 0 END), 0) as total_tarjeta_credito,
                COALESCE(SUM(CASE WHEN estado = 'emitida' AND metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as total_transferencia,
                COALESCE(SUM(CASE WHEN estado = 'emitida' AND metodo_pago = 'cheque' THEN total ELSE 0 END), 0) as total_cheque
             FROM ventas
             WHERE caja_id = ? 
               AND empresa_id = ?`,
            [cajaBase.id, empresaId]
        )

        const [totalesGastos] = await connection.execute(
            `SELECT COALESCE(SUM(monto), 0) as total_gastos
             FROM gastos
             WHERE caja_id = ?
               AND empresa_id = ?`,
            [cajaBase.id, empresaId]
        )

        connection.release()

        const caja = {
            ...cajaBase,
            total_ventas: parseFloat(totalesVentas[0].total_ventas || 0),
            total_efectivo: parseFloat(totalesVentas[0].total_efectivo || 0),
            total_tarjeta_debito: parseFloat(totalesVentas[0].total_tarjeta_debito || 0),
            total_tarjeta_credito: parseFloat(totalesVentas[0].total_tarjeta_credito || 0),
            total_transferencia: parseFloat(totalesVentas[0].total_transferencia || 0),
            total_cheque: parseFloat(totalesVentas[0].total_cheque || 0),
            total_gastos: parseFloat(totalesGastos[0].total_gastos || 0)
        }

        return {
            success: true,
            caja: caja
        }

    } catch (error) {
        console.error('Error al obtener caja activa:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar caja'
        }
    }
}

export async function obtenerCajasDisponibles() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajaUsuario] = await connection.execute(
            `SELECT id, numero_caja
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC
             LIMIT 1`,
            [empresaId, userId]
        )

        if (cajaUsuario.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya tienes una caja abierta',
                cajas: []
            }
        }

        const [ultimaCaja] = await connection.execute(
            `SELECT MAX(numero_caja) as ultimo_numero
             FROM cajas
             WHERE empresa_id = ?`,
            [empresaId]
        )

        const siguienteNumero = (ultimaCaja[0].ultimo_numero || 0) + 1

        connection.release()

        return {
            success: true,
            cajas: [{numero: siguienteNumero}]
        }

    } catch (error) {
        console.error('Error al obtener cajas disponibles:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar cajas disponibles',
            cajas: []
        }
    }
}

export async function abrirCaja(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        // Buscar caja abierta
        const [cajaActiva] = await connection.execute(
            `SELECT id, numero_caja, fecha_caja
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC
             LIMIT 1`,
            [empresaId, userId]
        )

        const hoy = new Date()
        const fechaHoy = hoy.toISOString().split('T')[0]

        if (cajaActiva.length > 0) {
            const fechaCaja = cajaActiva[0].fecha_caja
            // Si la caja abierta es de un día anterior, forzar cierre automático
            if (fechaCaja < fechaHoy) {
                // Cerrar la caja automáticamente
                await connection.execute(
                    `UPDATE cajas SET estado = 'cerrada', fecha_cierre = NOW(), notas = CONCAT(COALESCE(notas, ''), '\n[Cierre automático por día vencido]') WHERE id = ?`,
                    [cajaActiva[0].id]
                )
            } else {
                connection.release()
                return {
                    success: false,
                    mensaje: `Debes cerrar la Caja ${cajaActiva[0].numero_caja} antes de abrir una nueva.`
                }
            }
        }

        // Ahora sí, abrir nueva caja
        const [ultimaCaja] = await connection.execute(
            `SELECT MAX(numero_caja) as ultimo_numero
             FROM cajas
             WHERE empresa_id = ?`,
            [empresaId]
        )

        const numeroCaja = (ultimaCaja[0].ultimo_numero || 0) + 1

        const [result] = await connection.execute(
            `INSERT INTO cajas (empresa_id,
                                usuario_id,
                                numero_caja,
                                fecha_caja,
                                monto_inicial,
                                estado)
             VALUES (?, ?, ?, ?, ?, 'abierta')`,
            [
                empresaId,
                userId,
                numeroCaja,
                fechaHoy,
                datos.monto_inicial
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Caja ${numeroCaja} abierta exitosamente`,
            cajaId: result.insertId
        }

    } catch (error) {
        console.error('Error al abrir caja:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al abrir caja'
        }
    }
}

export async function obtenerVentasCaja() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [caja] = await connection.execute(
            `SELECT id
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC
             LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: true,
                ventas: []
            }
        }

        const [ventas] = await connection.execute(
            `SELECT id,
                    ncf,
                    total,
                    metodo_pago,
                    fecha_venta
             FROM ventas
             WHERE caja_id = ?
               AND estado = 'emitida'
             ORDER BY fecha_venta DESC`,
            [caja[0].id]
        )

        connection.release()

        return {
            success: true,
            ventas: ventas
        }

    } catch (error) {
        console.error('Error al obtener ventas:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar ventas',
            ventas: []
        }
    }
}

export async function registrarGasto(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [caja] = await connection.execute(
            `SELECT id
             FROM cajas
             WHERE empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta'
             ORDER BY fecha_apertura DESC
             LIMIT 1`,
            [empresaId, userId]
        )

        if (caja.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No tienes una caja abierta'
            }
        }

        await connection.execute(
            `INSERT INTO gastos (empresa_id,
                                 concepto,
                                 monto,
                                 categoria,
                                 usuario_id,
                                 caja_id,
                                 comprobante_numero,
                                 notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datos.concepto,
                datos.monto,
                datos.categoria,
                userId,
                caja[0].id,
                datos.comprobante_numero,
                datos.notas
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Gasto registrado exitosamente'
        }

    } catch (error) {
        console.error('Error al registrar gasto:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al registrar gasto'
        }
    }
}

export async function cerrarCaja(datos) {
    let connection

    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {success: false, mensaje: 'Sesión inválida'}
        }

        if (!datos.caja_id) {
            return {success: false, mensaje: 'ID de caja requerido'}
        }

        connection = await db.getConnection()

        const [cajaRows] = await connection.execute(
            `SELECT *
             FROM cajas
             WHERE id = ?
               AND empresa_id = ?
               AND usuario_id = ?
               AND estado = 'abierta' LIMIT 1`,
            [datos.caja_id, empresaId, userId]
        )

        if (cajaRows.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'La caja no existe, no te pertenece o ya fue cerrada'
            }
        }

        const caja = cajaRows[0]

        const [[totales]] = await connection.execute(
            `SELECT COALESCE(SUM(v.total), 0) AS total_ventas,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo' THEN v.total ELSE 0 END),
                             0)               AS total_efectivo,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'tarjeta_debito' THEN v.total ELSE 0 END),
                             0)               AS total_tarjeta_debito,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'tarjeta_credito' THEN v.total ELSE 0 END),
                             0)               AS total_tarjeta_credito,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN v.total ELSE 0 END),
                             0)               AS total_transferencia,
                    COALESCE(SUM(CASE WHEN v.metodo_pago = 'cheque' THEN v.total ELSE 0 END),
                             0)               AS total_cheque,
                    COALESCE(SUM(g.monto), 0) AS total_gastos
             FROM cajas c
                      LEFT JOIN ventas v
                                ON v.caja_id = c.id AND v.estado = 'emitida'
                      LEFT JOIN gastos g
                                ON g.caja_id = c.id
             WHERE c.id = ?
               AND c.empresa_id = ?
               AND c.usuario_id = ?`,
            [caja.id, empresaId, userId]
        )

        const esperado =
            parseFloat(caja.monto_inicial) +
            parseFloat(totales.total_ventas) -
            parseFloat(totales.total_gastos)

        const diferencia =
            parseFloat(datos.monto_final) - esperado

        await connection.execute(
            `UPDATE cajas
             SET monto_final           = ?,
                 total_ventas          = ?,
                 total_efectivo        = ?,
                 total_tarjeta_debito  = ?,
                 total_tarjeta_credito = ?,
                 total_transferencia   = ?,
                 total_cheque          = ?,
                 total_gastos          = ?,
                 diferencia            = ?,
                 notas                 = ?,
                 estado                = 'cerrada',
                 fecha_cierre          = NOW()
             WHERE id = ?
               AND empresa_id = ?
               AND usuario_id = ?`,
            [
                datos.monto_final,
                totales.total_ventas,
                totales.total_efectivo,
                totales.total_tarjeta_debito,
                totales.total_tarjeta_credito,
                totales.total_transferencia,
                totales.total_cheque,
                totales.total_gastos,
                diferencia,
                datos.notas,
                caja.id,
                empresaId,
                userId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Caja cerrada correctamente',
            diferencia
        }

    } catch (error) {
        console.error('Error al cerrar caja:', error)
        if (connection) connection.release()

        return {
            success: false,
            mensaje: 'Error interno al cerrar la caja'
        }
    }
}

export async function obtenerHistorialCajas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [cajas] = await connection.execute(
            `SELECT c.id,
                    c.numero_caja,
                    c.fecha_caja,
                    c.monto_inicial,
                    c.monto_final,
                    c.total_ventas,
                    c.total_efectivo,
                    c.total_tarjeta_debito,
                    c.total_tarjeta_credito,
                    c.total_transferencia,
                    c.total_cheque,
                    c.total_gastos,
                    c.diferencia,
                    c.estado,
                    c.fecha_apertura,
                    c.fecha_cierre,
                    c.notas
             FROM cajas c
             WHERE c.empresa_id = ?
               AND c.usuario_id = ?
             ORDER BY c.fecha_caja DESC, c.fecha_apertura DESC LIMIT 50`,
            [empresaId, userId]
        )

        connection.release()

        return {
            success: true,
            cajas: cajas
        }

    } catch (error) {
        console.error('Error al obtener historial:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar historial',
            cajas: []
        }
    }
}

export async function obtenerTodasLasCajas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos'
            }
        }

        connection = await db.getConnection()

        const fechaHoy = new Date().toISOString().split('T')[0]

        const [cajas] = await connection.execute(
            `SELECT c.id,
                    c.numero_caja,
                    c.fecha_caja,
                    c.monto_inicial,
                    c.monto_final,
                    c.total_ventas,
                    c.total_efectivo,
                    c.total_tarjeta_debito,
                    c.total_tarjeta_credito,
                    c.total_transferencia,
                    c.total_cheque,
                    c.total_gastos,
                    c.diferencia,
                    c.estado,
                    c.fecha_apertura,
                    c.fecha_cierre,
                    u.nombre as usuario_nombre
             FROM cajas c
                      LEFT JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.empresa_id = ?
               AND c.fecha_caja = ?
             ORDER BY c.numero_caja ASC`,
            [empresaId, fechaHoy]
        )

        connection.release()

        return {
            success: true,
            cajas: cajas
        }

    } catch (error) {
        console.error('Error al obtener todas las cajas:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar cajas',
            cajas: []
        }
    }
}

export async function obtenerCajaAbierta(connection, empresaId, userId) {
    const [rows] = await connection.execute(
        `SELECT id
         FROM cajas
         WHERE empresa_id = ?
           AND usuario_id = ?
           AND estado = 'abierta'
         ORDER BY fecha_apertura DESC
         LIMIT 1`,
        [empresaId, userId]
    )

    return rows.length ? rows[0].id : null
}
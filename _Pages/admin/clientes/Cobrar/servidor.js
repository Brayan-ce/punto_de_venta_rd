"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

// ============================================================
// OBTENER CXC PENDIENTES DE UN CLIENTE (ventas a crédito)
// ============================================================
export async function obtenerCxCPendientes(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT
                cxc.id,
                cxc.numero_documento,
                cxc.venta_id,
                cxc.monto_total,
                cxc.monto_pagado,
                cxc.saldo_pendiente,
                cxc.fecha_emision,
                cxc.fecha_vencimiento,
                cxc.dias_atraso,
                cxc.estado_cxc,
                cxc.rango_antiguedad,
                cxc.numero_abonos,
                cxc.fecha_ultimo_abono,
                v.ncf,
                v.numero_interno,
                v.total AS venta_total
             FROM cuentas_por_cobrar cxc
             LEFT JOIN ventas v ON cxc.venta_id = v.id
             WHERE cxc.cliente_id = ?
               AND cxc.empresa_id = ?
               AND cxc.estado_cxc IN ('activa', 'vencida', 'parcial')
             ORDER BY cxc.fecha_vencimiento ASC`,
            [clienteId, empresaId]
        )

        const cuentas = rows.map(r => ({
            id: r.id,
            numeroDocumento: r.numero_documento,
            ventaId: r.venta_id,
            ncf: r.ncf || null,
            numeroInterno: r.numero_interno || null,
            montoTotal: Number(r.monto_total),
            montoPagado: Number(r.monto_pagado),
            saldoPendiente: Number(r.saldo_pendiente),
            fechaEmision: r.fecha_emision,
            fechaVencimiento: r.fecha_vencimiento,
            diasAtraso: r.dias_atraso,
            estadoCxc: r.estado_cxc,
            rangoAntiguedad: r.rango_antiguedad,
            numeroAbonos: r.numero_abonos,
            fechaUltimoAbono: r.fecha_ultimo_abono,
        }))

        return { success: true, cuentas }
    } catch (error) {
        console.error('Error obtenerCxCPendientes:', error)
        return { success: false, mensaje: 'Error al cargar cuentas pendientes' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================================
// REGISTRAR ABONO A UNA CXC  →  tabla abonos_credito
// ============================================================
export async function registrarAbono(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor' && userTipo !== 'financiamiento')) {
            return { success: false, mensaje: 'Sin permisos para registrar pagos' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const { cxc_id, cliente_id, monto_abonado, metodo_pago, referencia_pago, notas } = datos

        // Validar CxC
        const [cxcRows] = await connection.execute(
            `SELECT id, empresa_id, cliente_id, monto_total, monto_pagado, saldo_pendiente, estado_cxc
             FROM cuentas_por_cobrar
             WHERE id = ? AND empresa_id = ? AND cliente_id = ?`,
            [cxc_id, empresaId, cliente_id]
        )
        if (cxcRows.length === 0) {
            await connection.rollback()
            return { success: false, mensaje: 'Cuenta no encontrada' }
        }
        const cxc = cxcRows[0]
        if (cxc.estado_cxc === 'pagada') {
            await connection.rollback()
            return { success: false, mensaje: 'Esta cuenta ya está pagada' }
        }
        if (monto_abonado <= 0 || monto_abonado > Number(cxc.saldo_pendiente)) {
            await connection.rollback()
            return { success: false, mensaje: `Monto inválido. Saldo pendiente: ${cxc.saldo_pendiente}` }
        }

        // Insertar en abonos_credito (los triggers hacen el resto)
        const [result] = await connection.execute(
            `INSERT INTO abonos_credito
                (cxc_id, empresa_id, cliente_id, monto_abonado, metodo_pago, referencia_pago, notas, registrado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [cxc_id, empresaId, cliente_id, monto_abonado, metodo_pago,
             referencia_pago || null, notas || null, userId]
        )

        const abonoId = result.insertId
        await connection.commit()

        return {
            success: true,
            mensaje: 'Pago registrado exitosamente',
            abonoId,
            montoPagado: monto_abonado,
            nuevoSaldo: Number(cxc.saldo_pendiente) - monto_abonado
        }
    } catch (error) {
        if (connection) await connection.rollback()
        console.error('Error registrarAbono:', error)
        return { success: false, mensaje: 'Error al procesar el pago' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================================
// HISTORIAL DE ABONOS DE UN CLIENTE
// ============================================================
export async function obtenerHistorialAbonos(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT
                a.id,
                a.cxc_id,
                a.monto_abonado,
                a.metodo_pago,
                a.referencia_pago,
                a.notas,
                a.fecha_abono,
                a.es_pago_tardio,
                a.dias_atraso_al_pagar,
                cxc.numero_documento,
                cxc.monto_total,
                cxc.estado_cxc,
                v.ncf,
                v.numero_interno,
                u.nombre AS registrado_por_nombre
             FROM abonos_credito a
             INNER JOIN cuentas_por_cobrar cxc ON a.cxc_id = cxc.id
             LEFT JOIN ventas v ON cxc.venta_id = v.id
             LEFT JOIN usuarios u ON a.registrado_por = u.id
             WHERE a.cliente_id = ?
               AND a.empresa_id = ?
             ORDER BY a.fecha_abono DESC
             LIMIT 100`,
            [clienteId, empresaId]
        )

        const abonos = rows.map(r => ({
            id: r.id,
            cxcId: r.cxc_id,
            montoAbonado: Number(r.monto_abonado),
            metodoPago: r.metodo_pago,
            referenciaPago: r.referencia_pago,
            notas: r.notas,
            fechaAbono: r.fecha_abono,
            esPagoTardio: !!r.es_pago_tardio,
            diasAtrasoAlPagar: r.dias_atraso_al_pagar,
            numeroDocumento: r.numero_documento,
            montoTotal: Number(r.monto_total),
            estadoCxc: r.estado_cxc,
            ncf: r.ncf || null,
            numeroInterno: r.numero_interno || null,
            registradoPor: r.registrado_por_nombre || 'Sistema',
        }))

        return { success: true, abonos }
    } catch (error) {
        console.error('Error obtenerHistorialAbonos:', error)
        return { success: false, mensaje: 'Error al cargar historial' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================================
// DATOS DE UN ABONO PARA IMPRIMIR
// ============================================================
export async function obtenerDatosAbonoParaImprimir(abonoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT
                a.id,
                a.monto_abonado,
                a.metodo_pago,
                a.referencia_pago,
                a.notas,
                a.fecha_abono,
                a.es_pago_tardio,
                a.dias_atraso_al_pagar,
                cxc.id                  AS cxc_id,
                cxc.numero_documento,
                cxc.monto_total,
                cxc.monto_pagado,
                cxc.saldo_pendiente,
                cxc.estado_cxc,
                v.ncf,
                v.numero_interno,
                c.id                    AS cliente_id,
                c.nombre                AS cliente_nombre,
                c.apellidos             AS cliente_apellidos,
                c.numero_documento      AS cliente_documento,
                c.telefono              AS cliente_telefono,
                c.direccion             AS cliente_direccion,
                u.nombre                AS usuario_nombre,
                e.nombre_empresa,
                e.rnc,
                e.razon_social,
                e.direccion             AS empresa_direccion,
                e.telefono              AS empresa_telefono,
                e.mensaje_factura
             FROM abonos_credito a
             INNER JOIN cuentas_por_cobrar cxc ON a.cxc_id = cxc.id
             INNER JOIN clientes c ON a.cliente_id = c.id
             LEFT JOIN ventas v ON cxc.venta_id = v.id
             LEFT JOIN usuarios u ON a.registrado_por = u.id
             INNER JOIN empresas e ON a.empresa_id = e.id
             WHERE a.id = ? AND a.empresa_id = ?`,
            [abonoId, empresaId]
        )

        if (rows.length === 0) return { success: false, mensaje: 'Abono no encontrado' }
        const r = rows[0]

        return {
            success: true,
            abono: {
                id: r.id,
                montoAbonado: Number(r.monto_abonado),
                metodoPago: r.metodo_pago,
                referenciaPago: r.referencia_pago,
                notas: r.notas,
                fechaAbono: r.fecha_abono,
                esPagoTardio: !!r.es_pago_tardio,
                diasAtrasoAlPagar: r.dias_atraso_al_pagar,
            },
            cxc: {
                id: r.cxc_id,
                numeroDocumento: r.numero_documento,
                montoTotal: Number(r.monto_total),
                montoPagado: Number(r.monto_pagado),
                saldoPendiente: Number(r.saldo_pendiente),
                estadoCxc: r.estado_cxc,
                ncf: r.ncf,
                numeroInterno: r.numero_interno,
            },
            cliente: {
                id: r.cliente_id,
                nombreCompleto: `${r.cliente_nombre} ${r.cliente_apellidos || ''}`.trim(),
                documento: r.cliente_documento,
                telefono: r.cliente_telefono,
                direccion: r.cliente_direccion,
            },
            empresa: {
                nombreEmpresa: r.nombre_empresa,
                rnc: r.rnc,
                razonSocial: r.razon_social,
                direccion: r.empresa_direccion,
                telefono: r.empresa_telefono,
                mensajeFactura: r.mensaje_factura,
            },
            usuarioNombre: r.usuario_nombre,
        }
    } catch (error) {
        console.error('Error obtenerDatosAbonoParaImprimir:', error)
        return { success: false, mensaje: 'Error al cargar datos del abono' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================================
// REGISTRAR ABONO CONSOLIDADO (distribuye por fecha asc)
// ============================================================
export async function registrarAbonoConsolidado({ cliente_id, monto_total, metodo_pago, referencia_pago, notas }) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId    = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo  = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor' && userTipo !== 'financiamiento')) {
            return { success: false, mensaje: 'Sin permisos para registrar pagos' }
        }

        if (!monto_total || monto_total <= 0) return { success: false, mensaje: 'Monto inválido' }

        connection = await db.getConnection()

        const [cxcs] = await connection.execute(
            `SELECT id, saldo_pendiente FROM cuentas_por_cobrar
             WHERE cliente_id = ? AND empresa_id = ? AND estado_cxc IN ('activa','vencida','parcial')
             ORDER BY fecha_vencimiento ASC`,
            [cliente_id, empresaId]
        )

        if (cxcs.length === 0) return { success: false, mensaje: 'No hay deudas pendientes' }

        const totalDeuda = cxcs.reduce((s, c) => s + Number(c.saldo_pendiente), 0)
        if (monto_total > totalDeuda + 0.01) return { success: false, mensaje: `El monto excede la deuda total (${totalDeuda.toFixed(2)})` }

        await connection.beginTransaction()

        let restante = monto_total
        let primerAbonoId = null

        for (const cxc of cxcs) {
            if (restante <= 0) break
            const abono = Math.min(restante, Number(cxc.saldo_pendiente))
            const [res] = await connection.execute(
                `INSERT INTO abonos_credito (cxc_id, empresa_id, cliente_id, monto_abonado, metodo_pago, referencia_pago, notas, registrado_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [cxc.id, empresaId, cliente_id, abono, metodo_pago, referencia_pago || null, notas || null, userId]
            )
            if (!primerAbonoId) primerAbonoId = res.insertId
            restante -= abono
        }

        await connection.commit()
        return { success: true, abonoId: primerAbonoId, montoPagado: monto_total }
    } catch (error) {
        if (connection) await connection.rollback()
        console.error('Error registrarAbonoConsolidado:', error)
        return { success: false, mensaje: 'Error al procesar el pago' }
    } finally {
        if (connection) connection.release()
    }
}

// ============================================================
// MANTENER COMPATIBILIDAD - obtenerCuentasPorCobrar (legacy)
// ============================================================
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
                c.numero_documento
            FROM cuentas_por_cobrar cxc
            INNER JOIN clientes c ON cxc.cliente_id = c.id
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
            numeroFactura: cxc.numero_documento,
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

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor' && userTipo !== 'financiamiento')) {
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
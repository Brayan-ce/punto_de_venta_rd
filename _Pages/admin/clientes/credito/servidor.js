"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtiene el estado de crédito de un cliente, incluyendo límites, saldo y clasificación.
 */
export async function obtenerEstadoCredito(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        const [credito] = await connection.execute(
            `SELECT * FROM credito_clientes WHERE cliente_id = ? AND empresa_id = ?`,
            [clienteId, empresaId]
        )

        if (credito.length === 0) {
            return {
                success: true,
                existe: false,
                mensaje: 'El cliente no tiene configuración de crédito'
            }
        }

        return {
            success: true,
            existe: true,
            datos: credito[0]
        }

    } catch (error) {
        console.error('Error al obtener estado de crédito:', error)
        return { success: false, mensaje: 'Error al obtener datos de crédito' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Crea o actualiza la configuración de crédito de un cliente.
 */
export async function configurarCredito(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return { success: false, mensaje: 'No tienes permisos para configurar crédito' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        const { cliente_id, limite_credito, frecuencia_pago, dias_plazo } = datos

        // Verificar si ya existe
        const [existe] = await connection.execute(
            `SELECT id FROM credito_clientes WHERE cliente_id = ? AND empresa_id = ?`,
            [cliente_id, empresaId]
        )

        if (existe.length > 0) {
            // Actualizar
            await connection.execute(
                `UPDATE credito_clientes SET 
                    limite_credito = ?, 
                    frecuencia_pago = ?, 
                    dias_plazo = ?,
                    modificado_por = ?
                WHERE id = ?`,
                [limite_credito, frecuencia_pago, dias_plazo, userId, existe[0].id]
            )

            // Registrar en historial
            await connection.execute(
                `INSERT INTO historial_credito (
                    credito_cliente_id, empresa_id, cliente_id, tipo_evento, 
                    descripcion, generado_por, usuario_id
                ) VALUES (?, ?, ?, 'ajuste_limite', ?, 'usuario', ?)`,
                [existe[0].id, empresaId, cliente_id, `Límite actualizado a ${limite_credito}`, userId]
            )
        } else {
            // Crear
            const [resultado] = await connection.execute(
                `INSERT INTO credito_clientes (
                    cliente_id, empresa_id, limite_credito, frecuencia_pago, 
                    dias_plazo, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [cliente_id, empresaId, limite_credito, frecuencia_pago, dias_plazo, userId]
            )

            // Registrar en historial
            await connection.execute(
                `INSERT INTO historial_credito (
                    credito_cliente_id, empresa_id, cliente_id, tipo_evento, 
                    descripcion, generado_por, usuario_id
                ) VALUES (?, ?, ?, 'creacion_credito', ?, 'usuario', ?)`,
                [resultado.insertId, empresaId, cliente_id, `Crédito inicial configurado: ${limite_credito}`, userId]
            )
        }

        await connection.commit()
        return { success: true, mensaje: 'Configuración de crédito guardada' }

    } catch (error) {
        if (connection) await connection.rollback()
        console.error('Error al configurar crédito:', error)
        return { success: false, mensaje: 'Error al procesar la solicitud' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Obtiene el historial de eventos crediticios de un cliente.
 */
export async function obtenerHistorialCredito(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        connection = await db.getConnection()

        const [historial] = await connection.execute(
            `SELECT h.*, u.nombre as usuario_nombre 
            FROM historial_credito h
            LEFT JOIN usuarios u ON h.usuario_id = u.id
            WHERE h.cliente_id = ? AND h.empresa_id = ?
            ORDER BY h.fecha_evento DESC LIMIT 50`,
            [clienteId, empresaId]
        )

        return { success: true, historial }

    } catch (error) {
        console.error('Error al obtener historial:', error)
        return { success: false, mensaje: 'Error al cargar historial' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Obtiene las cuentas por cobrar (deudas) de un cliente o de toda la empresa con filtros.
 */
export async function obtenerCuentasPorCobrar(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        connection = await db.getConnection()

        let query = `
            SELECT cxc.*, c.nombre as cliente_nombre, c.numero_documento
            FROM cuentas_por_cobrar cxc
            INNER JOIN clientes c ON cxc.cliente_id = c.id
            WHERE cxc.empresa_id = ?
        `
        const params = [empresaId]

        if (filtros.cliente_id) {
            query += " AND cxc.cliente_id = ?"
            params.push(filtros.cliente_id)
        }

        if (filtros.estado) {
            query += " AND cxc.estado_cxc = ?"
            params.push(filtros.estado)
        } else {
            query += " AND cxc.estado_cxc NOT IN ('pagada', 'castigada')"
        }

        query += " ORDER BY cxc.fecha_vencimiento ASC"

        const [cuentas] = await connection.execute(query, params)

        return { success: true, cuentas }

    } catch (error) {
        console.error('Error al obtener CxC:', error)
        return { success: false, mensaje: 'Error al cargar cuentas por cobrar' }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Registra un abono a una cuenta por cobrar específica.
 */
export async function registrarAbono(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        connection = await db.getConnection()
        await connection.beginTransaction()

        const { cxc_id, monto, metodo_pago, referencia, notas } = datos

        // Obtener datos de la deuda
        const [cxc] = await connection.execute(
            `SELECT * FROM cuentas_por_cobrar WHERE id = ? AND empresa_id = ?`,
            [cxc_id, empresaId]
        )

        if (cxc.length === 0) {
            await connection.rollback()
            return { success: false, mensaje: 'Deuda no encontrada' }
        }

        if (monto > cxc[0].saldo_pendiente) {
            await connection.rollback()
            return { success: false, mensaje: 'El monto supera el saldo pendiente' }
        }

        // Insertar el abono (El trigger se encargará de actualizar cxc y credito_clientes)
        await connection.execute(
            `INSERT INTO abonos_credito (
                cxc_id, empresa_id, cliente_id, monto_abonado, 
                metodo_pago, referencia_pago, notas, registrado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [cxc_id, empresaId, cxc[0].cliente_id, monto, metodo_pago, referencia, notas, userId]
        )

        await connection.commit()
        return { success: true, mensaje: 'Abono registrado exitosamente' }

    } catch (error) {
        if (connection) await connection.rollback()
        console.error('Error al registrar abono:', error)
        return { success: false, mensaje: 'Error al procesar el pago' }
    } finally {
        if (connection) connection.release()
    }
}

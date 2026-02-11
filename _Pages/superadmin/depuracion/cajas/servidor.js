"use server"

/**
 * SERVER ACTIONS - DEPURACIÓN DE CAJAS
 * Módulo del Superadministrador
 */

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function validarSuperadmin() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value

    if (!userId || userTipo !== 'superadmin') {
        return { success: false, mensaje: 'Acceso no autorizado' }
    }

    return { success: true, userId: parseInt(userId) }
}

async function registrarAuditoria(params) {
    const connection = await db.getConnection()

    try {
        await connection.execute(
            `INSERT INTO auditoria_sistema (
        modulo, accion, tipo_accion,
        empresa_id, entidad_tipo, entidad_id, entidad_id_secundaria,
        usuario_id, tipo_usuario,
        descripcion, datos_anteriores, datos_nuevos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'superadmin', ?, ?, ?)`,
            [
                params.modulo,
                params.accion,
                params.tipoAccion,
                params.empresaId || null,
                params.entidadTipo,
                params.entidadId,
                params.entidadIdSecundaria || null,
                params.usuarioId,
                params.descripcion,
                params.datosAnteriores ? JSON.stringify(params.datosAnteriores) : null,
                params.datosNuevos ? JSON.stringify(params.datosNuevos) : null
            ]
        )
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener cajas abiertas prolongadamente
 */
export async function obtenerCajasAbiertas(empresaId = null, horasMinimas = 24) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const query = `
      SELECT 
        c.id,
        c.empresa_id,
        e.nombre_empresa,
        c.numero_caja,
        c.usuario_id,
        u.nombre as usuario_nombre,
        c.fecha_caja,
        c.monto_inicial,
        c.total_ventas,
        c.total_efectivo,
        c.total_tarjeta_debito,
        c.total_tarjeta_credito,
        c.total_transferencia,
        c.total_cheque,
        c.total_gastos,
        c.diferencia,
        c.fecha_apertura,
        c.notas,
        TIMESTAMPDIFF(HOUR, c.fecha_apertura, NOW()) as horas_abierta,
        (SELECT COUNT(*) FROM ventas WHERE caja_id = c.id) as cantidad_ventas
      FROM cajas c
      INNER JOIN empresas e ON c.empresa_id = e.id
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.estado = 'abierta'
      AND TIMESTAMPDIFF(HOUR, c.fecha_apertura, NOW()) >= ?
      ${empresaId ? 'AND c.empresa_id = ?' : ''}
      ORDER BY TIMESTAMPDIFF(HOUR, c.fecha_apertura, NOW()) DESC
    `

        const params = empresaId ? [horasMinimas, empresaId] : [horasMinimas]
        const [cajas] = await connection.execute(query, params)

        // Generar alertas automáticas si no existen
        for (const caja of cajas) {
            if (caja.horas_abierta >= 48) {
                // Verificar si ya existe alerta
                const [alertaExistente] = await connection.execute(
                    `SELECT id FROM alertas_sistema
           WHERE tipo_alerta = 'cajas_abiertas_prolongadas'
           AND empresa_id = ?
           AND JSON_EXTRACT(datos_contexto, '$.caja_id') = ?
           AND estado = 'activa'`,
                    [caja.empresa_id, caja.id]
                )

                if (alertaExistente.length === 0) {
                    await connection.execute(
                        `INSERT INTO alertas_sistema (
              tipo_alerta, severidad, empresa_id, modulo,
              titulo, descripcion, datos_contexto, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'activa')`,
                        [
                            'cajas_abiertas_prolongadas',
                            caja.horas_abierta >= 72 ? 'critica' : 'alta',
                            caja.empresa_id,
                            'cajas',
                            `Caja abierta ${caja.horas_abierta} horas`,
                            `La caja #${caja.numero_caja} de ${caja.nombre_empresa} lleva ${caja.horas_abierta} horas sin cerrar. Usuario: ${caja.usuario_nombre}`,
                            JSON.stringify({
                                caja_id: caja.id,
                                horas_abierta: caja.horas_abierta,
                                numero_caja: caja.numero_caja
                            })
                        ]
                    )
                }
            }
        }

        return {
            success: true,
            cajas: cajas
        }
    } catch (error) {
        console.error('Error al obtener cajas abiertas:', error)
        return {
            success: false,
            mensaje: 'Error al cargar cajas abiertas'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Forzar cierre de caja
 */
export async function forzarCierreCaja(cajaId, motivo) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    if (!motivo || motivo.trim().length < 10) {
        return {
            success: false,
            mensaje: 'El motivo debe tener al menos 10 caracteres'
        }
    }

    const connection = await db.getConnection()

    try {
        await connection.beginTransaction()

        // Obtener datos de la caja antes del cierre
        const [cajaAntes] = await connection.execute(
            `SELECT c.*, e.nombre_empresa, u.nombre as usuario_nombre, u.email as usuario_email
       FROM cajas c
       INNER JOIN empresas e ON c.empresa_id = e.id
       INNER JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
            [cajaId]
        )

        if (cajaAntes.length === 0) {
            await connection.rollback()
            return {
                success: false,
                mensaje: 'Caja no encontrada'
            }
        }

        const caja = cajaAntes[0]

        if (caja.estado === 'cerrada') {
            await connection.rollback()
            return {
                success: false,
                mensaje: 'La caja ya está cerrada'
            }
        }

        // Calcular totales finales basándose en las ventas
        const [totales] = await connection.execute(
            `SELECT 
        COALESCE(SUM(total), 0) as total_ventas,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta_debito' THEN total ELSE 0 END), 0) as total_tarjeta_debito,
        COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta_credito' THEN total ELSE 0 END), 0) as total_tarjeta_credito,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) as total_transferencia,
        COALESCE(SUM(CASE WHEN metodo_pago = 'cheque' THEN total ELSE 0 END), 0) as total_cheque
       FROM ventas
       WHERE caja_id = ? AND estado = 'emitida'`,
            [cajaId]
        )

        const [totalGastos] = await connection.execute(
            'SELECT COALESCE(SUM(monto), 0) as total_gastos FROM gastos WHERE caja_id = ?',
            [cajaId]
        )

        const montoFinal = parseFloat(caja.monto_inicial) +
            parseFloat(totales[0].total_efectivo) -
            parseFloat(totalGastos[0].total_gastos)

        // Cerrar la caja
        await connection.execute(
            `UPDATE cajas
       SET estado = 'cerrada',
           monto_final = ?,
           total_ventas = ?,
           total_efectivo = ?,
           total_tarjeta_debito = ?,
           total_tarjeta_credito = ?,
           total_transferencia = ?,
           total_cheque = ?,
           total_gastos = ?,
           diferencia = ? - ?,
           fecha_cierre = NOW(),
           notas = CONCAT(IFNULL(notas, ''), '\n\n[CIERRE ADMINISTRATIVO]\nMotivo: ', ?, '\nCerrado por: Superadmin\nFecha: ', NOW())
       WHERE id = ?`,
            [
                montoFinal,
                totales[0].total_ventas,
                totales[0].total_efectivo,
                totales[0].total_tarjeta_debito,
                totales[0].total_tarjeta_credito,
                totales[0].total_transferencia,
                totales[0].total_cheque,
                totalGastos[0].total_gastos,
                montoFinal,
                montoFinal, // Para el cálculo de diferencia (esperado - real)
                motivo,
                cajaId
            ]
        )

        // Resolver alertas relacionadas
        await connection.execute(
            `UPDATE alertas_sistema
       SET estado = 'resuelta',
           fecha_resolucion = NOW(),
           resuelta_por = ?,
           acciones_tomadas = ?
       WHERE tipo_alerta = 'cajas_abiertas_prolongadas'
       AND empresa_id = ?
       AND JSON_EXTRACT(datos_contexto, '$.caja_id') = ?
       AND estado = 'activa'`,
            [validacion.userId, `Cierre administrativo: ${motivo}`, caja.empresa_id, cajaId]
        )

        // Registrar auditoría
        await registrarAuditoria({
            modulo: 'cajas',
            accion: 'cierre_administrativo',
            tipoAccion: 'escritura',
            empresaId: caja.empresa_id,
            entidadTipo: 'caja',
            entidadId: cajaId,
            usuarioId: validacion.userId,
            descripcion: `Cierre forzado de caja #${caja.numero_caja}: ${motivo}`,
            datosAnteriores: caja,
            datosNuevos: {
                estado: 'cerrada',
                monto_final: montoFinal,
                total_ventas: totales[0].total_ventas
            }
        })

        await connection.commit()

        // TODO: Enviar notificación al usuario responsable
        // await enviarNotificacion(caja.usuario_email, 'Cierre administrativo de caja', ...)

        return {
            success: true,
            mensaje: 'Caja cerrada exitosamente',
            datos: {
                montoFinal: montoFinal,
                totalVentas: totales[0].total_ventas,
                usuario: caja.usuario_nombre
            }
        }
    } catch (error) {
        await connection.rollback()
        console.error('Error al cerrar caja:', error)
        return {
            success: false,
            mensaje: 'Error al cerrar la caja. La operación fue revertida.'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener cajas con inconsistencias (diferencias grandes)
 */
export async function obtenerCajasConInconsistencias(empresaId = null, minimaInconsistencia = 100) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const query = `
      SELECT 
        c.id,
        c.empresa_id,
        e.nombre_empresa,
        c.numero_caja,
        c.usuario_id,
        u.nombre as usuario_nombre,
        c.fecha_caja,
        c.monto_inicial,
        c.monto_final,
        c.total_ventas,
        c.diferencia,
        c.fecha_apertura,
        c.fecha_cierre,
        ABS(c.diferencia) as diferencia_absoluta
      FROM cajas c
      INNER JOIN empresas e ON c.empresa_id = e.id
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.estado = 'cerrada'
      AND ABS(c.diferencia) >= ?
      ${empresaId ? 'AND c.empresa_id = ?' : ''}
      ORDER BY ABS(c.diferencia) DESC, c.fecha_cierre DESC
      LIMIT 100
    `

        const params = empresaId ? [minimaInconsistencia, empresaId] : [minimaInconsistencia]
        const [cajas] = await connection.execute(query, params)

        return {
            success: true,
            cajas: cajas
        }
    } catch (error) {
        console.error('Error al obtener cajas con inconsistencias:', error)
        return {
            success: false,
            mensaje: 'Error al cargar cajas con inconsistencias'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener detalles de una caja
 */
export async function obtenerDetallesCaja(cajaId) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        // Información de la caja
        const [caja] = await connection.execute(
            `SELECT c.*, e.nombre_empresa, u.nombre as usuario_nombre
       FROM cajas c
       INNER JOIN empresas e ON c.empresa_id = e.id
       INNER JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
            [cajaId]
        )

        if (caja.length === 0) {
            return {
                success: false,
                mensaje: 'Caja no encontrada'
            }
        }

        // Ventas de la caja
        const [ventas] = await connection.execute(
            `SELECT 
        v.id,
        v.ncf,
        v.numero_interno,
        v.total,
        v.metodo_pago,
        v.estado,
        v.fecha_venta,
        CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellidos, '')) as cliente_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       WHERE v.caja_id = ?
       ORDER BY v.fecha_venta DESC`,
            [cajaId]
        )

        // Gastos de la caja
        const [gastos] = await connection.execute(
            `SELECT 
        id,
        concepto,
        monto,
        categoria,
        comprobante_numero,
        fecha_gasto
       FROM gastos
       WHERE caja_id = ?
       ORDER BY fecha_gasto DESC`,
            [cajaId]
        )

        return {
            success: true,
            caja: caja[0],
            ventas: ventas,
            gastos: gastos
        }
    } catch (error) {
        console.error('Error al obtener detalles de caja:', error)
        return {
            success: false,
            mensaje: 'Error al cargar detalles de la caja'
        }
    } finally {
        connection.release()
    }
}

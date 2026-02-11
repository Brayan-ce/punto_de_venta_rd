"use server"

/**
 * SERVER ACTIONS - DEPURACIÓN DE CLIENTES
 * Módulo del Superadministrador
 */

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Validación de permisos de superadmin
 */
async function validarSuperadmin() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value

    if (!userId || userTipo !== 'superadmin') {
        return { success: false, mensaje: 'Acceso no autorizado' }
    }

    return { success: true, userId: parseInt(userId) }
}

/**
 * Registrar acción en auditoría
 */
async function registrarAuditoria({
    modulo,
    accion,
    tipoAccion,
    empresaId,
    entidadTipo,
    entidadId,
    usuarioId,
    descripcion,
    datosAnteriores = null,
    datosNuevos = null
}) {
    const connection = await db.getConnection()

    try {
        await connection.execute(
            `INSERT INTO auditoria_sistema (
        modulo, accion, tipo_accion,
        empresa_id, entidad_tipo, entidad_id,
        usuario_id, tipo_usuario,
        descripcion, datos_anteriores, datos_nuevos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'superadmin', ?, ?, ?)`,
            [
                modulo,
                accion,
                tipoAccion, // Enum: 'lectura','escritura','eliminacion','fusion','bloqueo',...
                empresaId,
                entidadTipo,
                entidadId,
                usuarioId,
                descripcion,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null
            ]
        )
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener estadísticas del dashboard
 */
export async function obtenerEstadisticasDepuracion() {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        // Alertas activas por severidad
        const [alertas] = await connection.execute(
            `SELECT severidad, COUNT(*) as cantidad
       FROM alertas_sistema
       WHERE estado = 'activa'
       GROUP BY severidad`
        )

        // Empresas con suscripciones vencidas
        const [suscripcionesVencidas] = await connection.execute(
            `SELECT COUNT(*) as cantidad
       FROM empresas_suscripciones
       WHERE estado IN ('vencida', 'suspendida')`
        )

        // Cajas abiertas > 24 horas
        const [cajasAbiertas] = await connection.execute(
            `SELECT COUNT(*) as cantidad
       FROM cajas
       WHERE estado = 'abierta'
       AND TIMESTAMPDIFF(HOUR, fecha_apertura, NOW()) > 24`
        )

        // Clientes duplicados pendientes
        const [duplicadosPendientes] = await connection.execute(
            `SELECT COUNT(*) as cantidad
       FROM clientes_duplicados_detecciones
       WHERE estado = 'pendiente'`
        )

        // Empresas con límites excedidos (calculado dinámicamente)
        const [limitesExcedidos] = await connection.execute(
            `SELECT COUNT(*) as cantidad
             FROM empresas_suscripciones s
             LEFT JOIN (
                SELECT empresa_id, COUNT(*) as c FROM usuarios WHERE activo = 1 GROUP BY empresa_id
             ) u ON s.empresa_id = u.empresa_id
             LEFT JOIN (
                SELECT empresa_id, COUNT(*) as c FROM productos WHERE activo = 1 GROUP BY empresa_id
             ) p ON s.empresa_id = p.empresa_id
             WHERE IFNULL(u.c, 0) > s.limite_usuarios OR IFNULL(p.c, 0) > s.limite_productos`
        )

        // Últimas acciones de auditoría (ajustado a nuevos campos)
        const [ultimasAcciones] = await connection.execute(
            `SELECT 
        a.id,
        a.modulo,
        a.accion,
        a.descripcion,
        a.fecha_accion,
        e.nombre_empresa,
        u.nombre as usuario_nombre
       FROM auditoria_sistema a
       LEFT JOIN empresas e ON a.empresa_id = e.id
       INNER JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY a.fecha_accion DESC
       LIMIT 10`
        )

        return {
            success: true,
            estadisticas: {
                alertas: alertas.reduce((acc, row) => {
                    acc[row.severidad] = row.cantidad
                    return acc
                }, { critica: 0, alta: 0, media: 0, baja: 0 }),
                suscripcionesVencidas: suscripcionesVencidas[0].cantidad,
                cajasAbiertas: cajasAbiertas[0].cantidad,
                duplicadosPendientes: duplicadosPendientes[0].cantidad,
                limitesExcedidos: limitesExcedidos[0].cantidad,
                ultimasAcciones: ultimasAcciones
            }
        }
    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        return {
            success: false,
            mensaje: 'Error al cargar estadísticas de depuración'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Detectar clientes duplicados
 */
export async function detectarClientesDuplicados(empresaId = null) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        if (empresaId) {
            // Detectar para empresa específica
            await connection.query('CALL sp_detectar_clientes_duplicados(?)', [empresaId])
        } else {
            // Detectar para todas las empresas
            const [empresas] = await connection.execute('SELECT id FROM empresas WHERE activo = 1')

            for (const empresa of empresas) {
                await connection.query('CALL sp_detectar_clientes_duplicados(?)', [empresa.id])
            }
        }

        // Registrar auditoría
        await registrarAuditoria({
            entidad: 'clientes',
            tipoAccion: 'ACTUALIZAR',
            entidadId: empresaId || 0,
            usuarioId: validacion.userId,
            descripcion: `Detección de duplicados ejecutada${empresaId ? ` para empresa ${empresaId}` : ' para todas las empresas'}`
        })

        return {
            success: true,
            mensaje: 'Detección completada exitosamente'
        }
    } catch (error) {
        console.error('Error al detectar duplicados:', error)
        return {
            success: false,
            mensaje: 'Error al detectar clientes duplicados'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener lista de duplicados detectados
 */
export async function obtenerDuplicadosDetectados(empresaId = null, estado = 'pendiente') {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const query = `
      SELECT 
        d.id,
        d.empresa_id,
        e.nombre_empresa,
        d.criterio_deteccion,
        d.similitud_porcentaje,
        d.estado,
        d.fecha_deteccion,
        
        c1.id as cliente_principal_id,
        c1.nombre as cliente_principal_nombre,
        c1.telefono as cliente_principal_telefono,
        c1.email as cliente_principal_email,
        c1.numero_documento as cliente_principal_doc,
        c1.total_compras as cliente_principal_compras,
        (SELECT COUNT(*) FROM ventas WHERE cliente_id = c1.id) as cliente_principal_ventas,
        
        c2.id as cliente_duplicado_id,
        c2.nombre as cliente_duplicado_nombre,
        c2.telefono as cliente_duplicado_telefono,
        c2.email as cliente_duplicado_email,
        c2.numero_documento as cliente_duplicado_doc,
        c2.total_compras as cliente_duplicado_compras,
        (SELECT COUNT(*) FROM ventas WHERE cliente_id = c2.id) as cliente_duplicado_ventas
        
      FROM clientes_duplicados_detecciones d
      INNER JOIN empresas e ON d.empresa_id = e.id
      INNER JOIN clientes c1 ON d.cliente_padre_id = c1.id
      INNER JOIN clientes c2 ON d.cliente_duplicado_id = c2.id
      WHERE d.estado = ?
      ${empresaId ? 'AND d.empresa_id = ?' : ''}
      ORDER BY 
        CASE d.criterio_deteccion
          WHEN 'rnc' THEN 1
          WHEN 'telefono' THEN 2
          WHEN 'email' THEN 3
          WHEN 'nombre_similar' THEN 4
          ELSE 5
        END,
        d.similitud_porcentaje DESC,
        d.fecha_deteccion DESC
    `

        const params = empresaId ? [estado, empresaId] : [estado]
        const [duplicados] = await connection.execute(query, params)

        return {
            success: true,
            duplicados: duplicados
        }
    } catch (error) {
        console.error('Error al obtener duplicados:', error)
        return {
            success: false,
            mensaje: 'Error al cargar duplicados detectados'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Fusionar clientes
 */
export async function fusionarClientes({
    clientePrincipalId,
    clienteFusionadoId,
    motivo
}) {
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
        // Obtener datos antes de la fusión para auditoría
        const [clientesPrevios] = await connection.execute(
            `SELECT id, nombre, telefono, email, total_compras, puntos_fidelidad
       FROM clientes
       WHERE id IN (?, ?)`,
            [clientePrincipalId, clienteFusionadoId]
        )

        const clientePrincipalAntes = clientesPrevios.find(c => c.id === clientePrincipalId)
        const clienteFusionadoAntes = clientesPrevios.find(c => c.id === clienteFusionadoId)

        // Ejecutar procedimiento de fusión
        await connection.query(
            'CALL sp_fusionar_clientes(?, ?, ?, ?)',
            [clientePrincipalId, clienteFusionadoId, validacion.userId, motivo]
        )

        // Obtener datos después de la fusión
        const [clientesPosterior] = await connection.execute(
            `SELECT id, nombre, telefono, email, total_compras, puntos_fidelidad
       FROM clientes
       WHERE id = ?`,
            [clientePrincipalId]
        )

        const clientePrincipalDespues = clientesPosterior[0]

        // Actualizar detección como fusionada
        await connection.execute(
            `UPDATE clientes_duplicados_detecciones
       SET estado = 'fusionado', fecha_accion = NOW()
       WHERE cliente_padre_id = ? AND cliente_duplicado_id = ?`,
            [clientePrincipalId, clienteFusionadoId]
        )

        // Nota: La auditoría ya se registra dentro del stored procedure,
        // pero podemos agregar registro adicional si es necesario

        return {
            success: true,
            mensaje: 'Clientes fusionados exitosamente',
            datosAnteriores: {
                principal: clientePrincipalAntes,
                fusionado: clienteFusionadoAntes
            },
            datosNuevos: {
                principal: clientePrincipalDespues
            }
        }
    } catch (error) {
        console.error('Error al fusionar clientes:', error)
        return {
            success: false,
            mensaje: error.message || 'Error al fusionar clientes. La operación fue revertida.'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Marcar duplicado como "no duplicado" (descartado)
 */
export async function descartarDuplicado(deteccionId, motivo) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        await connection.execute(
            `UPDATE clientes_duplicados_detecciones
       SET estado = 'descartado',
           notas = ?,
           revisado_por = ?,
           fecha_revision = NOW()
       WHERE id = ?`,
            [motivo, validacion.userId, deteccionId]
        )

        // Registrar auditoría
        await registrarAuditoria({
            entidad: 'clientes',
            tipoAccion: 'ACTUALIZAR',
            entidadId: deteccionId,
            usuarioId: validacion.userId,
            descripcion: `Detección descartada: ${motivo}`
        })

        return {
            success: true,
            mensaje: 'Detección descartada correctamente'
        }
    } catch (error) {
        console.error('Error al descartar duplicado:', error)
        return {
            success: false,
            mensaje: 'Error al descartar la detección'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Inactivar cliente
 */
export async function inactivarCliente(clienteId, motivo) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        // Verificar que no tenga ventas
        const [ventas] = await connection.execute(
            'SELECT COUNT(*) as cantidad FROM ventas WHERE cliente_id = ?',
            [clienteId]
        )

        if (ventas[0].cantidad > 0) {
            return {
                success: false,
                mensaje: 'No se puede inactivar un cliente con ventas registradas. Considere fusionarlo en su lugar.'
            }
        }

        // Obtener datos antes del cambio
        const [clienteAntes] = await connection.execute(
            'SELECT * FROM clientes WHERE id = ?',
            [clienteId]
        )

        // Inactivar
        await connection.execute(
            `UPDATE clientes
       SET estado = 'inactivo',
           motivo_estado = ?,
           fecha_cambio_estado = NOW()
       WHERE id = ?`,
            [motivo, clienteId]
        )

        // Registrar auditoría
        await registrarAuditoria({
            entidad: 'clientes',
            tipoAccion: 'ACTUALIZAR',
            entidadId: clienteId,
            usuarioId: validacion.userId,
            descripcion: `Cliente inactivado: ${motivo}`,
            datosAnteriores: clienteAntes[0]
        })

        return {
            success: true,
            mensaje: 'Cliente inactivado exitosamente'
        }
    } catch (error) {
        console.error('Error al inactivar cliente:', error)
        return {
            success: false,
            mensaje: 'Error al inactivar el cliente'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Reactivar cliente
 */
export async function reactivarCliente(clienteId) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const [clienteAntes] = await connection.execute(
            'SELECT * FROM clientes WHERE id = ?',
            [clienteId]
        )

        await connection.execute(
            `UPDATE clientes
       SET estado = 'activo',
           motivo_estado = NULL,
           fecha_cambio_estado = NOW()
       WHERE id = ?`,
            [clienteId]
        )

        await registrarAuditoria({
            entidad: 'clientes',
            tipoAccion: 'ACTUALIZAR',
            entidadId: clienteId,
            usuarioId: validacion.userId,
            descripcion: 'Cliente reactivado',
            datosAnteriores: clienteAntes[0]
        })

        return {
            success: true,
            mensaje: 'Cliente reactivado exitosamente'
        }
    } catch (error) {
        console.error('Error al reactivar cliente:', error)
        return {
            success: false,
            mensaje: 'Error al reactivar el cliente'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener clientes inactivos
 */
export async function obtenerClientesInactivos(empresaId = null) {
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
        c.nombre,
        c.telefono,
        c.email,
        c.estado,
        c.motivo_estado,
        c.fecha_cambio_estado,
        c.total_compras,
        (SELECT COUNT(*) FROM ventas WHERE cliente_id = c.id) as cantidad_ventas
      FROM clientes c
      INNER JOIN empresas e ON c.empresa_id = e.id
      WHERE c.estado = 'inactivo'
      ${empresaId ? 'AND c.empresa_id = ?' : ''}
      ORDER BY c.fecha_cambio_estado DESC
    `

        const params = empresaId ? [empresaId] : []
        const [clientes] = await connection.execute(query, params)

        return {
            success: true,
            clientes: clientes
        }
    } catch (error) {
        console.error('Error al obtener clientes inactivos:', error)
        return {
            success: false,
            mensaje: 'Error al cargar clientes inactivos'
        }
    } finally {
        connection.release()
    }
}

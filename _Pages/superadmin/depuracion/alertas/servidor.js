"use server"

/**
 * SERVER ACTIONS - GESTIÓN DE ALERTAS
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
                tipoAccion,
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
 * ACCIÓN: Obtener alertas
 */
export async function obtenerAlertas(filtroEstado = 'todas', filtroSeveridad = 'todas') {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        let query = `
      SELECT 
        a.*,
        e.nombre_empresa,
        u_asignado.nombre as asignada_a_nombre,
        u_resuelto.nombre as resuelta_por_nombre
      FROM alertas_sistema a
      LEFT JOIN empresas e ON a.empresa_id = e.id
      LEFT JOIN usuarios u_asignado ON a.asignada_a = u_asignado.id
      LEFT JOIN usuarios u_resuelto ON a.resuelta_por = u_resuelto.id
    `

        const params = []
        const condiciones = []

        if (filtroEstado !== 'todas') {
            condiciones.push('a.estado = ?')
            params.push(filtroEstado)
        }

        if (filtroSeveridad !== 'todas') {
            condiciones.push('a.severidad = ?')
            params.push(filtroSeveridad)
        }

        if (condiciones.length > 0) {
            query += ` WHERE ` + condiciones.join(' AND ')
        }

        query += ` ORDER BY 
      CASE a.severidad
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'media' THEN 3
        ELSE 4
      END,
      a.fecha_generacion DESC`

        const [alertas] = await connection.execute(query, params)

        return {
            success: true,
            alertas: alertas
        }
    } catch (error) {
        console.error('Error al obtener alertas:', error)
        return {
            success: false,
            mensaje: 'Error al cargar alertas'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Resolver alerta
 */
export async function resolverAlerta(alertaId, accionesTomadas) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        await connection.execute(
            `UPDATE alertas_sistema
       SET estado = 'resuelta',
           fecha_resolucion = NOW(),
           resuelta_por = ?,
           acciones_tomadas = ?
       WHERE id = ?`,
            [validacion.userId, accionesTomadas, alertaId]
        )

        // Obtener alerta para auditoría
        const [alerta] = await connection.execute('SELECT * FROM alertas_sistema WHERE id = ?', [alertaId])

        await registrarAuditoria({
            modulo: 'alertas',
            accion: 'resolucion_alerta',
            tipoAccion: 'escritura',
            empresaId: alerta[0].empresa_id,
            entidadTipo: 'alerta',
            entidadId: alertaId,
            usuarioId: validacion.userId,
            descripcion: `Resolución de alerta: ${alerta[0].titulo}. Acciones: ${accionesTomadas}`
        })

        return {
            success: true,
            mensaje: 'Alerta marcada como resuelta'
        }
    } catch (error) {
        console.error('Error al resolver alerta:', error)
        return {
            success: false,
            mensaje: 'Error al actualizar la alerta'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Asignar alerta
 */
export async function asignarAlerta(alertaId, usuarioId) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        await connection.execute(
            `UPDATE alertas_sistema
       SET asignada_a = ?
       WHERE id = ?`,
            [usuarioId, alertaId]
        )

        return {
            success: true,
            mensaje: 'Alerta asignada correctamente'
        }
    } catch (error) {
        console.error('Error al asignar alerta:', error)
        return {
            success: false,
            mensaje: 'Error al asignar la alerta'
        }
    } finally {
        connection.release()
    }
}

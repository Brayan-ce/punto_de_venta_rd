"use server"

/**
 * SERVER ACTIONS - GESTIÓN DE SUSCRIPCIONES
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
 * ACCIÓN: Obtener todas las suscripciones
 */
export async function obtenerSuscripciones(filtroEstado = 'todas') {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        let query = `
      SELECT 
        s.*,
        e.nombre_empresa,
        e.rnc,
        e.bloqueada,
        DATEDIFF(s.fecha_vencimiento, CURDATE()) as dias_restantes,
        (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = s.empresa_id AND u.activo = 1) as usuarios_actuales,
        (SELECT COUNT(*) FROM productos p WHERE p.empresa_id = s.empresa_id AND p.activo = 1) as productos_actuales
      FROM empresas_suscripciones s
      INNER JOIN empresas e ON s.empresa_id = e.id
    `

        const params = []

        if (filtroEstado !== 'todas') {
            query += ` WHERE s.estado = ?`
            params.push(filtroEstado)
        }

        query += ` ORDER BY s.fecha_vencimiento ASC`

        const [suscripciones] = await connection.execute(query, params)

        return {
            success: true,
            suscripciones: suscripciones
        }
    } catch (error) {
        console.error('Error al obtener suscripciones:', error)
        return {
            success: false,
            mensaje: 'Error al cargar suscripciones'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Gestionar (Crear/Actualizar) Suscripción
 */
export async function gestionarSuscripcion(datos) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        // Verificar si ya existe
        const [existente] = await connection.execute(
            'SELECT * FROM empresas_suscripciones WHERE empresa_id = ?',
            [datos.empresaId]
        )

        if (existente.length > 0) {
            // Actualizar
            await connection.execute(
                `UPDATE empresas_suscripciones SET
          plan_nombre = ?,
          plan_tipo = ?,
          monto_mensual = ?,
          moneda = ?,
          fecha_inicio = ?,
          fecha_vencimiento = ?,
          limite_usuarios = ?,
          limite_productos = ?,
          estado = ?
        WHERE empresa_id = ?`,
                [
                    datos.plan_nombre,
                    datos.plan_tipo,
                    datos.monto_mensual,
                    datos.moneda || 'DOP',
                    datos.fecha_inicio,
                    datos.fecha_vencimiento,
                    datos.limite_usuarios,
                    datos.limite_productos,
                    datos.estado,
                    datos.empresaId
                ]
            )

            await registrarAuditoria({
                entidad: 'empresas_suscripciones',
                tipoAccion: 'ACTUALIZAR',
                entidadId: existente[0].id,
                usuarioId: validacion.userId,
                descripcion: `Actualización de suscripción para empresa #${datos.empresaId}`,
                datosAnteriores: existente[0],
                datosNuevos: datos
            })

        } else {
            // Crear
            await connection.execute(
                `INSERT INTO empresas_suscripciones (
          empresa_id, plan_nombre, plan_tipo, monto_mensual, moneda, 
          fecha_inicio, fecha_vencimiento,
          limite_usuarios, limite_productos,
          estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.empresaId,
                    datos.plan_nombre,
                    datos.plan_tipo,
                    datos.monto_mensual,
                    datos.moneda || 'DOP',
                    datos.fecha_inicio || new Date().toISOString().split('T')[0],
                    datos.fecha_vencimiento,
                    datos.limite_usuarios || 2,
                    datos.limite_productos || 500,
                    datos.estado || 'activa'
                ]
            )

            await registrarAuditoria({
                entidad: 'empresas_suscripciones',
                tipoAccion: 'CREAR',
                entidadId: datos.empresaId,
                usuarioId: validacion.userId,
                descripcion: `Creación de suscripción para empresa #${datos.empresaId}`,
                datosNuevos: datos
            })
        }

        return {
            success: true,
            mensaje: 'Suscripción guardada correctamente'
        }
    } catch (error) {
        console.error('Error al gestionar suscripción:', error)
        return {
            success: false,
            mensaje: 'Error al guardar la suscripción'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Suspender Suscripción (y bloquear empresa)
 */
export async function suspenderSuscripcion(empresaId, motivo) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        await connection.beginTransaction()

        // 1. Actualizar estado de suscripción
        await connection.execute(
            `UPDATE empresas_suscripciones 
       SET estado = 'suspendida'
       WHERE empresa_id = ?`,
            [empresaId]
        )

        // 2. Bloquear empresa
        await connection.execute(
            `UPDATE empresas 
       SET bloqueada = 1, 
           motivo_bloqueo = ?, 
           fecha_bloqueo = NOW(), 
           bloqueada_por = ?
       WHERE id = ?`,
            [motivo, validacion.userId, empresaId]
        )

        await registrarAuditoria({
            modulo: 'suscripciones',
            accion: 'suspender_suscripcion',
            tipoAccion: 'bloqueo',
            empresaId: empresaId,
            entidadTipo: 'empresa',
            entidadId: empresaId,
            usuarioId: validacion.userId,
            descripcion: `Suspensión de suscripción y bloqueo de empresa: ${motivo}`
        })

        await connection.commit()

        return {
            success: true,
            mensaje: 'Empresa suspendida y bloqueada correctamente'
        }
    } catch (error) {
        await connection.rollback()
        console.error('Error al suspender empresa:', error)
        return {
            success: false,
            mensaje: 'Error al suspender la empresa'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Activar Suscripción (y desbloquear empresa)
 */
export async function activarSuscripcion(empresaId, extenderDias = 30) {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        await connection.beginTransaction()

        // 1. Actualizar suscripción
        await connection.execute(
            `UPDATE empresas_suscripciones 
       SET estado = 'activa',
           fecha_vencimiento = DATE_ADD(GREATEST(fecha_vencimiento, CURDATE()), INTERVAL ? DAY)
       WHERE empresa_id = ?`,
            [extenderDias, empresaId]
        )

        // 2. Desbloquear empresa
        await connection.execute(
            `UPDATE empresas 
       SET bloqueada = 0, 
           motivo_bloqueo = NULL,
           fecha_bloqueo = NULL,
           bloqueada_por = NULL
       WHERE id = ?`,
            [empresaId]
        )

        await registrarAuditoria({
            modulo: 'suscripciones',
            accion: 'activar_suscripcion',
            tipoAccion: 'desbloqueo',
            empresaId: empresaId,
            entidadTipo: 'empresa',
            entidadId: empresaId,
            usuarioId: validacion.userId,
            descripcion: `Reactivación de suscripción (extensión ${extenderDias} días) and desbloqueo de empresa`
        })

        await connection.commit()

        return {
            success: true,
            mensaje: 'Empresa activada y desbloqueada correctamente'
        }
    } catch (error) {
        await connection.rollback()
        console.error('Error al activar empresa:', error)
        return {
            success: false,
            mensaje: 'Error al activar la empresa'
        }
    } finally {
        connection.release()
    }
}

/**
 * ACCIÓN: Obtener empresas con problemas (Vista Resumen)
 */
export async function obtenerEmpresasConProblemas() {
    const validacion = await validarSuperadmin()
    if (!validacion.success) {
        return validacion
    }

    const connection = await db.getConnection()

    try {
        const query = `
      WITH counts AS (
        SELECT 
          empresa_id,
          (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = e.id AND u.activo = 1) as usuarios_count,
          (SELECT COUNT(*) FROM productos p WHERE p.empresa_id = e.id AND p.activo = 1) as productos_count
        FROM empresas e
      )
      SELECT 
        e.id,
        e.nombre_empresa,
        e.bloqueada,
        s.estado as estado_suscripcion,
        DATEDIFF(s.fecha_vencimiento, CURDATE()) as dias_hasta_vencimiento,
        (SELECT COUNT(*) FROM alertas_sistema WHERE empresa_id = e.id AND estado = 'activa') as alertas_activas,
        c.usuarios_count as usuarios_actuales,
        s.limite_usuarios,
        c.productos_count as productos_actuales,
        s.limite_productos,
        CASE 
          WHEN e.bloqueada = 1 THEN 'Empresa bloqueada'
          WHEN s.estado = 'suspendida' THEN 'Suscripción suspendida'
          WHEN s.estado = 'vencida' THEN 'Suscripción vencida'
          WHEN c.usuarios_count > s.limite_usuarios THEN 'Límite de usuarios excedido'
          WHEN c.productos_count > s.limite_productos THEN 'Límite de productos excedido'
          ELSE 'Alertas activas'
        END as problema_principal
      FROM empresas e
      JOIN counts c ON e.id = c.empresa_id
      LEFT JOIN empresas_suscripciones s ON e.id = s.empresa_id
      WHERE e.bloqueada = 1 
         OR s.estado IN ('vencida', 'suspendida')
         OR c.usuarios_count > s.limite_usuarios
         OR c.productos_count > s.limite_productos
         OR EXISTS (SELECT 1 FROM alertas_sistema WHERE empresa_id = e.id AND estado = 'activa' and severidad IN ('critica', 'alta'))
      LIMIT 10
    `

        const [empresas] = await connection.execute(query)

        return {
            success: true,
            empresas: empresas
        }
    } catch (error) {
        console.error('Error al obtener empresas con problemas:', error)
        return {
            success: false,
            empresas: []
        }
    } finally {
        connection.release()
    }
}

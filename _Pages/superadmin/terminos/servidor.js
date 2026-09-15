"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { headers } from 'next/headers'

// =====================================================
// FUNCIONES DE SUPERADMIN
// =====================================================

/**
 * Obtener todos los términos (histórico completo)
 */
export async function obtenerHistorialTerminos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [terminos] = await connection.execute(
            `SELECT 
                id, 
                version, 
                titulo, 
                LEFT(contenido, 200) as contenido_preview,
                activo, 
                creado_en, 
                actualizado_en,
                (SELECT COUNT(*) FROM usuarios_terminos WHERE terminos_id = terminos_condiciones.id) as total_aceptaciones
            FROM terminos_condiciones 
            ORDER BY creado_en DESC`
        )

        connection.release()

        return {
            success: true,
            data: terminos
        }

    } catch (error) {
        console.error('Error al obtener historial:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cargar historial'
        }
    }
}

/**
 * Obtener un término por ID (completo)
 */
export async function obtenerTerminoPorId(terminoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [terminos] = await connection.execute(
            `SELECT 
                id, 
                version, 
                titulo, 
                contenido, 
                activo, 
                creado_en, 
                actualizado_en
            FROM terminos_condiciones 
            WHERE id = ?`,
            [terminoId]
        )

        connection.release()

        if (terminos.length === 0) {
            return {
                success: false,
                mensaje: 'Término no encontrado'
            }
        }

        return {
            success: true,
            data: terminos[0]
        }

    } catch (error) {
        console.error('Error al obtener término:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cargar término'
        }
    }
}

/**
 * Crear nueva versión de términos
 */
export async function crearTerminos(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        const { version, titulo, contenido } = datos

        if (!version || !titulo || !contenido) {
            return {
                success: false,
                mensaje: 'Todos los campos son requeridos'
            }
        }

        connection = await db.getConnection()

        // Verificar que no exista la versión
        const [versionExiste] = await connection.execute(
            'SELECT id FROM terminos_condiciones WHERE version = ?',
            [version]
        )

        if (versionExiste.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una versión con ese número'
            }
        }

        // Insertar nuevo término (NO activo por defecto)
        const [resultado] = await connection.execute(
            `INSERT INTO terminos_condiciones (version, titulo, contenido, activo) 
             VALUES (?, ?, ?, FALSE)`,
            [version, titulo, contenido]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Términos creados exitosamente',
            id: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear términos:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al crear términos'
        }
    }
}

/**
 * Editar términos existentes (solo si NO están activos)
 */
export async function editarTerminos(terminoId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        const { titulo, contenido } = datos

        if (!titulo || !contenido) {
            return {
                success: false,
                mensaje: 'Título y contenido son requeridos'
            }
        }

        connection = await db.getConnection()

        // Verificar que el término existe y NO está activo
        const [termino] = await connection.execute(
            'SELECT activo FROM terminos_condiciones WHERE id = ?',
            [terminoId]
        )

        if (termino.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Término no encontrado'
            }
        }

        if (termino[0].activo) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede editar un término activo. Desactívelo primero.'
            }
        }

        // Actualizar término
        await connection.execute(
            `UPDATE terminos_condiciones 
             SET titulo = ?, contenido = ?, actualizado_en = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [titulo, contenido, terminoId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Términos actualizados exitosamente'
        }

    } catch (error) {
        console.error('Error al editar términos:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al actualizar términos'
        }
    }
}

/**
 * Activar una versión de términos (desactiva las demás automáticamente)
 */
export async function activarTerminos(terminoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        // Iniciar transacción
        await connection.beginTransaction()

        // Desactivar todas las versiones
        await connection.execute('UPDATE terminos_condiciones SET activo = FALSE')

        // Activar la versión seleccionada
        const [resultado] = await connection.execute(
            'UPDATE terminos_condiciones SET activo = TRUE WHERE id = ?',
            [terminoId]
        )

        if (resultado.affectedRows === 0) {
            await connection.rollback()
            connection.release()
            return {
                success: false,
                mensaje: 'Término no encontrado'
            }
        }

        await connection.commit()
        connection.release()

        return {
            success: true,
            mensaje: 'Versión activada exitosamente. Todos los usuarios deberán aceptar los nuevos términos.'
        }

    } catch (error) {
        console.error('Error al activar términos:', error)
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        return {
            success: false,
            mensaje: 'Error al activar términos'
        }
    }
}

/**
 * Obtener aceptaciones de un término específico
 */
export async function obtenerAceptacionesTermino(terminoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [aceptaciones] = await connection.execute(
            `SELECT 
                ut.id,
                ut.aceptado_en,
                ut.ip_address,
                ut.user_agent,
                u.nombre as usuario_nombre,
                u.email as usuario_email,
                e.nombre_empresa
            FROM usuarios_terminos ut
            INNER JOIN usuarios u ON ut.usuario_id = u.id
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE ut.terminos_id = ?
            ORDER BY ut.aceptado_en DESC`,
            [terminoId]
        )

        connection.release()

        return {
            success: true,
            data: aceptaciones
        }

    } catch (error) {
        console.error('Error al obtener aceptaciones:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al cargar aceptaciones'
        }
    }
}

// =====================================================
// FUNCIONES PARA USUARIOS AUTENTICADOS
// =====================================================

/**
 * Verificar si el usuario actual aceptó los términos activos
 */
export async function verificarAceptacionUsuario() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                requiereAceptacion: false,
                mensaje: 'Usuario no autenticado'
            }
        }

        connection = await db.getConnection()

        // Obtener términos activos
        const [terminosActivos] = await connection.execute(
            'SELECT id, version, titulo, contenido FROM terminos_condiciones WHERE activo = TRUE LIMIT 1'
        )

        if (terminosActivos.length === 0) {
            connection.release()
            return {
                success: true,
                requiereAceptacion: false
            }
        }

        // Verificar si el usuario aceptó esta versión
        const [aceptacion] = await connection.execute(
            `SELECT id FROM usuarios_terminos 
             WHERE usuario_id = ? AND terminos_id = ?`,
            [userId, terminosActivos[0].id]
        )

        connection.release()

        return {
            success: true,
            requiereAceptacion: aceptacion.length === 0,
            terminos: aceptacion.length === 0 ? terminosActivos[0] : null
        }

    } catch (error) {
        console.error('Error al verificar aceptación:', error)
        if (connection) connection.release()
        return {
            success: false,
            requiereAceptacion: false,
            mensaje: 'Error al verificar aceptación'
        }
    }
}

/**
 * Registrar aceptación de términos por usuario autenticado
 */
export async function aceptarTerminos(terminoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Usuario no autenticado'
            }
        }

        // ✅ Obtener IP y User-Agent (headers() debe ser await en Next.js App Router)
        const headersList = await headers()

        // Extraer IP (x-forwarded-for puede tener múltiples IPs separadas por coma)
        const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            'IP no disponible'
        const userAgent = headersList.get('user-agent') || 'User-Agent no disponible'

        connection = await db.getConnection()

        // Verificar que el término existe y está activo
        const [termino] = await connection.execute(
            'SELECT id FROM terminos_condiciones WHERE id = ? AND activo = TRUE',
            [terminoId]
        )

        if (termino.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Término no válido o inactivo'
            }
        }

        // Registrar aceptación (ON DUPLICATE KEY UPDATE actualiza la fecha)
        await connection.execute(
            `INSERT INTO usuarios_terminos (usuario_id, terminos_id, ip_address, user_agent, aceptado_en)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE 
                aceptado_en = CURRENT_TIMESTAMP,
                ip_address = VALUES(ip_address),
                user_agent = VALUES(user_agent)`,
            [userId, terminoId, ipAddress, userAgent]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Términos aceptados correctamente'
        }

    } catch (error) {
        console.error('Error al aceptar términos:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: 'Error al registrar aceptación'
        }
    }
}

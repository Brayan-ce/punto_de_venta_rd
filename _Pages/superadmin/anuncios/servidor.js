"use server"

import db from "@/_DB/db"
import { cookies } from "next/headers"

async function verificarSuperAdmin() {
    const cookieStore = await cookies()
    const userTipo = cookieStore.get("userTipo")?.value
    if (userTipo !== "superadmin") throw new Error("No autorizado")
}

// ─── CRUD SUPERADMIN ──────────────────────────────────────────────────────────

export async function listarAnuncios() {
    await verificarSuperAdmin()
    let connection
    try {
        connection = await db.getConnection()
        const [rows] = await connection.execute(`
            SELECT
                a.*,
                COUNT(DISTINCT ar.user_id) AS total_leidos,
                p.title AS parent_title,
                p.recurrence AS parent_recurrence,
                p.day_of_month AS parent_day_of_month
            FROM announcements a
            LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id
            LEFT JOIN announcements p ON p.id = a.parent_id
            WHERE a.activo = 1 AND a.parent_id IS NULL
            GROUP BY a.id
            ORDER BY a.created_at DESC
        `)
        connection.release()
        return { success: true, anuncios: rows }
    } catch (e) {
        if (connection) connection.release()
        console.error("listarAnuncios:", e)
        return { success: false, mensaje: e.message }
    }
}

export async function crearAnuncio(data) {
    const {
        title, message, type = "info", target_type = "all",
        is_mandatory = true, scheduled_at, expires_at,
        recurrence = null, day_of_month = null,
        targets = []   // [{ empresa_id } | { user_id }]
    } = data

    if (!title?.trim() || !message?.trim()) {
        return { success: false, mensaje: "Título y mensaje son obligatorios" }
    }

    if (target_type === "specific" && targets.length === 0) {
        return { success: false, mensaje: "Debes seleccionar al menos un usuario o empresa para destino específico" }
    }

    let connection
    try {
        await verificarSuperAdmin()
        connection = await db.getConnection()
        await connection.beginTransaction()

        const isTemplate = recurrence === 'monthly' ? 1 : 0
        const dayOfMonth = recurrence === 'monthly' ? (day_of_month || new Date().getDate()) : null

        const [res] = await connection.execute(
            `INSERT INTO announcements
             (is_template, title, message, type, target_type, is_mandatory, scheduled_at, expires_at, recurrence, day_of_month)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                isTemplate,
                title.trim(),
                message.trim(),
                type,
                target_type,
                is_mandatory ? 1 : 0,
                scheduled_at || new Date(),
                expires_at || null,
                recurrence || null,
                dayOfMonth
            ]
        )

        const announcementId = res.insertId

        if (target_type === "specific" && targets.length > 0) {
            for (const t of targets) {
                await connection.execute(
                    `INSERT INTO announcement_targets (announcement_id, empresa_id, user_id) VALUES (?, ?, ?)`,
                    [announcementId, t.empresa_id || null, t.user_id || null]
                )
            }
        }

        await connection.commit()
        connection.release()

        if (isTemplate) {
            let conn2
            try {
                conn2 = await db.getConnection()
                const [ir] = await conn2.execute(`
                    INSERT INTO announcements
                    (parent_id, is_template, month_year, title, message, type, target_type, is_mandatory, scheduled_at, activo)
                    VALUES (?, 0, DATE_FORMAT(NOW(), '%Y-%m'), ?, ?, ?, ?, ?, NOW(), 1)
                `, [announcementId, title.trim(), message.trim(), type, target_type, is_mandatory ? 1 : 0])

                if (target_type === "specific" && targets.length > 0) {
                    for (const t of targets) {
                        await conn2.execute(
                            `INSERT INTO announcement_targets (announcement_id, empresa_id, user_id) VALUES (?, ?, ?)`,
                            [ir.insertId, t.empresa_id || null, t.user_id || null]
                        )
                    }
                }
                conn2.release()
            } catch (e) {
                if (conn2) conn2.release()
                console.error("Error creando primera instancia mensual:", e)
            }
        }

        return { success: true, id: announcementId }
    } catch (e) {
        if (connection) { await connection.rollback(); connection.release() }
        console.error("crearAnuncio:", e)
        return { success: false, mensaje: e.message }
    }
}

export async function actualizarAnuncio(id, data) {
    const {
        title, message, type, target_type, is_mandatory,
        scheduled_at, expires_at, recurrence, day_of_month, targets = []
    } = data

    if (!title?.trim() || !message?.trim()) {
        return { success: false, mensaje: "Título y mensaje son obligatorios" }
    }

    let connection
    try {
        await verificarSuperAdmin()
        connection = await db.getConnection()
        await connection.beginTransaction()

        const isTemplate = recurrence === 'monthly' ? 1 : 0
        await connection.execute(
            `UPDATE announcements SET
                is_template=?, title=?, message=?, type=?, target_type=?, is_mandatory=?,
                scheduled_at=?, expires_at=?, recurrence=?, day_of_month=?
             WHERE id=?`,
            [
                isTemplate,
                title.trim(), message.trim(), type, target_type,
                is_mandatory ? 1 : 0,
                scheduled_at || new Date(),
                expires_at || null,
                recurrence || null,
                day_of_month || null,
                id
            ]
        )

        // Reemplazar targets de la plantilla
        await connection.execute(`DELETE FROM announcement_targets WHERE announcement_id=?`, [id])
        if (target_type === "specific" && targets.length > 0) {
            for (const t of targets) {
                await connection.execute(
                    `INSERT INTO announcement_targets (announcement_id, empresa_id, user_id) VALUES (?, ?, ?)`,
                    [id, t.empresa_id || null, t.user_id || null]
                )
            }
        }

        // Si es plantilla, sincronizar contenido y targets en las instancias activas del mes actual
        if (isTemplate) {
            const [instancias] = await connection.execute(
                `SELECT id FROM announcements WHERE parent_id = ? AND activo = 1`,
                [id]
            )
            for (const inst of instancias) {
                await connection.execute(
                    `UPDATE announcements SET title=?, message=?, type=?, target_type=?, is_mandatory=? WHERE id=?`,
                    [title.trim(), message.trim(), type, target_type, is_mandatory ? 1 : 0, inst.id]
                )
                await connection.execute(`DELETE FROM announcement_targets WHERE announcement_id=?`, [inst.id])
                if (target_type === "specific" && targets.length > 0) {
                    for (const t of targets) {
                        await connection.execute(
                            `INSERT INTO announcement_targets (announcement_id, empresa_id, user_id) VALUES (?, ?, ?)`,
                            [inst.id, t.empresa_id || null, t.user_id || null]
                        )
                    }
                }
            }
        }

        await connection.commit()
        connection.release()
        return { success: true }
    } catch (e) {
        if (connection) { await connection.rollback(); connection.release() }
        console.error("actualizarAnuncio:", e)
        return { success: false, mensaje: e.message }
    }
}

export async function eliminarAnuncio(id) {
    await verificarSuperAdmin()
    let connection
    try {
        connection = await db.getConnection()
        await connection.execute(`UPDATE announcements SET activo=0 WHERE id=?`, [id])
        connection.release()
        return { success: true }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: e.message }
    }
}

export async function obtenerAnuncioPorId(id) {
    await verificarSuperAdmin()
    let connection
    try {
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT * FROM announcements WHERE id = ? AND activo = 1 LIMIT 1`, [id]
        )
        if (rows.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Anuncio no encontrado' }
        }
        const [targets] = await connection.execute(
            `SELECT t.empresa_id, t.user_id, e.nombre_empresa, u.nombre AS nombre_usuario
             FROM announcement_targets t
             LEFT JOIN empresas e ON e.id = t.empresa_id
             LEFT JOIN usuarios u ON u.id = t.user_id
             WHERE t.announcement_id = ?`, [id]
        )
        connection.release()
        return { success: true, anuncio: rows[0], targets }
    } catch (e) {
        if (connection) connection.release()
        console.error('obtenerAnuncioPorId:', e)
        return { success: false, mensaje: e.message }
    }
}

export async function obtenerLectoresAnuncio(announcementId) {
    await verificarSuperAdmin()
    let connection
    try {
        connection = await db.getConnection()
        const [rows] = await connection.execute(`
            SELECT u.nombre, u.email, e.nombre_empresa, ar.read_at
            FROM announcement_reads ar
            JOIN usuarios u ON u.id = ar.user_id
            LEFT JOIN empresas e ON e.id = u.empresa_id
            WHERE ar.announcement_id = ?
            ORDER BY ar.read_at DESC
        `, [announcementId])
        connection.release()
        return { success: true, lectores: rows }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: e.message }
    }
}

export async function obtenerEmpresasYUsuarios() {
    await verificarSuperAdmin()
    let connection
    try {
        connection = await db.getConnection()
        const [empresas] = await connection.execute(
            `SELECT id, nombre_empresa FROM empresas WHERE activo=1 ORDER BY nombre_empresa ASC`
        )
        const [usuarios] = await connection.execute(
            `SELECT u.id, u.nombre, u.email, u.empresa_id, e.nombre_empresa
             FROM usuarios u
             LEFT JOIN empresas e ON e.id = u.empresa_id
             WHERE u.activo=1 ORDER BY u.nombre ASC`
        )
        connection.release()
        return { success: true, empresas, usuarios }
    } catch (e) {
        if (connection) connection.release()
        return { success: false, mensaje: e.message }
    }
}

// ─── PARA EL PANEL ADMIN (usuario normal) ────────────────────────────────────

export async function obtenerAnuncioPendiente() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get("userId")?.value
        const empresaId = cookieStore.get("empresaId")?.value

        if (!userId) return { success: false, anuncio: null }

        connection = await db.getConnection()
        const ahora = new Date()

        // Procesar anuncios recurrentes antes de buscar pendientes
        await procesarAnunciosRecurrentes()

        const [rows] = await connection.execute(`
            SELECT a.*
            FROM announcements a
            WHERE a.activo = 1
              AND a.is_template = 0
              AND a.scheduled_at <= NOW()
              AND (a.expires_at IS NULL OR a.expires_at >= NOW())
              AND a.id NOT IN (
                  SELECT announcement_id FROM announcement_reads WHERE user_id = ?
              )
              AND (
                  a.target_type = 'all'
                  OR EXISTS (
                      SELECT 1 FROM announcement_targets t
                      WHERE t.announcement_id = a.id
                        AND (t.user_id = ? OR (t.empresa_id = ? AND t.user_id IS NULL))
                  )
              )
            ORDER BY a.scheduled_at DESC
            LIMIT 1
        `, [userId, userId, empresaId || null])

        connection.release()

        if (rows.length === 0) return { success: true, anuncio: null }
        return { success: true, anuncio: rows[0] }
    } catch (e) {
        if (connection) connection.release()
        console.error("obtenerAnuncioPendiente:", e)
        return { success: true, anuncio: null }
    }
}

export async function marcarAnuncioLeido(announcementId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get("userId")?.value
        if (!userId) return { success: false }

        connection = await db.getConnection()
        await connection.execute(
            `INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)`,
            [announcementId, userId]
        )
        connection.release()
        return { success: true }
    } catch (e) {
        if (connection) connection.release()
        console.error("marcarAnuncioLeido:", e)
        return { success: false }
    }
}

// ─── PROCESAR ANUNCIOS RECURRENTES ──────────────────────────────────────

export async function procesarAnunciosRecurrentes() {
    let connection
    try {
        connection = await db.getConnection()
        await connection.beginTransaction()
        
        const ahora = new Date()
        const mesActual = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') // YYYY-MM local
        const diaActual = ahora.getDate()

        // Buscar plantillas recurrentes que deben activarse este mes
        const [plantillas] = await connection.execute(`
            SELECT * FROM announcements
            WHERE is_template = 1
              AND recurrence = 'monthly'
              AND day_of_month = ?
              AND activo = 1
              AND scheduled_at <= NOW()
            FOR UPDATE
        `, [diaActual])

        for (const plantilla of plantillas) {
            // Verificar si ya existe instancia para este mes
            const [existente] = await connection.execute(`
                SELECT id FROM announcements
                WHERE parent_id = ?
                  AND month_year = ?
                  AND activo = 1
                LIMIT 1
            `, [plantilla.id, mesActual])

            if (existente.length === 0) {
                // Crear nueva instancia
                const scheduledDate = new Date()
                scheduledDate.setHours(0, 0, 0, 0)

                const expiresAt = plantilla.expires_at ?
                    new Date(ahora.getFullYear(), ahora.getMonth(), plantilla.expires_at.getDate(), 
                             plantilla.expires_at.getHours(), plantilla.expires_at.getMinutes()) :
                    null

                const [res] = await connection.execute(`
                    INSERT INTO announcements
                    (parent_id, is_template, month_year, title, message, type, target_type, is_mandatory, scheduled_at, expires_at, recurrence, day_of_month, activo)
                    VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    plantilla.id,
                    mesActual,
                    plantilla.title,
                    plantilla.message,
                    plantilla.type,
                    plantilla.target_type,
                    plantilla.is_mandatory,
                    scheduledDate,
                    expiresAt,
                    null, // Las instancias no tienen recurrencia
                    null  // Las instancias no tienen day_of_month
                ])

                // Copiar targets de la plantilla a la instancia
                const instanciaId = res.insertId
                const [targets] = await connection.execute(`
                    SELECT empresa_id, user_id FROM announcement_targets
                    WHERE announcement_id = ?
                `, [plantilla.id])

                for (const t of targets) {
                    await connection.execute(`
                        INSERT INTO announcement_targets (announcement_id, empresa_id, user_id)
                        VALUES (?, ?, ?)
                    `, [instanciaId, t.empresa_id, t.user_id])
                }
            }
        }

        await connection.commit()
        connection.release()
        return { success: true, procesadas: plantillas.length }
    } catch (e) {
        if (connection) { await connection.rollback(); connection.release() }
        console.error("procesarAnunciosRecurrentes:", e)
        return { success: false, mensaje: e.message }
    }
}

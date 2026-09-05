"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function verificarSuperAdmin() {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const userTipo = cookieStore.get('userTipo')?.value
    if (!userId || userTipo !== 'superadmin') return null
    return userId
}

export async function obtenerGuias() {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT id, titulo, descripcion, tipo, contenido, orden, activo, created_at, updated_at
             FROM guia_contenido
             ORDER BY orden ASC, id ASC`
        )
        connection.release()
        return { success: true, guias: rows }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error al obtener guias:', error)
        return { success: false, mensaje: 'Error al obtener guías' }
    }
}

export async function crearGuia(datos) {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        const { titulo, descripcion, tipo, contenido, orden, activo } = datos

        if (!titulo?.trim()) return { success: false, mensaje: 'El título es requerido' }
        if (!tipo) return { success: false, mensaje: 'El tipo es requerido' }

        connection = await db.getConnection()

        const [maxOrden] = await connection.execute(
            `SELECT COALESCE(MAX(orden), 0) as max_orden FROM guia_contenido`
        )
        const nuevoOrden = orden ?? (maxOrden[0].max_orden + 1)

        const [result] = await connection.execute(
            `INSERT INTO guia_contenido (titulo, descripcion, tipo, contenido, orden, activo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [titulo.trim(), descripcion?.trim() || null, tipo, contenido?.trim() || null, nuevoOrden, activo ? 1 : 0]
        )
        connection.release()
        return { success: true, id: result.insertId, mensaje: 'Guía creada exitosamente' }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error al crear guia:', error)
        return { success: false, mensaje: 'Error al crear guía' }
    }
}

export async function actualizarGuia(id, datos) {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        const { titulo, descripcion, tipo, contenido, orden, activo } = datos

        if (!titulo?.trim()) return { success: false, mensaje: 'El título es requerido' }
        if (!tipo) return { success: false, mensaje: 'El tipo es requerido' }

        connection = await db.getConnection()
        const [result] = await connection.execute(
            `UPDATE guia_contenido
             SET titulo = ?, descripcion = ?, tipo = ?, contenido = ?, orden = ?, activo = ?
             WHERE id = ?`,
            [titulo.trim(), descripcion?.trim() || null, tipo, contenido?.trim() || null, orden ?? 0, activo ? 1 : 0, id]
        )
        connection.release()

        if (result.affectedRows === 0) return { success: false, mensaje: 'Guía no encontrada' }
        return { success: true, mensaje: 'Guía actualizada exitosamente' }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error al actualizar guia:', error)
        return { success: false, mensaje: 'Error al actualizar guía' }
    }
}

export async function eliminarGuia(id) {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        connection = await db.getConnection()
        const [result] = await connection.execute(
            `DELETE FROM guia_contenido WHERE id = ?`, [id]
        )
        connection.release()

        if (result.affectedRows === 0) return { success: false, mensaje: 'Guía no encontrada' }
        return { success: true, mensaje: 'Guía eliminada exitosamente' }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error al eliminar guia:', error)
        return { success: false, mensaje: 'Error al eliminar guía' }
    }
}

export async function reordenarGuias(items) {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        for (const item of items) {
            await connection.execute(
                `UPDATE guia_contenido SET orden = ? WHERE id = ?`,
                [item.orden, item.id]
            )
        }

        await connection.commit()
        connection.release()
        return { success: true, mensaje: 'Orden actualizado exitosamente' }
    } catch (error) {
        if (connection) {
            await connection.rollback()
            connection.release()
        }
        console.error('Error al reordenar guias:', error)
        return { success: false, mensaje: 'Error al reordenar guías' }
    }
}

export async function toggleActivoGuia(id, activo) {
    let connection
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE guia_contenido SET activo = ? WHERE id = ?`,
            [activo ? 1 : 0, id]
        )
        connection.release()
        return { success: true, mensaje: `Guía ${activo ? 'activada' : 'desactivada'} exitosamente` }
    } catch (error) {
        if (connection) connection.release()
        console.error('Error al cambiar estado guia:', error)
        return { success: false, mensaje: 'Error al cambiar estado' }
    }
}

export async function subirVideoGuia(formData) {
    try {
        const userId = await verificarSuperAdmin()
        if (!userId) return { success: false, mensaje: 'Acceso no autorizado' }

        const uploadUrl = process.env.UPLOAD_SERVER_URL || 'http://localhost:5000/upload'

        const res = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        })

        if (!res.ok) return { success: false, mensaje: 'Error al conectar con el servidor de uploads' }

        const data = await res.json()

        if (!data.success) return { success: false, mensaje: data.mensaje || 'Error al subir video' }

        return { success: true, ruta: data.ruta, filename: data.filename }
    } catch (error) {
        console.error('Error al subir video:', error)
        return { success: false, mensaje: 'Error al subir el video' }
    }
}
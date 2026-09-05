"use server"
import db from "@/_DB/db"

export async function obtenerMetodos() {
    let connection
    try {
        connection = await db.getConnection()
        const [metodos] = await connection.execute(
            `SELECT m.*, COUNT(p.id) AS total_pagos
             FROM metodos_pago m
             LEFT JOIN fin_pagos p ON m.id = p.metodo_pago_id
             GROUP BY m.id
             ORDER BY m.nombre ASC`
        )
        connection.release()
        return { success: true, metodos }
    } catch (error) {
        console.error('obtenerMetodos:', error)
        if (connection) connection.release()
        return { success: false, metodos: [] }
    }
}

export async function crearMetodo(datos) {
    let connection
    try {
        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }

        connection = await db.getConnection()

        const [[existe]] = await connection.execute(
            `SELECT id FROM metodos_pago WHERE nombre = ?`,
            [datos.nombre.trim()]
        )
        if (existe) { connection.release(); return { success: false, mensaje: 'Ya existe un método con ese nombre' } }

        const [res] = await connection.execute(
            `INSERT INTO metodos_pago (nombre) VALUES (?)`,
            [datos.nombre.trim()]
        )
        connection.release()
        return { success: true, id: res.insertId, mensaje: 'Método creado' }
    } catch (error) {
        console.error('crearMetodo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function editarMetodo(id, datos) {
    let connection
    try {
        if (!datos.nombre?.trim()) return { success: false, mensaje: 'El nombre es requerido' }

        connection = await db.getConnection()

        const [[existe]] = await connection.execute(
            `SELECT id FROM metodos_pago WHERE nombre = ? AND id != ?`,
            [datos.nombre.trim(), id]
        )
        if (existe) { connection.release(); return { success: false, mensaje: 'Ya existe un método con ese nombre' } }

        await connection.execute(
            `UPDATE metodos_pago SET nombre = ? WHERE id = ?`,
            [datos.nombre.trim(), id]
        )
        connection.release()
        return { success: true, mensaje: 'Método actualizado' }
    } catch (error) {
        console.error('editarMetodo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function eliminarMetodo(id) {
    let connection
    try {
        connection = await db.getConnection()

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total FROM fin_pagos WHERE metodo_pago_id = ?`,
            [id]
        )
        if (parseInt(total) > 0) {
            connection.release()
            return { success: false, mensaje: `No se puede eliminar: tiene ${total} pago(s) asociado(s)` }
        }

        await connection.execute(`DELETE FROM metodos_pago WHERE id = ?`, [id])
        connection.release()
        return { success: true, mensaje: 'Método eliminado' }
    } catch (error) {
        console.error('eliminarMetodo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}
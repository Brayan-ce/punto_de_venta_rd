"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { dbCrearBitacora, dbObtenerTrabajadoresAsignados } from "@/lib/services/constructionService"

export async function obtenerTrabajadoresAsignados(obraId) {
    let connection
    try {
        connection = await db.getConnection()
        const trabajadores = await dbObtenerTrabajadoresAsignados(connection, obraId)
        connection.release()
        return { success: true, trabajadores }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar trabajadores asignados' }
    }
}

export async function registrarBitacora(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            const bitacoraId = await dbCrearBitacora(connection, datos)
            await connection.commit()
            connection.release()
            return { success: true, mensaje: 'Bitácora registrada exitosamente', bitacoraId }
        } catch (innerError) {
            await connection.rollback()
            throw innerError
        }
    } catch (error) {
        console.error('Error al registrar bitácora:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al registrar la bitácora' }
    }
}

"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { dbObtenerTrabajadores, dbCrearTrabajador } from "@/lib/services/constructionService"

export async function obtenerTodosTrabajadores(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()
        const trabajadores = await dbObtenerTrabajadores(connection, empresaId, filtros)
        connection.release()

        return { success: true, trabajadores }
    } catch (error) {
        console.error('Error al obtener trabajadores:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar trabajadores' }
    }
}

export async function guardarTrabajador(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()
        const id = await dbCrearTrabajador(connection, { ...datos, empresa_id: empresaId })
        connection.release()

        return { success: true, mensaje: 'Trabajador registrado exitosamente', id }
    } catch (error) {
        console.error('Error al guardar trabajador:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al registrar trabajador' }
    }
}

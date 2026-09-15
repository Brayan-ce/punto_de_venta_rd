"use server"

import db from "@/_DB/db"
import { obtenerUsuarioActual, validarPermisoObras } from '../lib'

/**
 * Obtener datos para selectores de formularios
 */
export async function obtenerDatosFormulario() {
    let connection
    try {
        const usuario = await obtenerUsuarioActual()
        validarPermisoObras(usuario)

        connection = await db.getConnection()

        // Proyectos activos
        let proyectos = []
        try {
            const [proyectosRaw] = await connection.execute(
                `SELECT id, codigo, nombre
                 FROM proyectos
                 WHERE empresa_id = ?
                 AND estado IN ('planificacion', 'activo')
                 ORDER BY nombre`,
                [usuario.empresaId]
            )
            proyectos = proyectosRaw
        } catch (err) {
            // Tabla puede no existir aún
            console.warn('No se pudieron cargar proyectos:', err)
        }

        // Clientes activos
        let clientes = []
        try {
            const [clientesRaw] = await connection.execute(
                `SELECT id, nombre, telefono, email
                 FROM clientes
                 WHERE empresa_id = ?
                 AND activo = 1
                 ORDER BY nombre`,
                [usuario.empresaId]
            )
            clientes = clientesRaw
        } catch (err) {
            // Tabla puede no existir aún
            console.warn('No se pudieron cargar clientes:', err)
        }

        // Usuarios responsables (opcional)
        let responsables = []
        try {
            const [responsablesRaw] = await connection.execute(
                `SELECT id, nombre, email
                 FROM usuarios
                 WHERE empresa_id = ?
                 AND activo = 1
                 ORDER BY nombre`,
                [usuario.empresaId]
            )
            responsables = responsablesRaw
        } catch (err) {
            // Tabla puede no existir aún
            console.warn('No se pudieron cargar responsables:', err)
        }

        connection.release()

        return {
            success: true,
            proyectos,
            clientes,
            responsables
        }
    } catch (error) {
        console.error('Error al obtener datos formulario:', error)
        if (connection) connection.release()
        return {
            success: false,
            mensaje: error.message || 'Error al obtener datos del formulario'
        }
    }
}


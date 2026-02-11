"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener configuración del catálogo de la empresa
 */
export async function obtenerConfigCatalogo() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [configs] = await connection.execute(
            `SELECT * FROM catalogo_config WHERE empresa_id = ?`,
            [empresaId]
        )

        connection.release()

        if (configs.length === 0) {
            // Crear configuración por defecto si no existe
            return {
                success: true,
                config: null
            }
        }

        return {
            success: true,
            config: configs[0]
        }

    } catch (error) {
        console.error('Error al obtener config catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar configuración del catálogo'
        }
    }
}

/**
 * Guardar o actualizar configuración del catálogo
 */
export async function guardarConfigCatalogo(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        // Verificar si ya existe configuración
        const [existentes] = await connection.execute(
            `SELECT id FROM catalogo_config WHERE empresa_id = ?`,
            [empresaId]
        )

        if (existentes.length > 0) {
            // Actualizar
            await connection.execute(
                `UPDATE catalogo_config SET
                    nombre_catalogo = ?,
                    descripcion = ?,
                    logo_url = ?,
                    color_primario = ?,
                    color_secundario = ?,
                    activo = ?,
                    url_slug = ?,
                    whatsapp = ?,
                    direccion = ?,
                    horario = ?
                WHERE empresa_id = ?`,
                [
                    datos.nombre_catalogo || null,
                    datos.descripcion || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    datos.url_slug || null,
                    datos.whatsapp || null,
                    datos.direccion || null,
                    datos.horario || null,
                    empresaId
                ]
            )
        } else {
            // Crear
            await connection.execute(
                `INSERT INTO catalogo_config (
                    empresa_id, nombre_catalogo, descripcion, logo_url,
                    color_primario, color_secundario, activo, url_slug,
                    whatsapp, direccion, horario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    datos.nombre_catalogo || null,
                    datos.descripcion || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    datos.url_slug || null,
                    datos.whatsapp || null,
                    datos.direccion || null,
                    datos.horario || null
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Configuración guardada correctamente'
        }

    } catch (error) {
        console.error('Error al guardar config catálogo:', error)
        
        if (connection) {
            connection.release()
        }

        // Verificar si es error de slug duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return {
                success: false,
                mensaje: 'El URL del catálogo ya está en uso. Por favor, elige otro.'
            }
        }

        return {
            success: false,
            mensaje: 'Error al guardar configuración del catálogo'
        }
    }
}

/**
 * Generar URL slug automático basado en el nombre de la empresa
 */
export async function generarSlugAuto() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Sesión inválida'
            }
        }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT nombre_comercial, nombre_empresa FROM empresas WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        if (empresas.length === 0) {
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const nombre = empresas[0].nombre_comercial || empresas[0].nombre_empresa || 'catalogo'
        
        // Convertir a slug: minúsculas, sin espacios, sin caracteres especiales
        const slug = nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guión
            .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final

        return {
            success: true,
            slug: slug
        }

    } catch (error) {
        console.error('Error al generar slug:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al generar URL'
        }
    }
}


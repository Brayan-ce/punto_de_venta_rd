"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

/**
 * Obtener configuración del catálogo del superadministrador
 */
export async function obtenerConfigCatalogoSuperAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [configs] = await connection.execute(
            `SELECT * FROM catalogo_superadmin_config LIMIT 1`
        )

        // Obtener WhatsApp del superadmin desde plataforma_config
        const [plataforma] = await connection.execute(
            `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
        )

        connection.release()

        if (configs.length === 0) {
            // Crear configuración por defecto
            return {
                success: true,
                config: {
                    nombre_catalogo: '',
                    descripcion: '',
                    url_slug: '',
                    color_primario: '#FF6B35',
                    color_secundario: '#004E89',
                    activo: false,
                    whatsapp: plataforma.length > 0 ? plataforma[0].telefono_whatsapp : '',
                    direccion: '',
                    horario: '',
                    logo_url: null
                }
            }
        }

        const config = configs[0]
        
        // Si no tiene WhatsApp configurado, usar el de plataforma_config
        if (!config.whatsapp && plataforma.length > 0) {
            config.whatsapp = plataforma[0].telefono_whatsapp
        }

        return {
            success: true,
            config: config
        }

    } catch (error) {
        console.error('Error al obtener config catálogo superadmin:', error)
        
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
 * Guardar o actualizar configuración del catálogo del superadministrador
 */
export async function guardarConfigCatalogoSuperAdmin(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        // Verificar si ya existe configuración
        const [existentes] = await connection.execute(
            `SELECT id FROM catalogo_superadmin_config LIMIT 1`
        )

        if (existentes.length > 0) {
            // Actualizar
            await connection.execute(
                `UPDATE catalogo_superadmin_config SET
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
                WHERE id = ?`,
                [
                    datos.nombre_catalogo || null,
                    datos.descripcion || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    datos.url_slug || 'tienda',
                    datos.whatsapp || null,
                    datos.direccion || null,
                    datos.horario || null,
                    existentes[0].id
                ]
            )
        } else {
            // Crear
            await connection.execute(
                `INSERT INTO catalogo_superadmin_config (
                    nombre_catalogo, descripcion, logo_url,
                    color_primario, color_secundario, activo, url_slug,
                    whatsapp, direccion, horario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.nombre_catalogo || null,
                    datos.descripcion || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    datos.url_slug || 'tienda',
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
        console.error('Error al guardar config catálogo superadmin:', error)
        
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
 * Generar URL slug automático
 */
export async function generarSlugAutoSuperAdmin() {
    try {
        const nombre = 'Tienda Online'
        
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
        return {
            success: false,
            mensaje: 'Error al generar URL'
        }
    }
}

/**
 * Obtener productos del catálogo del superadministrador
 */
export async function obtenerProductosCatalogoSuperAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [productos] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.descripcion_corta,
                p.precio,
                p.precio_oferta,
                p.fecha_inicio_oferta,
                p.fecha_fin_oferta,
                p.imagen_url,
                p.stock,
                p.stock_minimo,
                p.stock_visible,
                p.activo,
                p.sku,
                p.destacado,
                p.orden_visual,
                c.nombre as categoria_nombre,
                c.id as categoria_id
            FROM superadmin_productos_catalogo p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.destacado DESC, p.orden_visual ASC, p.nombre ASC`
        )

        connection.release()

        return {
            success: true,
            productos: productos
        }

    } catch (error) {
        console.error('Error al obtener productos catálogo superadmin:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar productos del catálogo'
        }
    }
}


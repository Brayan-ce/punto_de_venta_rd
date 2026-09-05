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
 * Generar slug a partir de un nombre
 */
function generarSlugDesdeNombre(nombre) {
    if (!nombre) return 'catalogo'
    return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guión
        .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
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

        // Validar y auto-generar slug si está vacío
        let urlSlug = datos.url_slug?.trim()
        if (!urlSlug) {
            // Intentar generar desde nombre del catálogo
            if (datos.nombre_catalogo?.trim()) {
                urlSlug = generarSlugDesdeNombre(datos.nombre_catalogo)
            } else {
                // Obtener nombre de la empresa
                connection = await db.getConnection()
                const [empresas] = await connection.execute(
                    `SELECT nombre_comercial, nombre_empresa FROM empresas WHERE id = ?`,
                    [empresaId]
                )
                if (empresas.length > 0) {
                    const nombre = empresas[0].nombre_comercial || empresas[0].nombre_empresa || 'catalogo'
                    urlSlug = generarSlugDesdeNombre(nombre)
                } else {
                    urlSlug = 'catalogo'
                }
                connection.release()
            }
        }

        // Validar formato del slug
        if (!/^[a-z0-9-]+$/.test(urlSlug)) {
            return {
                success: false,
                mensaje: 'El URL solo puede contener letras minúsculas, números y guiones'
            }
        }

        connection = await db.getConnection()

        // Verificar si ya existe configuración
        const [existentes] = await connection.execute(
            `SELECT id, url_slug FROM catalogo_config WHERE empresa_id = ?`,
            [empresaId]
        )

        // Verificar duplicados de slug solo si cambió
        if (existentes.length > 0) {
            const configExistente = existentes[0]
            if (configExistente.url_slug !== urlSlug) {
                const [duplicados] = await connection.execute(
                    `SELECT id FROM catalogo_config WHERE url_slug = ? AND empresa_id != ?`,
                    [urlSlug, empresaId]
                )
                if (duplicados.length > 0) {
                    connection.release()
                    return {
                        success: false,
                        mensaje: 'El URL del catálogo ya está en uso. Por favor, elige otro.'
                    }
                }
            }

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
                    datos.nombre_catalogo?.trim() || null,
                    datos.descripcion?.trim() || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    urlSlug,
                    datos.whatsapp?.trim() || null,
                    datos.direccion?.trim() || null,
                    datos.horario?.trim() || null,
                    empresaId
                ]
            )
        } else {
            // Verificar duplicados para nuevo catálogo
            const [duplicados] = await connection.execute(
                `SELECT id FROM catalogo_config WHERE url_slug = ?`,
                [urlSlug]
            )
            if (duplicados.length > 0) {
                connection.release()
                return {
                    success: false,
                    mensaje: 'El URL del catálogo ya está en uso. Por favor, elige otro.'
                }
            }

            // Crear
            await connection.execute(
                `INSERT INTO catalogo_config (
                    empresa_id, nombre_catalogo, descripcion, logo_url,
                    color_primario, color_secundario, activo, url_slug,
                    whatsapp, direccion, horario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    datos.nombre_catalogo?.trim() || null,
                    datos.descripcion?.trim() || null,
                    datos.logo_url || null,
                    datos.color_primario || '#FF6B35',
                    datos.color_secundario || '#004E89',
                    datos.activo !== undefined ? datos.activo : true,
                    urlSlug,
                    datos.whatsapp?.trim() || null,
                    datos.direccion?.trim() || null,
                    datos.horario?.trim() || null
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

export async function obtenerDatosEmpresa() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const connection = await db.getConnection()
        const [rows] = await connection.query(
            'SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa FROM empresas WHERE id = ? LIMIT 1',
            [empresaId]
        )
        connection.release()

        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
            }
        }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        return { success: false, mensaje: 'Error al obtener datos de la empresa' }
    }
}

/**
 * ============================================
 * FUNCIONES DEL SERVIDOR PARA GESTIÓN DE MÓDULOS
 * ============================================
 * 
 * Funciones server-side para gestionar módulos habilitados por empresa
 */

"use server"

import db from "@/_DB/db"
import { MODULOS } from "./catalogo"

/**
 * Obtener módulos habilitados para una empresa
 * @param {number} empresaId - ID de la empresa
 * @returns {Promise<Array>} - Array de módulos habilitados con información completa
 */
export async function obtenerModulosEmpresa(empresaId) {
    let connection
    try {
        if (!empresaId) {
            throw new Error('empresaId es requerido')
        }

        connection = await db.getConnection()

        const [modulos] = await connection.execute(
            `SELECT 
                m.id,
                m.codigo,
                m.nombre,
                m.descripcion,
                m.categoria,
                m.icono,
                m.ruta_base,
                m.orden,
                m.siempre_habilitado,
                COALESCE(em.habilitado, m.siempre_habilitado) as habilitado,
                em.fecha_habilitacion
            FROM modulos m
            LEFT JOIN empresa_modulos em ON m.id = em.modulo_id AND em.empresa_id = ?
            WHERE m.activo = TRUE
            ORDER BY m.orden ASC, m.categoria ASC, m.nombre ASC`,
            [empresaId]
        )

        connection.release()

        return modulos.map(modulo => ({
            ...modulo,
            habilitado: Boolean(modulo.habilitado),
            siempre_habilitado: Boolean(modulo.siempre_habilitado)
        }))

    } catch (error) {
        console.error('Error al obtener módulos de empresa:', error)
        
        if (connection) {
            connection.release()
        }

        throw error
    }
}

/**
 * Verificar si un módulo está habilitado para una empresa
 * @param {number} empresaId - ID de la empresa
 * @param {string} codigoModulo - Código del módulo (ej: 'pos', 'financiamiento')
 * @returns {Promise<boolean>} - true si está habilitado, false en caso contrario
 */
export async function verificarModuloHabilitado(empresaId, codigoModulo) {
    let connection
    try {
        if (!empresaId || !codigoModulo) {
            return false
        }

        connection = await db.getConnection()

        const [resultado] = await connection.execute(
            `SELECT 
                m.siempre_habilitado,
                COALESCE(em.habilitado, m.siempre_habilitado) as habilitado
            FROM modulos m
            LEFT JOIN empresa_modulos em ON m.id = em.modulo_id AND em.empresa_id = ?
            WHERE m.codigo = ? AND m.activo = TRUE
            LIMIT 1`,
            [empresaId, codigoModulo]
        )

        connection.release()

        if (resultado.length === 0) {
            return false
        }

        // Si siempre está habilitado, retornar true
        if (resultado[0].siempre_habilitado) {
            return true
        }

        // Retornar el estado de habilitación
        return Boolean(resultado[0].habilitado)

    } catch (error) {
        console.error('Error al verificar módulo habilitado:', error)
        
        if (connection) {
            connection.release()
        }

        // En caso de error, retornar false por seguridad
        return false
    }
}

/**
 * Habilitar/deshabilitar módulo para una empresa
 * @param {number} empresaId - ID de la empresa
 * @param {number} moduloId - ID del módulo
 * @param {boolean} habilitado - true para habilitar, false para deshabilitar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function toggleModuloEmpresa(empresaId, moduloId, habilitado) {
    let connection
    try {
        if (!empresaId || !moduloId) {
            throw new Error('empresaId y moduloId son requeridos')
        }

        connection = await db.getConnection()

        // Verificar si el módulo es siempre habilitado
        const [modulo] = await connection.execute(
            `SELECT siempre_habilitado FROM modulos WHERE id = ? AND activo = TRUE`,
            [moduloId]
        )

        if (modulo.length === 0) {
            connection.release()
            throw new Error('Módulo no encontrado')
        }

        if (modulo[0].siempre_habilitado) {
            connection.release()
            return {
                success: false,
                mensaje: 'Este módulo siempre está habilitado y no puede ser deshabilitado'
            }
        }

        // Insertar o actualizar la relación empresa-módulo
        await connection.execute(
            `INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                habilitado = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP`,
            [empresaId, moduloId, habilitado, habilitado]
        )

        connection.release()

        return {
            success: true,
            mensaje: habilitado ? 'Módulo habilitado exitosamente' : 'Módulo deshabilitado exitosamente'
        }

    } catch (error) {
        console.error('Error al toggle módulo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: error.message || 'Error al actualizar módulo'
        }
    }
}

/**
 * Obtener todos los módulos disponibles en el sistema
 * @returns {Promise<Array>} - Array de todos los módulos
 */
export async function obtenerTodosModulos() {
    let connection
    try {
        connection = await db.getConnection()

        const [modulos] = await connection.execute(
            `SELECT * FROM modulos 
             WHERE activo = TRUE 
             ORDER BY orden ASC, categoria ASC, nombre ASC`
        )

        connection.release()

        return modulos.map(modulo => ({
            ...modulo,
            siempre_habilitado: Boolean(modulo.siempre_habilitado),
            activo: Boolean(modulo.activo)
        }))

    } catch (error) {
        console.error('Error al obtener todos los módulos:', error)
        
        if (connection) {
            connection.release()
        }

        throw error
    }
}

/**
 * Obtener módulo por código
 * @param {string} codigo - Código del módulo
 * @returns {Promise<Object|null>} - Objeto del módulo o null
 */
export async function obtenerModuloPorCodigo(codigo) {
    let connection
    try {
        if (!codigo) {
            return null
        }

        connection = await db.getConnection()

        const [modulos] = await connection.execute(
            `SELECT * FROM modulos WHERE codigo = ? AND activo = TRUE LIMIT 1`,
            [codigo]
        )

        connection.release()

        if (modulos.length === 0) {
            return null
        }

        return {
            ...modulos[0],
            siempre_habilitado: Boolean(modulos[0].siempre_habilitado),
            activo: Boolean(modulos[0].activo)
        }

    } catch (error) {
        console.error('Error al obtener módulo por código:', error)
        
        if (connection) {
            connection.release()
        }

        return null
    }
}

/**
 * Habilitar múltiples módulos para una empresa (útil para migraciones)
 * @param {number} empresaId - ID de la empresa
 * @param {Array<string>} codigosModulos - Array de códigos de módulos a habilitar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function habilitarModulosPorCodigo(empresaId, codigosModulos) {
    let connection
    try {
        if (!empresaId || !codigosModulos || !Array.isArray(codigosModulos)) {
            throw new Error('Parámetros inválidos')
        }

        connection = await db.getConnection()

        // Obtener IDs de módulos por sus códigos
        const placeholders = codigosModulos.map(() => '?').join(',')
        const [modulos] = await connection.execute(
            `SELECT id, codigo, siempre_habilitado FROM modulos 
             WHERE codigo IN (${placeholders}) AND activo = TRUE`,
            codigosModulos
        )

        if (modulos.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se encontraron módulos con los códigos proporcionados'
            }
        }

        // Habilitar cada módulo (excepto los siempre habilitados)
        const resultados = []
        for (const modulo of modulos) {
            if (!modulo.siempre_habilitado) {
                await connection.execute(
                    `INSERT INTO empresa_modulos (empresa_id, modulo_id, habilitado)
                     VALUES (?, ?, TRUE)
                     ON DUPLICATE KEY UPDATE 
                        habilitado = TRUE,
                        fecha_actualizacion = CURRENT_TIMESTAMP`,
                    [empresaId, modulo.id]
                )
                resultados.push(modulo.codigo)
            }
        }

        connection.release()

        return {
            success: true,
            mensaje: `Módulos habilitados: ${resultados.join(', ')}`,
            modulosHabilitados: resultados
        }

    } catch (error) {
        console.error('Error al habilitar módulos por código:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: error.message || 'Error al habilitar módulos'
        }
    }
}

/**
 * Verificar si una ruta está permitida para una empresa
 * @param {number} empresaId - ID de la empresa
 * @param {string} ruta - Ruta a verificar (ej: '/admin/ventas/nueva')
 * @returns {Promise<boolean>} - true si la ruta está permitida
 */
export async function verificarRutaPermitida(empresaId, ruta) {
    try {
        // Importar dinámicamente para evitar problemas de circular dependency
        const { obtenerModuloPorRuta } = await import('./catalogo')
        
        const modulo = obtenerModuloPorRuta(ruta)
        
        // Si no pertenece a ningún módulo específico, permitir (puede ser ruta pública o core)
        if (!modulo) {
            return true
        }

        // Si el módulo siempre está habilitado, permitir
        if (modulo.siempreHabilitado) {
            return true
        }

        // Verificar si el módulo está habilitado para la empresa
        return await verificarModuloHabilitado(empresaId, modulo.codigo)

    } catch (error) {
        console.error('Error al verificar ruta permitida:', error)
        // En caso de error, denegar acceso por seguridad
        return false
    }
}


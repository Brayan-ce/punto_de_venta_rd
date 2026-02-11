"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerMarcas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [marcas] = await connection.execute(
            `SELECT 
                m.id,
                m.nombre,
                m.pais_origen,
                m.descripcion,
                m.activo,
                m.fecha_creacion,
                COUNT(p.id) as total_productos
            FROM marcas m
            LEFT JOIN productos p ON m.id = p.marca_id AND p.empresa_id = m.empresa_id
            WHERE m.empresa_id = ?
            GROUP BY m.id
            ORDER BY m.nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            marcas: marcas
        }

    } catch (error) {
        console.error('Error al obtener marcas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar marcas'
        }
    }
}

export async function obtenerMarca(marcaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [marcas] = await connection.execute(
            `SELECT 
                id,
                nombre,
                pais_origen,
                descripcion,
                activo,
                fecha_creacion
            FROM marcas
            WHERE id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        if (marcas.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Marca no encontrada'
            }
        }

        const [totalProductos] = await connection.execute(
            `SELECT COUNT(*) as total
            FROM productos
            WHERE marca_id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        const [productos] = await connection.execute(
            `SELECT 
                id,
                nombre,
                codigo_barras,
                stock,
                activo
            FROM productos
            WHERE marca_id = ? AND empresa_id = ?
            ORDER BY nombre ASC
            LIMIT 10`,
            [marcaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            marca: {
                ...marcas[0],
                total_productos: totalProductos[0].total,
                productos: productos
            }
        }

    } catch (error) {
        console.error('Error al obtener marca:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar marca'
        }
    }
}

export async function crearMarca(datosMarca) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear marcas'
            }
        }

        connection = await db.getConnection()

        const [existeNombre] = await connection.execute(
            `SELECT id FROM marcas WHERE nombre = ? AND empresa_id = ?`,
            [datosMarca.nombre.trim(), empresaId]
        )

        if (existeNombre.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una marca con ese nombre'
            }
        }

        const [resultado] = await connection.execute(
            `INSERT INTO marcas (
                empresa_id,
                nombre,
                pais_origen,
                descripcion,
                activo
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                empresaId,
                datosMarca.nombre.trim(),
                datosMarca.pais_origen?.trim() || null,
                datosMarca.descripcion?.trim() || null,
                datosMarca.activo !== undefined ? datosMarca.activo : true
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Marca creada exitosamente',
            marcaId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear marca:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la marca'
        }
    }
}

export async function actualizarMarca(marcaId, datosMarca) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar marcas'
            }
        }

        connection = await db.getConnection()

        const [marcaExiste] = await connection.execute(
            `SELECT id FROM marcas WHERE id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        if (marcaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Marca no encontrada'
            }
        }

        const [existeNombre] = await connection.execute(
            `SELECT id FROM marcas WHERE nombre = ? AND empresa_id = ? AND id != ?`,
            [datosMarca.nombre.trim(), empresaId, marcaId]
        )

        if (existeNombre.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otra marca con ese nombre'
            }
        }

        await connection.execute(
            `UPDATE marcas SET
                nombre = ?,
                pais_origen = ?,
                descripcion = ?,
                activo = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosMarca.nombre.trim(),
                datosMarca.pais_origen?.trim() || null,
                datosMarca.descripcion?.trim() || null,
                datosMarca.activo !== undefined ? datosMarca.activo : true,
                marcaId,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Marca actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar marca:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la marca'
        }
    }
}

export async function eliminarMarca(marcaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar marcas'
            }
        }

        connection = await db.getConnection()

        const [marcaExiste] = await connection.execute(
            `SELECT id FROM marcas WHERE id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        if (marcaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Marca no encontrada'
            }
        }

        const [tieneProductos] = await connection.execute(
            `SELECT COUNT(*) as total FROM productos WHERE marca_id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        if (tieneProductos[0].total > 0) {
            await connection.execute(
                `UPDATE marcas SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
                [marcaId, empresaId]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Marca desactivada (tiene productos asociados)'
            }
        }

        await connection.execute(
            `DELETE FROM marcas WHERE id = ? AND empresa_id = ?`,
            [marcaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Marca eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar marca:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la marca'
        }
    }
}
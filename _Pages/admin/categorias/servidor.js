"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerCategorias() {
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

        const [categorias] = await connection.execute(
            `SELECT 
                c.id,
                c.nombre,
                c.descripcion,
                c.activo,
                c.fecha_creacion,
                COUNT(p.id) as total_productos
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.empresa_id = c.empresa_id
            WHERE c.empresa_id = ?
            GROUP BY c.id
            ORDER BY c.nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            categorias: categorias
        }

    } catch (error) {
        console.error('Error al obtener categorias:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar categorias'
        }
    }
}

export async function obtenerCategoria(categoriaId) {
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

        const [categorias] = await connection.execute(
            `SELECT 
                id,
                nombre,
                descripcion,
                activo,
                fecha_creacion
            FROM categorias
            WHERE id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        if (categorias.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Categoria no encontrada'
            }
        }

        const [totalProductos] = await connection.execute(
            `SELECT COUNT(*) as total
            FROM productos
            WHERE categoria_id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        const [productos] = await connection.execute(
            `SELECT 
                id,
                nombre,
                codigo_barras,
                stock,
                activo
            FROM productos
            WHERE categoria_id = ? AND empresa_id = ?
            ORDER BY nombre ASC
            LIMIT 10`,
            [categoriaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            categoria: {
                ...categorias[0],
                total_productos: totalProductos[0].total,
                productos: productos
            }
        }

    } catch (error) {
        console.error('Error al obtener categoria:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar categoria'
        }
    }
}

export async function crearCategoria(datosCategoria) {
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
                mensaje: 'No tienes permisos para crear categorias'
            }
        }

        connection = await db.getConnection()

        const [existeNombre] = await connection.execute(
            `SELECT id FROM categorias WHERE nombre = ? AND empresa_id = ?`,
            [datosCategoria.nombre.trim(), empresaId]
        )

        if (existeNombre.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una categoria con ese nombre'
            }
        }

        const [resultado] = await connection.execute(
            `INSERT INTO categorias (
                empresa_id,
                nombre,
                descripcion,
                activo
            ) VALUES (?, ?, ?, ?)`,
            [
                empresaId,
                datosCategoria.nombre.trim(),
                datosCategoria.descripcion?.trim() || null,
                datosCategoria.activo !== undefined ? datosCategoria.activo : true
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Categoria creada exitosamente',
            categoriaId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear categoria:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la categoria'
        }
    }
}

export async function actualizarCategoria(categoriaId, datosCategoria) {
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
                mensaje: 'No tienes permisos para actualizar categorias'
            }
        }

        connection = await db.getConnection()

        const [categoriaExiste] = await connection.execute(
            `SELECT id FROM categorias WHERE id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        if (categoriaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Categoria no encontrada'
            }
        }

        const [existeNombre] = await connection.execute(
            `SELECT id FROM categorias WHERE nombre = ? AND empresa_id = ? AND id != ?`,
            [datosCategoria.nombre.trim(), empresaId, categoriaId]
        )

        if (existeNombre.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otra categoria con ese nombre'
            }
        }

        await connection.execute(
            `UPDATE categorias SET
                nombre = ?,
                descripcion = ?,
                activo = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosCategoria.nombre.trim(),
                datosCategoria.descripcion?.trim() || null,
                datosCategoria.activo !== undefined ? datosCategoria.activo : true,
                categoriaId,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Categoria actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar categoria:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la categoria'
        }
    }
}

export async function eliminarCategoria(categoriaId) {
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
                mensaje: 'No tienes permisos para eliminar categorias'
            }
        }

        connection = await db.getConnection()

        const [categoriaExiste] = await connection.execute(
            `SELECT id FROM categorias WHERE id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        if (categoriaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Categoria no encontrada'
            }
        }

        const [tieneProductos] = await connection.execute(
            `SELECT COUNT(*) as total FROM productos WHERE categoria_id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        if (tieneProductos[0].total > 0) {
            await connection.execute(
                `UPDATE categorias SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
                [categoriaId, empresaId]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Categoria desactivada (tiene productos asociados)'
            }
        }

        await connection.execute(
            `DELETE FROM categorias WHERE id = ? AND empresa_id = ?`,
            [categoriaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Categoria eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar categoria:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la categoria'
        }
    }
}
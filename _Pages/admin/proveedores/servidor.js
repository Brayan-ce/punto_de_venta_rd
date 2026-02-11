"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerProveedores() {
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

        const [proveedores] = await connection.execute(
            `SELECT 
                id,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                contacto,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                sitio_web,
                condiciones_pago,
                activo,
                fecha_creacion
            FROM proveedores
            WHERE empresa_id = ?
            ORDER BY nombre_comercial ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            proveedores: proveedores
        }

    } catch (error) {
        console.error('Error al obtener proveedores:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar proveedores'
        }
    }
}

export async function obtenerProveedor(proveedorId) {
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

        const [proveedores] = await connection.execute(
            `SELECT 
                id,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                contacto,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                sitio_web,
                condiciones_pago,
                activo,
                fecha_creacion
            FROM proveedores
            WHERE id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        if (proveedores.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Proveedor no encontrado'
            }
        }

        const [compras] = await connection.execute(
            `SELECT 
                COUNT(*) as total_compras,
                SUM(CASE WHEN estado = 'recibida' THEN total ELSE 0 END) as monto_total
            FROM compras
            WHERE proveedor_id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        const [ultimasCompras] = await connection.execute(
            `SELECT 
                id,
                ncf,
                total,
                estado,
                fecha_compra
            FROM compras
            WHERE proveedor_id = ? AND empresa_id = ?
            ORDER BY fecha_compra DESC
            LIMIT 5`,
            [proveedorId, empresaId]
        )

        connection.release()

        return {
            success: true,
            proveedor: {
                ...proveedores[0],
                total_compras: compras[0].total_compras || 0,
                monto_total: compras[0].monto_total || 0,
                ultimas_compras: ultimasCompras
            }
        }

    } catch (error) {
        console.error('Error al obtener proveedor:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar proveedor'
        }
    }
}

export async function crearProveedor(datosProveedor) {
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
                mensaje: 'No tienes permisos para crear proveedores'
            }
        }

        connection = await db.getConnection()

        const [existeRNC] = await connection.execute(
            `SELECT id FROM proveedores WHERE rnc = ? AND empresa_id = ?`,
            [datosProveedor.rnc, empresaId]
        )

        if (existeRNC.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un proveedor con ese RNC'
            }
        }

        const [resultado] = await connection.execute(
            `INSERT INTO proveedores (
                empresa_id,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                contacto,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                sitio_web,
                condiciones_pago,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datosProveedor.rnc,
                datosProveedor.razon_social,
                datosProveedor.nombre_comercial,
                datosProveedor.actividad_economica,
                datosProveedor.contacto || null,
                datosProveedor.telefono || null,
                datosProveedor.email || null,
                datosProveedor.direccion || null,
                datosProveedor.sector || null,
                datosProveedor.municipio || null,
                datosProveedor.provincia || null,
                datosProveedor.sitio_web || null,
                datosProveedor.condiciones_pago || null,
                datosProveedor.activo !== undefined ? datosProveedor.activo : true
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Proveedor creado exitosamente',
            proveedorId: resultado.insertId
        }

    } catch (error) {
        console.error('Error al crear proveedor:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el proveedor'
        }
    }
}

export async function actualizarProveedor(proveedorId, datosProveedor) {
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
                mensaje: 'No tienes permisos para actualizar proveedores'
            }
        }

        connection = await db.getConnection()

        const [proveedorExiste] = await connection.execute(
            `SELECT id FROM proveedores WHERE id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        if (proveedorExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Proveedor no encontrado'
            }
        }

        const [existeRNC] = await connection.execute(
            `SELECT id FROM proveedores WHERE rnc = ? AND empresa_id = ? AND id != ?`,
            [datosProveedor.rnc, empresaId, proveedorId]
        )

        if (existeRNC.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro proveedor con ese RNC'
            }
        }

        await connection.execute(
            `UPDATE proveedores SET
                rnc = ?,
                razon_social = ?,
                nombre_comercial = ?,
                actividad_economica = ?,
                contacto = ?,
                telefono = ?,
                email = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                sitio_web = ?,
                condiciones_pago = ?,
                activo = ?
            WHERE id = ? AND empresa_id = ?`,
            [
                datosProveedor.rnc,
                datosProveedor.razon_social,
                datosProveedor.nombre_comercial,
                datosProveedor.actividad_economica,
                datosProveedor.contacto || null,
                datosProveedor.telefono || null,
                datosProveedor.email || null,
                datosProveedor.direccion || null,
                datosProveedor.sector || null,
                datosProveedor.municipio || null,
                datosProveedor.provincia || null,
                datosProveedor.sitio_web || null,
                datosProveedor.condiciones_pago || null,
                datosProveedor.activo !== undefined ? datosProveedor.activo : true,
                proveedorId,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Proveedor actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar proveedor:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el proveedor'
        }
    }
}

export async function eliminarProveedor(proveedorId) {
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
                mensaje: 'No tienes permisos para eliminar proveedores'
            }
        }

        connection = await db.getConnection()

        const [proveedorExiste] = await connection.execute(
            `SELECT id FROM proveedores WHERE id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        if (proveedorExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Proveedor no encontrado'
            }
        }

        const [tieneCompras] = await connection.execute(
            `SELECT COUNT(*) as total FROM compras WHERE proveedor_id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        if (tieneCompras[0].total > 0) {
            await connection.execute(
                `UPDATE proveedores SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
                [proveedorId, empresaId]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Proveedor desactivado (tiene compras asociadas)'
            }
        }

        await connection.execute(
            `DELETE FROM proveedores WHERE id = ? AND empresa_id = ?`,
            [proveedorId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Proveedor eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar proveedor:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el proveedor'
        }
    }
}
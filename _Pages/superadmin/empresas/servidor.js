"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerEmpresas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT 
                id,
                nombre_empresa,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                telefono,
                email,
                direccion,
                sector,
                municipio,
                provincia,
                moneda,
                simbolo_moneda,
                impuesto_nombre,
                impuesto_porcentaje,
                activo,
                fecha_creacion
            FROM empresas
            ORDER BY fecha_creacion DESC`
        )

        connection.release()

        return {
            success: true,
            empresas: empresas
        }

    } catch (error) {
        console.error('Error al obtener empresas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar empresas'
        }
    }
}

export async function toggleEstadoEmpresa(empresaId, nuevoEstado) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE empresas SET activo = ? WHERE id = ?`,
            [nuevoEstado, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Empresa ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`
        }

    } catch (error) {
        console.error('Error al cambiar estado de empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar estado'
        }
    }
}

export async function crearEmpresa(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [rncExistente] = await connection.execute(
            `SELECT id FROM empresas WHERE rnc = ?`,
            [datos.rnc]
        )

        if (rncExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una empresa con este RNC'
            }
        }

        await connection.execute(
            `INSERT INTO empresas (
                nombre_empresa,
                rnc,
                razon_social,
                nombre_comercial,
                actividad_economica,
                direccion,
                sector,
                municipio,
                provincia,
                telefono,
                email,
                moneda,
                simbolo_moneda,
                impuesto_nombre,
                impuesto_porcentaje,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                datos.nombre_empresa,
                datos.rnc,
                datos.razon_social,
                datos.nombre_comercial,
                datos.actividad_economica,
                datos.direccion,
                datos.sector,
                datos.municipio,
                datos.provincia,
                datos.telefono || null,
                datos.email || null,
                datos.moneda,
                datos.simbolo_moneda,
                datos.impuesto_nombre,
                datos.impuesto_porcentaje
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Empresa creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la empresa'
        }
    }
}

export async function actualizarEmpresa(empresaId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresaExistente] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const [rncDuplicado] = await connection.execute(
            `SELECT id FROM empresas WHERE rnc = ? AND id != ?`,
            [datos.rnc, empresaId]
        )

        if (rncDuplicado.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otra empresa con este RNC'
            }
        }

        await connection.execute(
            `UPDATE empresas SET
                nombre_empresa = ?,
                rnc = ?,
                razon_social = ?,
                nombre_comercial = ?,
                actividad_economica = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                telefono = ?,
                email = ?,
                moneda = ?,
                simbolo_moneda = ?,
                impuesto_nombre = ?,
                impuesto_porcentaje = ?
            WHERE id = ?`,
            [
                datos.nombre_empresa,
                datos.rnc,
                datos.razon_social,
                datos.nombre_comercial,
                datos.actividad_economica,
                datos.direccion,
                datos.sector,
                datos.municipio,
                datos.provincia,
                datos.telefono || null,
                datos.email || null,
                datos.moneda,
                datos.simbolo_moneda,
                datos.impuesto_nombre,
                datos.impuesto_porcentaje,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Empresa actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la empresa'
        }
    }
}

export async function obtenerConteoRegistrosEmpresa(empresaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [conteo] = await connection.execute(
            `SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE empresa_id = ?) AS usuarios,
                (SELECT COUNT(*) FROM productos WHERE empresa_id = ?) AS productos,
                (SELECT COUNT(*) FROM clientes WHERE empresa_id = ?) AS clientes,
                (SELECT COUNT(*) FROM proveedores WHERE empresa_id = ?) AS proveedores,
                (SELECT COUNT(*) FROM ventas WHERE empresa_id = ?) AS ventas,
                (SELECT COUNT(*) FROM compras WHERE empresa_id = ?) AS compras,
                (SELECT COUNT(*) FROM cajas WHERE empresa_id = ?) AS cajas,
                (SELECT COUNT(*) FROM gastos WHERE empresa_id = ?) AS gastos,
                (SELECT COUNT(*) FROM categorias WHERE empresa_id = ?) AS categorias,
                (SELECT COUNT(*) FROM marcas WHERE empresa_id = ?) AS marcas,
                (SELECT COUNT(*) FROM movimientos_inventario WHERE empresa_id = ?) AS movimientos`,
            [empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId, empresaId]
        )

        connection.release()

        return {
            success: true,
            conteo: {
                usuarios: conteo[0].usuarios,
                productos: conteo[0].productos,
                clientes: conteo[0].clientes,
                proveedores: conteo[0].proveedores,
                ventas: conteo[0].ventas,
                compras: conteo[0].compras,
                cajas: conteo[0].cajas,
                gastos: conteo[0].gastos,
                categorias: conteo[0].categorias,
                marcas: conteo[0].marcas,
                movimientos: conteo[0].movimientos
            }
        }

    } catch (error) {
        console.error('Error al obtener conteo de registros:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al obtener conteo de registros'
        }
    }
}

export async function eliminarEmpresa(empresaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'superadmin') {
            return {
                success: false,
                mensaje: 'Acceso no autorizado'
            }
        }

        connection = await db.getConnection()

        const [empresaExistente] = await connection.execute(
            `SELECT id, nombre_empresa FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        // Obtener todos los usuarios de la empresa
        const [usuariosEmpresa] = await connection.execute(
            `SELECT id FROM usuarios WHERE empresa_id = ?`,
            [empresaId]
        )

        // Iniciar transacción para eliminación atómica
        await connection.beginTransaction()

        try {
            // Deshabilitar temporalmente las verificaciones de foreign keys
            await connection.execute(`SET FOREIGN_KEY_CHECKS = 0`)

            // Para cada usuario de la empresa, eliminar todos sus registros
            for (const usuario of usuariosEmpresa) {
                const usuarioId = usuario.id

                // 1. Eliminar detalle_despachos
                await connection.execute(
                    `DELETE dd FROM detalle_despachos dd
                    INNER JOIN despachos d ON dd.despacho_id = d.id
                    WHERE d.usuario_id = ?`,
                    [usuarioId]
                )

                // 2. Eliminar despachos
                await connection.execute(
                    `DELETE FROM despachos WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 3. Eliminar detalle_ventas
                await connection.execute(
                    `DELETE dv FROM detalle_ventas dv
                    INNER JOIN ventas v ON dv.venta_id = v.id
                    WHERE v.usuario_id = ?`,
                    [usuarioId]
                )

                // 4. Eliminar detalle_compras
                await connection.execute(
                    `DELETE dc FROM detalle_compras dc
                    INNER JOIN compras c ON dc.compra_id = c.id
                    WHERE c.usuario_id = ?`,
                    [usuarioId]
                )

                // 5. Eliminar movimientos_inventario
                await connection.execute(
                    `DELETE FROM movimientos_inventario WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 6. Eliminar compras
                await connection.execute(
                    `DELETE FROM compras WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 7. Eliminar gastos
                await connection.execute(
                    `DELETE FROM gastos WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 8. Eliminar ventas
                await connection.execute(
                    `DELETE FROM ventas WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 9. Eliminar cajas
                await connection.execute(
                    `DELETE FROM cajas WHERE usuario_id = ?`,
                    [usuarioId]
                )

                // 10. Eliminar usuario
                await connection.execute(
                    `DELETE FROM usuarios WHERE id = ?`,
                    [usuarioId]
                )
            }

            // Eliminar registros de la empresa que no tienen ON DELETE CASCADE o que necesitan eliminación explícita
            // (La mayoría se eliminarán automáticamente por CASCADE, pero por seguridad eliminamos explícitamente)

            // 11. Eliminar detalle_despachos relacionados con ventas de la empresa
            await connection.execute(
                `DELETE dd FROM detalle_despachos dd
                INNER JOIN despachos d ON dd.despacho_id = d.id
                INNER JOIN ventas v ON d.venta_id = v.id
                WHERE v.empresa_id = ?`,
                [empresaId]
            )

            // 12. Eliminar despachos relacionados con ventas de la empresa
            await connection.execute(
                `DELETE d FROM despachos d
                INNER JOIN ventas v ON d.venta_id = v.id
                WHERE v.empresa_id = ?`,
                [empresaId]
            )

            // 13. Eliminar detalle_ventas
            await connection.execute(
                `DELETE dv FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE v.empresa_id = ?`,
                [empresaId]
            )

            // 14. Eliminar detalle_compras
            await connection.execute(
                `DELETE dc FROM detalle_compras dc
                INNER JOIN compras c ON dc.compra_id = c.id
                WHERE c.empresa_id = ?`,
                [empresaId]
            )

            // 15. Eliminar movimientos_inventario
            await connection.execute(
                `DELETE FROM movimientos_inventario WHERE empresa_id = ?`,
                [empresaId]
            )

            // 16. Eliminar compras
            await connection.execute(
                `DELETE FROM compras WHERE empresa_id = ?`,
                [empresaId]
            )

            // 17. Eliminar gastos
            await connection.execute(
                `DELETE FROM gastos WHERE empresa_id = ?`,
                [empresaId]
            )

            // 18. Eliminar ventas
            await connection.execute(
                `DELETE FROM ventas WHERE empresa_id = ?`,
                [empresaId]
            )

            // 19. Eliminar cajas
            await connection.execute(
                `DELETE FROM cajas WHERE empresa_id = ?`,
                [empresaId]
            )

            // 20. Eliminar productos (y sus imágenes físicas si es necesario)
            await connection.execute(
                `DELETE FROM productos WHERE empresa_id = ?`,
                [empresaId]
            )

            // 21. Eliminar clientes
            await connection.execute(
                `DELETE FROM clientes WHERE empresa_id = ?`,
                [empresaId]
            )

            // 22. Eliminar proveedores
            await connection.execute(
                `DELETE FROM proveedores WHERE empresa_id = ?`,
                [empresaId]
            )

            // 23. Eliminar categorias
            await connection.execute(
                `DELETE FROM categorias WHERE empresa_id = ?`,
                [empresaId]
            )

            // 24. Eliminar marcas
            await connection.execute(
                `DELETE FROM marcas WHERE empresa_id = ?`,
                [empresaId]
            )

            // 25. Eliminar usuarios restantes (por si acaso)
            await connection.execute(
                `DELETE FROM usuarios WHERE empresa_id = ?`,
                [empresaId]
            )

            // 26. Eliminar empresa (principal)
            await connection.execute(
                `DELETE FROM empresas WHERE id = ?`,
                [empresaId]
            )

            // Rehabilitar las verificaciones de foreign keys
            await connection.execute(`SET FOREIGN_KEY_CHECKS = 1`)

            // Confirmar transacción
            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Empresa y TODOS sus registros fueron eliminados permanentemente'
            }

        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al eliminar empresa:', error)
        console.error('Error detallado:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        })
        
        if (connection) {
            connection.release()
        }

        // Mensaje más descriptivo basado en el tipo de error
        let mensajeError = 'Error al eliminar la empresa y sus registros'
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            mensajeError = 'No se puede eliminar la empresa porque tiene registros asociados que no se pueden eliminar. Verifique las restricciones de la base de datos.'
        } else if (error.sqlMessage) {
            mensajeError = `Error de base de datos: ${error.sqlMessage}`
        } else if (error.message) {
            mensajeError = `Error: ${error.message}`
        }

        return {
            success: false,
            mensaje: mensajeError
        }
    }
}
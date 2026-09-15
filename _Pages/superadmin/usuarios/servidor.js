"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

const TIPOS_USUARIO_PERMITIDOS = ['admin', 'vendedor', 'sucursales']

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
                e.id,
                e.nombre_empresa,
                e.activo,
                IF(emc.empresa_id IS NOT NULL, 1, 0) AS es_obras,
                IF(ems.empresa_id IS NOT NULL, 1, 0) AS es_sucursales
            FROM empresas e
            LEFT JOIN empresa_modulos emc
                ON emc.empresa_id = e.id
                AND emc.habilitado = 1
                AND emc.modulo_id = (SELECT id FROM modulos WHERE codigo = 'constructora' LIMIT 1)
            LEFT JOIN empresa_modulos ems
                ON ems.empresa_id = e.id
                AND ems.habilitado = 1
                AND ems.modulo_id = (SELECT id FROM modulos WHERE codigo = 'sucursales' LIMIT 1)
            ORDER BY e.nombre_empresa ASC`
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

export async function obtenerUsuarios(empresaId) {
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

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.empresa_id,
                u.nombre,
                u.cedula,
                u.email,
                u.avatar_url,
                u.tipo,
                u.activo,
                u.system_mode,
                u.permite_impresion,
                u.fecha_creacion,
                e.nombre_empresa
            FROM usuarios u
            INNER JOIN empresas e ON u.empresa_id = e.id
            WHERE u.empresa_id = ? AND u.tipo != 'superadmin'
            ORDER BY u.fecha_creacion DESC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            usuarios: usuarios
        }

    } catch (error) {
        console.error('Error al obtener usuarios:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar usuarios'
        }
    }
}

export async function crearUsuario(datos) {
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

        const [cedulaExistente] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ?`,
            [datos.cedula]
        )

        if (cedulaExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con esta cedula'
            }
        }

        const [emailExistente] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ?`,
            [datos.email]
        )

        if (emailExistente.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con este email'
            }
        }

        const [empresaExiste] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ? AND activo = TRUE`,
            [datos.empresa_id]
        )

        if (empresaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'La empresa seleccionada no existe o no esta activa'
            }
        }

        if (!TIPOS_USUARIO_PERMITIDOS.includes(datos.tipo)) {
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de usuario invalido'
            }
        }

        if (datos.tipo === 'sucursales') {
            const [empresaConModulo] = await connection.execute(
                `SELECT em.id
                 FROM empresa_modulos em
                 INNER JOIN modulos m ON m.id = em.modulo_id
                 WHERE em.empresa_id = ?
                   AND em.habilitado = TRUE
                   AND m.codigo = 'sucursales'
                 LIMIT 1`,
                [datos.empresa_id]
            )

            if (empresaConModulo.length === 0) {
                connection.release()
                return {
                    success: false,
                    mensaje: 'La empresa no tiene habilitado el modulo Sucursales'
                }
            }
        }

        const passwordHash = await bcrypt.hash(datos.password, 10)
        const systemMode = datos.system_mode === 'OBRAS' ? 'OBRAS' : 'POS'

        await connection.execute(
            `INSERT INTO usuarios (
                empresa_id,
                nombre,
                cedula,
                email,
                password,
                tipo,
                system_mode,
                permite_impresion,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
                datos.empresa_id,
                datos.nombre,
                datos.cedula,
                datos.email,
                passwordHash,
                datos.tipo,
                systemMode,
                datos.permite_impresion !== false ? 1 : 0
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario creado exitosamente'
        }

    } catch (error) {
        console.error('Error al crear usuario:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear el usuario'
        }
    }
}

export async function actualizarUsuario(usuarioId, datos) {
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

        const [usuarioExistente] = await connection.execute(
            `SELECT id, tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuarioExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuarioExistente[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes editar usuarios super administradores'
            }
        }

        const [cedulaDuplicada] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ? AND id != ?`,
            [datos.cedula, usuarioId]
        )

        if (cedulaDuplicada.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con esta cedula'
            }
        }

        const [emailDuplicado] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ? AND id != ?`,
            [datos.email, usuarioId]
        )

        if (emailDuplicado.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con este email'
            }
        }

        if (!TIPOS_USUARIO_PERMITIDOS.includes(datos.tipo)) {
            connection.release()
            return {
                success: false,
                mensaje: 'Tipo de usuario invalido'
            }
        }

        if (datos.tipo === 'sucursales') {
            const [empresaConModulo] = await connection.execute(
                `SELECT em.id
                 FROM empresa_modulos em
                 INNER JOIN modulos m ON m.id = em.modulo_id
                 WHERE em.empresa_id = ?
                   AND em.habilitado = TRUE
                   AND m.codigo = 'sucursales'
                 LIMIT 1`,
                [datos.empresa_id]
            )

            if (empresaConModulo.length === 0) {
                connection.release()
                return {
                    success: false,
                    mensaje: 'La empresa no tiene habilitado el modulo Sucursales'
                }
            }
        }

        const systemMode = datos.system_mode === 'OBRAS' ? 'OBRAS' : 'POS'

        if (datos.password && datos.password.trim() !== '') {
            const passwordHash = await bcrypt.hash(datos.password, 10)

            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    password = ?,
                    tipo = ?,
                    system_mode = ?,
                    permite_impresion = ?
                WHERE id = ?`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    passwordHash,
                    datos.tipo,
                    systemMode,
                    datos.permite_impresion !== false ? 1 : 0,
                    usuarioId
                ]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    cedula = ?,
                    email = ?,
                    tipo = ?,
                    system_mode = ?,
                    permite_impresion = ?
                WHERE id = ?`,
                [
                    datos.nombre,
                    datos.cedula,
                    datos.email,
                    datos.tipo,
                    systemMode,
                    datos.permite_impresion !== false ? 1 : 0,
                    usuarioId
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario actualizado exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar usuario:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar el usuario'
        }
    }
}

export async function toggleEstadoUsuario(usuarioId, nuevoEstado) {
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

        const [usuario] = await connection.execute(
            `SELECT tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuario.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuario[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes desactivar usuarios super administradores'
            }
        }

        await connection.execute(
            `UPDATE usuarios SET activo = ? WHERE id = ?`,
            [nuevoEstado, usuarioId]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`
        }

    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar estado'
        }
    }
}

export async function obtenerConteoRegistrosUsuario(usuarioId) {
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
                (SELECT COUNT(*) FROM ventas WHERE usuario_id = ?) AS ventas,
                (SELECT COUNT(*) FROM cajas WHERE usuario_id = ?) AS cajas,
                (SELECT COUNT(*) FROM gastos WHERE usuario_id = ?) AS gastos,
                (SELECT COUNT(*) FROM compras WHERE usuario_id = ?) AS compras,
                (SELECT COUNT(*) FROM movimientos_inventario WHERE usuario_id = ?) AS movimientos,
                (SELECT COUNT(*) FROM despachos WHERE usuario_id = ?) AS despachos`,
            [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId]
        )

        connection.release()

        return {
            success: true,
            conteo: {
                ventas: conteo[0].ventas,
                cajas: conteo[0].cajas,
                gastos: conteo[0].gastos,
                compras: conteo[0].compras,
                movimientos: conteo[0].movimientos,
                despachos: conteo[0].despachos
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

export async function eliminarUsuario(usuarioId) {
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

        const [usuarioExistente] = await connection.execute(
            `SELECT tipo FROM usuarios WHERE id = ?`,
            [usuarioId]
        )

        if (usuarioExistente.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        if (usuarioExistente[0].tipo === 'superadmin') {
            connection.release()
            return {
                success: false,
                mensaje: 'No puedes eliminar usuarios super administradores'
            }
        }

        await connection.beginTransaction()

        try {
            await connection.execute(`SET FOREIGN_KEY_CHECKS = 0`)

            await connection.execute(
                `DELETE dd FROM detalle_despachos dd
                INNER JOIN despachos d ON dd.despacho_id = d.id
                WHERE d.usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM despachos WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE dv FROM detalle_ventas dv
                INNER JOIN ventas v ON dv.venta_id = v.id
                WHERE v.usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE dc FROM detalle_compras dc
                INNER JOIN compras c ON dc.compra_id = c.id
                WHERE c.usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM movimientos_inventario WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM compras WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM gastos WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM ventas WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM cajas WHERE usuario_id = ?`,
                [usuarioId]
            )

            await connection.execute(
                `DELETE FROM usuarios WHERE id = ?`,
                [usuarioId]
            )

            await connection.execute(`SET FOREIGN_KEY_CHECKS = 1`)

            await connection.commit()
            connection.release()

            return {
                success: true,
                mensaje: 'Usuario y TODOS sus registros fueron eliminados permanentemente'
            }

        } catch (error) {
            await connection.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        console.error('Error detallado:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        })

        if (connection) {
            connection.release()
        }

        let mensajeError = 'Error al eliminar el usuario y sus registros'

        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            mensajeError = 'No se puede eliminar el usuario porque tiene registros asociados que no se pueden eliminar. Verifique las restricciones de la base de datos.'
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

export async function actualizarModoSistema(usuarioId, nuevoModo) {
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
            `UPDATE usuarios SET system_mode = ? WHERE id = ?`,
            [nuevoModo, usuarioId]
        )

        connection.release()

        return {
            success: true,
            mensaje: `Modo de sistema actualizado a ${nuevoModo}`
        }

    } catch (error) {
        console.error('Error al actualizar modo de sistema:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cambiar modo de sistema'
        }
    }
}
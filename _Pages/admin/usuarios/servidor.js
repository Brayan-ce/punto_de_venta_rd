"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'

export async function obtenerUsuarios() {
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
                mensaje: 'No tienes permisos para ver usuarios'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.cedula,
                u.email,
                u.tipo,
                u.activo,
                u.fecha_creacion,
                u.rol_id,
                r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.empresa_id = ?
            ORDER BY u.nombre ASC`,
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

export async function obtenerUsuario(usuarioId) {
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
                mensaje: 'No tienes permisos para ver usuarios'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT 
                u.id,
                u.nombre,
                u.cedula,
                u.email,
                u.tipo,
                u.activo,
                u.fecha_creacion,
                u.rol_id,
                r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.id = ? AND u.empresa_id = ?`,
            [usuarioId, empresaId]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        connection.release()

        return {
            success: true,
            usuario: usuarios[0]
        }

    } catch (error) {
        console.error('Error al obtener usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar usuario'
        }
    }
}

export async function obtenerRoles() {
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

        const [roles] = await connection.execute(
            `SELECT id, nombre, descripcion
            FROM roles
            WHERE activo = TRUE
            ORDER BY nombre ASC`
        )

        connection.release()

        return {
            success: true,
            roles: roles
        }

    } catch (error) {
        console.error('Error al obtener roles:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar roles',
            roles: []
        }
    }
}

export async function crearUsuario(datosUsuario) {
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
                mensaje: 'No tienes permisos para crear usuarios'
            }
        }

        connection = await db.getConnection()

        const [existeCedula] = await connection.execute(
            `SELECT id FROM usuarios WHERE cedula = ?`,
            [datosUsuario.cedula.trim()]
        )

        if (existeCedula.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con esa cedula'
            }
        }

        const [existeEmail] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ?`,
            [datosUsuario.email.trim()]
        )

        if (existeEmail.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe un usuario con ese email'
            }
        }

        const passwordHash = await bcrypt.hash(datosUsuario.password, 10)

        const [resultado] = await connection.execute(
            `INSERT INTO usuarios (
                empresa_id,
                rol_id,
                nombre,
                cedula,
                email,
                password,
                tipo,
                activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                datosUsuario.rol_id || null,
                datosUsuario.nombre.trim(),
                datosUsuario.cedula.trim(),
                datosUsuario.email.trim(),
                passwordHash,
                datosUsuario.tipo,
                datosUsuario.activo !== undefined ? datosUsuario.activo : true
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario creado exitosamente',
            usuarioId: resultado.insertId
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

export async function actualizarUsuario(usuarioId, datosUsuario) {
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
                mensaje: 'No tienes permisos para actualizar usuarios'
            }
        }

        connection = await db.getConnection()

        const [usuarioExiste] = await connection.execute(
            `SELECT id FROM usuarios WHERE id = ? AND empresa_id = ?`,
            [usuarioId, empresaId]
        )

        if (usuarioExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [existeEmail] = await connection.execute(
            `SELECT id FROM usuarios WHERE email = ? AND id != ?`,
            [datosUsuario.email.trim(), usuarioId]
        )

        if (existeEmail.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe otro usuario con ese email'
            }
        }

        if (datosUsuario.password && datosUsuario.password.trim() !== '') {
            const passwordHash = await bcrypt.hash(datosUsuario.password, 10)
            
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    email = ?,
                    password = ?,
                    tipo = ?,
                    rol_id = ?,
                    activo = ?
                WHERE id = ? AND empresa_id = ?`,
                [
                    datosUsuario.nombre.trim(),
                    datosUsuario.email.trim(),
                    passwordHash,
                    datosUsuario.tipo,
                    datosUsuario.rol_id || null,
                    datosUsuario.activo !== undefined ? datosUsuario.activo : true,
                    usuarioId,
                    empresaId
                ]
            )
        } else {
            await connection.execute(
                `UPDATE usuarios SET
                    nombre = ?,
                    email = ?,
                    tipo = ?,
                    rol_id = ?,
                    activo = ?
                WHERE id = ? AND empresa_id = ?`,
                [
                    datosUsuario.nombre.trim(),
                    datosUsuario.email.trim(),
                    datosUsuario.tipo,
                    datosUsuario.rol_id || null,
                    datosUsuario.activo !== undefined ? datosUsuario.activo : true,
                    usuarioId,
                    empresaId
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

export async function eliminarUsuario(usuarioId) {
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
                mensaje: 'No tienes permisos para eliminar usuarios'
            }
        }

        if (parseInt(userId) === parseInt(usuarioId)) {
            return {
                success: false,
                mensaje: 'No puedes eliminar tu propio usuario'
            }
        }

        connection = await db.getConnection()

        const [usuarioExiste] = await connection.execute(
            `SELECT id FROM usuarios WHERE id = ? AND empresa_id = ?`,
            [usuarioId, empresaId]
        )

        if (usuarioExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [tieneVentas] = await connection.execute(
            `SELECT COUNT(*) as total FROM ventas WHERE usuario_id = ?`,
            [usuarioId]
        )

        const [tieneGastos] = await connection.execute(
            `SELECT COUNT(*) as total FROM gastos WHERE usuario_id = ?`,
            [usuarioId]
        )

        if (tieneVentas[0].total > 0 || tieneGastos[0].total > 0) {
            await connection.execute(
                `UPDATE usuarios SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
                [usuarioId, empresaId]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Usuario desactivado (tiene registros asociados)'
            }
        }

        await connection.execute(
            `DELETE FROM usuarios WHERE id = ? AND empresa_id = ?`,
            [usuarioId, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Usuario eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar usuario:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar el usuario'
        }
    }
}
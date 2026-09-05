"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'

export async function crearSuperAdminInicial() {
  let connection
  try {
    connection = await db.getConnection()

    const [superAdminRows] = await connection.execute(
      `SELECT COUNT(*) as total 
      FROM usuarios 
      WHERE tipo = 'superadmin' AND activo = true`
    )

    const superAdminExistente = superAdminRows[0]

    if (superAdminExistente.total > 0) {
      connection.release()
      return {
        success: true,
        creado: false,
        mensaje: 'Ya existe un Super Administrador en el sistema'
      }
    }

    const [usuarioRows] = await connection.execute(
      `SELECT id, tipo FROM usuarios WHERE email = ?`,
      ['admin@gmail.com']
    )

    let usuarioId

    if (usuarioRows.length > 0) {
      usuarioId = usuarioRows[0].id

      const contrasenaHash = await bcrypt.hash('123456', 12)

      await connection.execute(
        `UPDATE usuarios 
        SET 
          empresa_id = NULL,
          rol_id = NULL,
          nombre = 'Super Administrador',
          cedula = '000-0000000-0',
          password = ?,
          tipo = 'superadmin',
          activo = true,
          fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [contrasenaHash, usuarioId]
      )
    } else {
      const contrasenaHash = await bcrypt.hash('123456', 12)

      const [resultadoUsuario] = await connection.execute(
        `INSERT INTO usuarios (
          empresa_id,
          rol_id,
          nombre,
          cedula,
          email,
          password,
          tipo,
          activo,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          null,
          null,
          'Super Administrador',
          '000-0000000-0',
          'admin@gmail.com',
          contrasenaHash,
          'superadmin',
          true
        ]
      )

      usuarioId = resultadoUsuario.insertId
    }

    connection.release()

    return {
      success: true,
      creado: true,
      mensaje: 'Super Administrador creado exitosamente',
      datos: {
        cedula: '000-0000000-0',
        email: 'admin@gmail.com',
        tipo: 'superadmin',
        password: '123456'
      }
    }

  } catch (error) {
    console.log('Error al crear super administrador inicial:', error)
    
    if (connection) {
      connection.release()
    }

    return {
      success: false,
      creado: false,
      mensaje: 'Error al crear super administrador inicial: ' + error.message
    }
  }
}

export async function verificarEstadoSuperAdmin() {
  try {
    const connection = await db.getConnection()

    const [rows] = await connection.execute(
      `SELECT 
        id,
        empresa_id,
        rol_id,
        nombre,
        cedula,
        email,
        tipo,
        activo,
        fecha_creacion,
        fecha_actualizacion
      FROM usuarios 
      WHERE email = 'admin@gmail.com' AND tipo = 'superadmin'`
    )

    connection.release()

    return {
      success: true,
      existe: rows.length > 0,
      datos: rows.length > 0 ? rows[0] : null
    }

  } catch (error) {
    console.log('Error al verificar super administrador:', error)
    return {
      success: false,
      existe: false,
      error: error.message
    }
  }
}
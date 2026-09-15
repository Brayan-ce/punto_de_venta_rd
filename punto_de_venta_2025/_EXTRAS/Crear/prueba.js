"use server"

import db from "@/_DB/db"
import bcrypt from 'bcrypt'

export async function crearSuperAdminInicial() {
  let connection
  try {
    connection = await db.getConnection()

    const contrasenaHash = await bcrypt.hash('123456', 12)
    
    const superAdmins = [
      {
        nombre: 'Super Administrador',
        cedula: '000-0000000-0',
        email: 'admin@gmail.com'
      },
      {
        nombre: 'Brayan Super Admin',
        cedula: '000-0000000-1',
        email: 'brayan@gmail.com'
      }
    ]

    let creados = 0

    for (const admin of superAdmins) {
      const [usuarioRows] = await connection.execute(
        `SELECT id, tipo FROM usuarios WHERE email = ?`,
        [admin.email]
      )

      if (usuarioRows.length > 0) {
        await connection.execute(
          `UPDATE usuarios 
          SET 
            empresa_id = NULL,
            rol_id = NULL,
            nombre = ?,
            cedula = ?,
            password = ?,
            tipo = 'superadmin',
            activo = true,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE email = ?`,
          [admin.nombre, admin.cedula, contrasenaHash, admin.email]
        )
      } else {
        await connection.execute(
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
            admin.nombre,
            admin.cedula,
            admin.email,
            contrasenaHash,
            'superadmin',
            true
          ]
        )
        creados++
      }
    }

    connection.release()

    return {
      success: true,
      creado: true,
      mensaje: `Super Administradores procesados exitosamente (${creados} nuevos)`,
      datos: superAdmins.map(admin => ({
        ...admin,
        password: '123456'
      }))
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
      WHERE tipo = 'superadmin' AND activo = true`
    )

    connection.release()

    return {
      success: true,
      existe: rows.length > 0,
      datos: rows
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
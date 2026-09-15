"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { validarBitacora, prepararDatosBitacora } from '../core/construction/bitacora'

/**
 * Obtiene lista de bitácoras con filtros avanzados
 * Soporta filtrado polimórfico (obras y servicios)
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Object>} { success: boolean, bitacoras: Array, mensaje?: string }
 */
export async function obtenerBitacoras(filtros = {}) {
  let connection
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const empresaId = cookieStore.get('empresaId')?.value

    if (!userId || !empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    // Query polimórfica con joins condicionales
    let query = `
      SELECT b.*,
             CASE 
               WHEN b.tipo_destino = 'obra' THEN o.nombre
               WHEN b.tipo_destino = 'servicio' THEN s.nombre
             END AS destino_nombre,
             CASE 
               WHEN b.tipo_destino = 'obra' THEN o.codigo_obra
               WHEN b.tipo_destino = 'servicio' THEN s.codigo_servicio
             END AS destino_codigo,
             u.nombre AS usuario_nombre,
             COUNT(DISTINCT bt.trabajador_id) AS num_trabajadores,
             COUNT(DISTINCT bf.id) AS num_fotos
      FROM bitacora_diaria b
      LEFT JOIN obras o ON b.tipo_destino = 'obra' AND b.destino_id = o.id
      LEFT JOIN servicios s ON b.tipo_destino = 'servicio' AND b.destino_id = s.id
      LEFT JOIN usuarios u ON b.usuario_id = u.id
      LEFT JOIN bitacora_trabajadores bt ON b.id = bt.bitacora_id
      LEFT JOIN bitacora_fotos bf ON b.id = bf.bitacora_id
      WHERE b.empresa_id = ?
    `
    
    const params = [empresaId]
    
    // Aplicar filtros
    if (filtros.tipo_destino) {
      query += ' AND b.tipo_destino = ?'
      params.push(filtros.tipo_destino)
    }
    
    if (filtros.destino_id) {
      query += ' AND b.destino_id = ?'
      params.push(filtros.destino_id)
    }
    
    if (filtros.fecha_desde) {
      query += ' AND b.fecha_bitacora >= ?'
      params.push(filtros.fecha_desde)
    }
    
    if (filtros.fecha_hasta) {
      query += ' AND b.fecha_bitacora <= ?'
      params.push(filtros.fecha_hasta)
    }
    
    if (filtros.usuario_id) {
      query += ' AND b.usuario_id = ?'
      params.push(filtros.usuario_id)
    }
    
    if (filtros.busqueda) {
      query += ' AND (b.trabajo_realizado LIKE ? OR b.observaciones LIKE ? OR b.zona_sitio LIKE ?)'
      const busqueda = `%${filtros.busqueda}%`
      params.push(busqueda, busqueda, busqueda)
    }
    
    query += ' GROUP BY b.id ORDER BY b.fecha_bitacora DESC, b.id DESC'
    
    const [bitacoras] = await connection.query(query, params)
    connection.release()

    return { success: true, bitacoras }
  } catch (error) {
    console.error('Error al obtener bitácoras:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar bitácoras' }
  }
}

/**
 * Crea una nueva bitácora con diseño polimórfico
 * Soporta obras y servicios
 * @param {Object} datos - Datos de la bitácora
 * @returns {Promise<Object>} { success: boolean, id?: number, mensaje: string }
 */
export async function crearBitacora(datos) {
  let connection
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    const empresaId = cookieStore.get('empresaId')?.value

    if (!userId || !empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    // Preparar y validar datos
    const datosLimpios = prepararDatosBitacora(datos)
    const validacion = validarBitacora(datosLimpios)
    
    if (!validacion.valido) {
      return { 
        success: false, 
        mensaje: Object.values(validacion.errores)[0], 
        errores: validacion.errores 
      }
    }

    connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // Verificar que no exista bitácora para esta fecha y destino (unicidad)
      const [existentes] = await connection.query(
        `SELECT id FROM bitacora_diaria 
         WHERE empresa_id = ? 
           AND tipo_destino = ? 
           AND destino_id = ? 
           AND fecha_bitacora = ?`,
        [empresaId, datosLimpios.tipo_destino, datosLimpios.destino_id, datosLimpios.fecha_bitacora]
      )
      
      if (existentes.length > 0) {
        await connection.rollback()
        connection.release()
        return { 
          success: false, 
          mensaje: `Ya existe una bitácora registrada para esta fecha en ${datosLimpios.tipo_destino === 'obra' ? 'esta obra' : 'este servicio'}` 
        }
      }
      
      // Insertar bitácora principal
      const [result] = await connection.query(
        `INSERT INTO bitacora_diaria (
          empresa_id, tipo_destino, destino_id, fecha_bitacora,
          zona_sitio, trabajo_realizado, observaciones,
          condiciones_clima, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empresaId,
          datosLimpios.tipo_destino,
          datosLimpios.destino_id,
          datosLimpios.fecha_bitacora,
          datosLimpios.zona_sitio,
          datosLimpios.trabajo_realizado,
          datosLimpios.observaciones,
          datosLimpios.condiciones_clima,
          userId
        ]
      )
      
      const bitacoraId = result.insertId
      
      // Insertar trabajadores presentes
      if (datosLimpios.trabajadores_presentes && datosLimpios.trabajadores_presentes.length > 0) {
        const valoresTrabajadores = datosLimpios.trabajadores_presentes.map(trabajadorId => 
          [bitacoraId, trabajadorId, 1] // presente = 1
        )
        
        await connection.query(
          `INSERT INTO bitacora_trabajadores (bitacora_id, trabajador_id, presente)
           VALUES ?`,
          [valoresTrabajadores]
        )
      }
      
      // Insertar fotos (si se proporcionan URLs procesadas)
      if (datosLimpios.fotos && datosLimpios.fotos.length > 0) {
        const valoresFotos = datosLimpios.fotos.map((foto, index) => [
          bitacoraId,
          foto.nombre_archivo,
          foto.url_foto,
          foto.tipo_mime || null,
          foto.tamano_bytes || null,
          foto.descripcion || null,
          index + 1 // orden
        ])
        
        await connection.query(
          `INSERT INTO bitacora_fotos 
           (bitacora_id, nombre_archivo, url_foto, tipo_mime, tamano_bytes, descripcion, orden)
           VALUES ?`,
          [valoresFotos]
        )
      }
      
      await connection.commit()
      connection.release()
      
      return { 
        success: true, 
        mensaje: 'Bitácora creada exitosamente', 
        id: bitacoraId 
      }
    } catch (innerError) {
      await connection.rollback()
      throw innerError
    }
  } catch (error) {
    console.error('Error al crear bitácora:', error)
    if (connection) {
      try {
        await connection.rollback()
      } catch (rollbackError) {
        console.error('Error en rollback:', rollbackError)
      }
      connection.release()
    }
    return { success: false, mensaje: 'Error al crear bitácora' }
  }
}

/**
 * Obtiene una bitácora por ID con toda su información relacionada
 * @param {number} id - ID de la bitácora
 * @returns {Promise<Object>} { success: boolean, bitacora?: Object, trabajadores?: Array, fotos?: Array }
 */
export async function obtenerBitacoraPorId(id) {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    // Obtener datos principales de la bitácora (polimórfico)
    const [bitacoras] = await connection.query(
      `SELECT b.*,
              CASE 
                WHEN b.tipo_destino = 'obra' THEN o.nombre
                WHEN b.tipo_destino = 'servicio' THEN s.nombre
              END AS destino_nombre,
              CASE 
                WHEN b.tipo_destino = 'obra' THEN o.codigo_obra
                WHEN b.tipo_destino = 'servicio' THEN s.codigo_servicio
              END AS destino_codigo,
              CASE 
                WHEN b.tipo_destino = 'obra' THEN o.ubicacion
                WHEN b.tipo_destino = 'servicio' THEN s.ubicacion
              END AS destino_ubicacion,
              u.nombre AS usuario_nombre
       FROM bitacora_diaria b
       LEFT JOIN obras o ON b.tipo_destino = 'obra' AND b.destino_id = o.id
       LEFT JOIN servicios s ON b.tipo_destino = 'servicio' AND b.destino_id = s.id
       LEFT JOIN usuarios u ON b.usuario_id = u.id
       WHERE b.id = ? AND b.empresa_id = ?`,
      [id, empresaId]
    )
    
    if (bitacoras.length === 0) {
      connection.release()
      return { success: false, mensaje: 'Bitácora no encontrada' }
    }
    
    const bitacora = bitacoras[0]
    
    // Obtener trabajadores presentes con sus detalles
    const [trabajadores] = await connection.query(
      `SELECT bt.*, 
              t.nombre, 
              t.apellidos, 
              t.rol_especialidad,
              t.tarifa_por_hora
       FROM bitacora_trabajadores bt
       INNER JOIN trabajadores_obra t ON bt.trabajador_id = t.id
       WHERE bt.bitacora_id = ?
       ORDER BY t.nombre, t.apellidos`,
      [id]
    )
    
    // Obtener fotos ordenadas
    const [fotos] = await connection.query(
      `SELECT * FROM bitacora_fotos
       WHERE bitacora_id = ?
       ORDER BY orden ASC`,
      [id]
    )
    
    connection.release()

    return { 
      success: true, 
      bitacora,
      trabajadores,
      fotos
    }
  } catch (error) {
    console.error('Error al obtener bitácora:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar bitácora' }
  }
}

/**
 * Obtiene trabajadores asignados a un destino (obra o servicio)
 * para un día específico
 * @param {Object} params - { tipo_destino, destino_id, fecha }
 * @returns {Promise<Object>} { success: boolean, trabajadores?: Array }
 */
export async function obtenerTrabajadoresAsignados({ tipo_destino, destino_id, fecha }) {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    // Obtener trabajadores asignados al destino en la fecha especificada
    const [trabajadores] = await connection.query(
      `SELECT DISTINCT t.id, t.nombre, t.apellidos, t.rol_especialidad, t.tarifa_por_hora
       FROM trabajadores_obra t
       INNER JOIN asignaciones_trabajadores a ON t.id = a.trabajador_id
       WHERE a.empresa_id = ?
         AND a.tipo_destino = ?
         AND a.destino_id = ?
         AND a.fecha_asignacion = ?
         AND a.estado = 'activo'
       ORDER BY t.nombre, t.apellidos`,
      [empresaId, tipo_destino, destino_id, fecha]
    )
    
    connection.release()
    
    // Si no hay trabajadores asignados ese día, devolver todos los trabajadores activos
    if (trabajadores.length === 0) {
      connection = await db.getConnection()
      
      const [todosTrabajadores] = await connection.query(
        `SELECT id, nombre, apellidos, rol_especialidad, tarifa_por_hora
         FROM trabajadores_obra
         WHERE empresa_id = ? AND estado = 'activo'
         ORDER BY nombre, apellidos`,
        [empresaId]
      )
      
      connection.release()
      return { success: true, trabajadores: todosTrabajadores }
    }
    
    return { success: true, trabajadores }
  } catch (error) {
    console.error('Error al obtener trabajadores:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar trabajadores asignados' }
  }
}

/**
 * Obtiene obras activas para el selector de bitácora
 * @returns {Promise<Object>} { success: boolean, obras?: Array }
 */
export async function obtenerObrasActivas() {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    const [obras] = await connection.query(
      `SELECT id, codigo_obra, nombre, ubicacion
       FROM obras
       WHERE empresa_id = ? AND estado = 'activa'
       ORDER BY nombre`,
      [empresaId]
    )
    
    connection.release()
    return { success: true, obras }
  } catch (error) {
    console.error('Error al obtener obras:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar obras' }
  }
}

/**
 * Obtiene servicios activos para el selector de bitácora
 * @returns {Promise<Object>} { success: boolean, servicios?: Array }
 */
export async function obtenerServiciosActivos() {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    const [servicios] = await connection.query(
      `SELECT id, codigo_servicio, nombre, ubicacion
       FROM servicios
       WHERE empresa_id = ? AND estado IN ('programado', 'en_ejecucion')
       ORDER BY nombre`,
      [empresaId]
    )
    
    connection.release()
    return { success: true, servicios }
  } catch (error) {
    console.error('Error al obtener servicios:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar servicios' }
  }
}

/**
 * Obtiene estadísticas de bitácoras por período
 * @param {Object} params - { fecha_desde, fecha_hasta }
 * @returns {Promise<Object>} { success: boolean, estadisticas?: Object }
 */
export async function obtenerEstadisticasBitacoras({ fecha_desde, fecha_hasta }) {
  let connection
  try {
    const cookieStore = await cookies()
    const empresaId = cookieStore.get('empresaId')?.value

    if (!empresaId) {
      return { success: false, mensaje: 'Sesión inválida' }
    }

    connection = await db.getConnection()
    
    const [estadisticas] = await connection.query(
      `SELECT 
         COUNT(DISTINCT b.id) as total_bitacoras,
         COUNT(DISTINCT CASE WHEN b.tipo_destino = 'obra' THEN b.destino_id END) as obras_con_bitacora,
         COUNT(DISTINCT CASE WHEN b.tipo_destino = 'servicio' THEN b.destino_id END) as servicios_con_bitacora,
         COUNT(DISTINCT bt.trabajador_id) as trabajadores_unicos,
         COUNT(DISTINCT bf.id) as total_fotos,
         COUNT(DISTINCT b.usuario_id) as usuarios_registrando
       FROM bitacora_diaria b
       LEFT JOIN bitacora_trabajadores bt ON b.id = bt.bitacora_id
       LEFT JOIN bitacora_fotos bf ON b.id = bf.bitacora_id
       WHERE b.empresa_id = ?
         AND b.fecha_bitacora BETWEEN ? AND ?`,
      [empresaId, fecha_desde, fecha_hasta]
    )
    
    connection.release()
    return { success: true, estadisticas: estadisticas[0] }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    if (connection) connection.release()
    return { success: false, mensaje: 'Error al cargar estadísticas' }
  }
}

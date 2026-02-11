/**
 * Repositorio de Datos para Obras
 * 
 * Capa de acceso a datos que encapsula todas las operaciones
 * de base de datos relacionadas con obras.
 * 
 * Responsabilidades:
 * - Queries SQL puras
 * - Mapeo de resultados
 * - Gestión de conexiones
 * - NO contiene lógica de negocio
 */

import db from "@/_DB/db"

export class ObraRepository {
  /**
   * Obtiene todas las obras plantilla de una empresa
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de obras plantilla
   */
  static async findAllPlantillas(empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [obras] = await connection.query(`
        SELECT 
          id, codigo_obra, nombre, descripcion, tipo_obra,
          ubicacion, presupuesto_aprobado,
          fecha_creacion, fecha_actualizacion
        FROM obras
        WHERE empresa_id = ? 
          AND es_plantilla = 1
        ORDER BY nombre ASC
      `, [empresaId])
      
      return obras || []
    } catch (error) {
      console.error('Error al obtener obras plantilla:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene una obra plantilla por ID
   * @param {number} id - ID de la obra plantilla
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object|null>} Obra plantilla o null
   */
  static async findPlantillaById(id, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [obras] = await connection.query(`
        SELECT *
        FROM obras
        WHERE id = ? 
          AND empresa_id = ?
          AND es_plantilla = 1
      `, [id, empresaId])
      
      return obras.length > 0 ? obras[0] : null
    } catch (error) {
      console.error('Error al obtener obra plantilla:', error)
      return null
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene una obra por ID (puede ser plantilla o no)
   * @param {number} id - ID de la obra
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object|null>} Obra o null
   */
  static async findById(id, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [obras] = await connection.query(`
        SELECT *
        FROM obras
        WHERE id = ? AND empresa_id = ?
      `, [id, empresaId])
      
      return obras.length > 0 ? obras[0] : null
    } catch (error) {
      console.error('Error al obtener obra:', error)
      return null
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene servicios asociados a una obra
   * @param {number} obraId - ID de la obra
   * @returns {Promise<Array>} Lista de servicios
   */
  static async findServiciosByObraId(obraId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [servicios] = await connection.query(`
        SELECT *
        FROM servicios
        WHERE obra_id = ?
        ORDER BY fecha_creacion ASC
      `, [obraId])
      
      return servicios || []
    } catch (error) {
      console.error('Error al obtener servicios de obra:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene presupuestos asociados a una obra
   * @param {number} obraId - ID de la obra
   * @returns {Promise<Array>} Lista de presupuestos
   */
  static async findPresupuestosByObraId(obraId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [presupuestos] = await connection.query(`
        SELECT *
        FROM presupuestos
        WHERE tipo_destino = 'obra' AND destino_id = ?
        ORDER BY version DESC
      `, [obraId])
      
      return presupuestos || []
    } catch (error) {
      console.error('Error al obtener presupuestos de obra:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene capítulos de un presupuesto
   * @param {number} presupuestoId - ID del presupuesto
   * @returns {Promise<Array>} Lista de capítulos
   */
  static async findCapitulosByPresupuestoId(presupuestoId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [capitulos] = await connection.query(`
        SELECT *
        FROM presupuesto_capitulos
        WHERE presupuesto_id = ?
        ORDER BY orden ASC, nivel ASC
      `, [presupuestoId])
      
      return capitulos || []
    } catch (error) {
      console.error('Error al obtener capítulos:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene tareas de un capítulo
   * @param {number} capituloId - ID del capítulo
   * @returns {Promise<Array>} Lista de tareas
   */
  static async findTareasByCapituloId(capituloId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [tareas] = await connection.query(`
        SELECT *
        FROM presupuesto_tareas
        WHERE capitulo_id = ?
        ORDER BY orden ASC
      `, [capituloId])
      
      return tareas || []
    } catch (error) {
      console.error('Error al obtener tareas:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Crea una nueva obra
   * @param {Object} datos - Datos de la obra
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID de la obra creada
   */
  static async create(datos, connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      // Generar código si no existe
      let codigoObra = datos.codigo_obra
      if (!codigoObra) {
        codigoObra = await this.generarCodigoObra(datos.empresa_id, 'OB', connection)
      }

      const [result] = await connection.query(`
        INSERT INTO obras (
          empresa_id, proyecto_id, codigo_obra, nombre, descripcion,
          tipo_obra, ubicacion, zona, municipio, provincia,
          presupuesto_aprobado, fecha_inicio, fecha_fin_estimada,
          estado, cliente_id, usuario_responsable_id,
          es_plantilla, obra_plantilla_id,
          creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.empresa_id,
        datos.proyecto_id || null,
        codigoObra,
        datos.nombre,
        datos.descripcion || null,
        datos.tipo_obra || 'construccion',
        datos.ubicacion || '',
        datos.zona || null,
        datos.municipio || null,
        datos.provincia || null,
        datos.presupuesto_aprobado || 0.00,
        datos.fecha_inicio || new Date().toISOString().split('T')[0],
        datos.fecha_fin_estimada || null,
        datos.estado || 'planificacion',
        datos.cliente_id || null,
        datos.usuario_responsable_id || null,
        datos.es_plantilla !== undefined ? datos.es_plantilla : 0,
        datos.obra_plantilla_id || null,
        datos.creado_por
      ])

      return result.insertId
    } catch (error) {
      console.error('Error al crear obra:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }

  /**
   * Genera un código único para una obra
   * @param {number} empresaId - ID de la empresa
   * @param {string} prefix - Prefijo del código (ej: 'OB')
   * @param {Object} connection - Conexión de base de datos
   * @returns {Promise<string>} Código generado
   */
  static async generarCodigoObra(empresaId, prefix = 'OB', connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      const [ultimas] = await connection.query(`
        SELECT codigo_obra 
        FROM obras 
        WHERE empresa_id = ? 
          AND codigo_obra LIKE ?
        ORDER BY id DESC 
        LIMIT 1
      `, [empresaId, `${prefix}-%`])

      let numero = 1
      if (ultimas.length > 0 && ultimas[0].codigo_obra) {
        const match = ultimas[0].codigo_obra.match(/\d+$/)
        if (match) {
          numero = parseInt(match[0]) + 1
        }
      }

      const año = new Date().getFullYear()
      return `${prefix}-${año}-${String(numero).padStart(3, '0')}`
    } catch (error) {
      console.error('Error al generar código de obra:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }

  /**
   * Crea un servicio
   * @param {Object} datos - Datos del servicio
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID del servicio creado
   */
  static async createServicio(datos, connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      // Generar código si no existe
      let codigoServicio = datos.codigo_servicio
      if (!codigoServicio) {
        const [ultimos] = await connection.query(`
          SELECT codigo_servicio 
          FROM servicios 
          WHERE empresa_id = ? 
            AND codigo_servicio LIKE 'SERV-%'
          ORDER BY id DESC 
          LIMIT 1
        `, [datos.empresa_id])

        let numero = 1
        if (ultimos.length > 0 && ultimos[0].codigo_servicio) {
          const match = ultimos[0].codigo_servicio.match(/\d+$/)
          if (match) {
            numero = parseInt(match[0]) + 1
          }
        }

        const año = new Date().getFullYear()
        codigoServicio = `SERV-${año}-${String(numero).padStart(3, '0')}`
      }

      const [result] = await connection.query(`
        INSERT INTO servicios (
          empresa_id, proyecto_id, obra_id, codigo_servicio, nombre,
          descripcion, tipo_servicio, ubicacion, zona,
          costo_estimado, fecha_solicitud, fecha_programada,
          estado, prioridad, cliente_id, usuario_responsable_id,
          creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.empresa_id,
        datos.proyecto_id || null,
        datos.obra_id || null,
        codigoServicio,
        datos.nombre,
        datos.descripcion || null,
        datos.tipo_servicio || 'otro',
        datos.ubicacion || '',
        datos.zona || null,
        datos.costo_estimado || 0.00,
        datos.fecha_solicitud || new Date().toISOString().split('T')[0],
        datos.fecha_programada || null,
        datos.estado || 'pendiente',
        datos.prioridad || 'media',
        datos.cliente_id || null,
        datos.usuario_responsable_id || null,
        datos.creado_por
      ])

      return result.insertId
    } catch (error) {
      console.error('Error al crear servicio:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }
}


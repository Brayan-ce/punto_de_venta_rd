/**
 * Repositorio de Datos para Proyectos
 * 
 * Capa de acceso a datos que encapsula todas las operaciones
 * de base de datos relacionadas con proyectos.
 * 
 * Responsabilidades:
 * - Queries SQL puras
 * - Mapeo de resultados
 * - Gestión de conexiones
 * - NO contiene lógica de negocio
 */

import db from "@/_DB/db"

export class ProyectoRepository {
  /**
   * Obtiene todos los proyectos de una empresa con filtros opcionales
   * @param {number} empresaId - ID de la empresa
   * @param {Object} filtros - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de proyectos
   */
  static async findAll(empresaId, filtros = {}) {
    let connection
    try {
      connection = await db.getConnection()
      
      let query = `
        SELECT p.*,
               COUNT(DISTINCT o.id) as cantidad_obras,
               COUNT(DISTINCT s.id) as cantidad_servicios,
               c.nombre AS cliente_nombre,
               u.nombre AS responsable_nombre
        FROM proyectos p
        LEFT JOIN obras o ON p.id = o.proyecto_id
        LEFT JOIN servicios s ON p.id = s.proyecto_id
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN usuarios u ON p.usuario_responsable_id = u.id
        WHERE p.empresa_id = ?
      `
      
      const params = [empresaId]
      
      // Aplicar filtros
      if (filtros.estado) {
        query += ' AND p.estado = ?'
        params.push(filtros.estado)
      }
      
      if (filtros.busqueda) {
        query += ' AND (p.nombre LIKE ? OR p.codigo_proyecto LIKE ?)'
        const busqueda = `%${filtros.busqueda}%`
        params.push(busqueda, busqueda)
      }
      
      if (filtros.cliente_id) {
        query += ' AND p.cliente_id = ?'
        params.push(filtros.cliente_id)
      }
      
      if (filtros.responsable_id) {
        query += ' AND p.usuario_responsable_id = ?'
        params.push(filtros.responsable_id)
      }
      
      if (filtros.fecha_inicio_desde) {
        query += ' AND p.fecha_inicio >= ?'
        params.push(filtros.fecha_inicio_desde)
      }
      
      if (filtros.fecha_inicio_hasta) {
        query += ' AND p.fecha_inicio <= ?'
        params.push(filtros.fecha_inicio_hasta)
      }
      
      query += ' GROUP BY p.id ORDER BY p.fecha_creacion DESC'
      
      // Paginación
      if (filtros.limit) {
        query += ' LIMIT ?'
        params.push(filtros.limit)
        
        if (filtros.offset) {
          query += ' OFFSET ?'
          params.push(filtros.offset)
        }
      }
      
      const [proyectos] = await connection.query(query, params)
      return proyectos
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Obtiene un proyecto por su ID
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa (para seguridad)
   * @returns {Promise<Object|null>} Proyecto encontrado o null
   */
  static async findById(id, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [proyectos] = await connection.query(
        `SELECT p.*,
                c.nombre AS cliente_nombre,
                c.apellidos AS cliente_apellidos,
                u.nombre AS responsable_nombre
         FROM proyectos p
         LEFT JOIN clientes c ON p.cliente_id = c.id
         LEFT JOIN usuarios u ON p.usuario_responsable_id = u.id
         WHERE p.id = ? AND p.empresa_id = ?`,
        [id, empresaId]
      )
      
      return proyectos.length > 0 ? proyectos[0] : null
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Crea un nuevo proyecto
   * @param {Object} datos - Datos del proyecto
   * @returns {Promise<Object>} Proyecto creado con ID
   */
  static async create(datos) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [result] = await connection.query(
        `INSERT INTO proyectos (
          empresa_id, codigo_proyecto, nombre, descripcion,
          fecha_inicio, fecha_fin_estimada, presupuesto_total,
          cliente_id, usuario_responsable_id, estado, prioridad,
          forma_pago, ubicacion, creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          datos.empresa_id,
          datos.codigo_proyecto,
          datos.nombre,
          datos.descripcion || null,
          datos.fecha_inicio,
          datos.fecha_fin_estimada,
          datos.presupuesto_total || 0.00,
          datos.cliente_id || null,
          datos.usuario_responsable_id || null,
          datos.estado || 'planificacion',
          datos.prioridad || 'media',
          datos.forma_pago || null,
          datos.ubicacion || null,
          datos.creado_por
        ]
      )
      
      // Obtener el proyecto creado
      const proyecto = await this.findById(result.insertId, datos.empresa_id)
      return proyecto
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Actualiza un proyecto existente
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object|null>} Proyecto actualizado o null
   */
  static async update(id, empresaId, datos) {
    let connection
    try {
      connection = await db.getConnection()
      
      // Construir query dinámicamente
      const campos = []
      const valores = []
      
      Object.keys(datos).forEach(key => {
        if (datos[key] !== undefined) {
          campos.push(`${key} = ?`)
          valores.push(datos[key])
        }
      })
      
      if (campos.length === 0) {
        return await this.findById(id, empresaId)
      }
      
      valores.push(id, empresaId)
      
      await connection.query(
        `UPDATE proyectos 
         SET ${campos.join(', ')} 
         WHERE id = ? AND empresa_id = ?`,
        valores
      )
      
      return await this.findById(id, empresaId)
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Elimina un proyecto (soft delete o hard delete)
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {boolean} hardDelete - Si es true, elimina físicamente
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async delete(id, empresaId, hardDelete = false) {
    let connection
    try {
      connection = await db.getConnection()
      
      if (hardDelete) {
        const [result] = await connection.query(
          'DELETE FROM proyectos WHERE id = ? AND empresa_id = ?',
          [id, empresaId]
        )
        return result.affectedRows > 0
      } else {
        // Soft delete: cambiar estado a cancelado
        const [result] = await connection.query(
          'UPDATE proyectos SET estado = ? WHERE id = ? AND empresa_id = ?',
          ['cancelado', id, empresaId]
        )
        return result.affectedRows > 0
      }
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Verifica si existe un proyecto con el mismo nombre en la empresa
   * @param {string} nombre - Nombre del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} true si existe
   */
  static async existsByNombre(nombre, empresaId, excludeId = null) {
    let connection
    try {
      connection = await db.getConnection()
      
      let query = 'SELECT COUNT(*) as count FROM proyectos WHERE nombre = ? AND empresa_id = ?'
      const params = [nombre, empresaId]
      
      if (excludeId) {
        query += ' AND id != ?'
        params.push(excludeId)
      }
      
      const [result] = await connection.query(query, params)
      return result[0].count > 0
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Obtiene el último código de proyecto para generar el siguiente
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<string|null>} Último código o null
   */
  static async getUltimoCodigo(empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [result] = await connection.query(
        'SELECT codigo_proyecto FROM proyectos WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
        [empresaId]
      )
      
      return result.length > 0 ? result[0].codigo_proyecto : null
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Obtiene las obras asociadas a un proyecto
   * @param {number} proyectoId - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de obras
   */
  static async getObras(proyectoId, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [obras] = await connection.query(
        `SELECT o.*,
                c.nombre AS cliente_nombre,
                u.nombre AS responsable_nombre
         FROM obras o
         LEFT JOIN clientes c ON o.cliente_id = c.id
         LEFT JOIN usuarios u ON o.usuario_responsable_id = u.id
         WHERE o.proyecto_id = ? AND o.empresa_id = ?
         ORDER BY o.fecha_creacion DESC`,
        [proyectoId, empresaId]
      )
      
      return obras
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Obtiene los servicios asociados a un proyecto
   * @param {number} proyectoId - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de servicios
   */
  static async getServicios(proyectoId, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [servicios] = await connection.query(
        `SELECT s.*,
                c.nombre AS cliente_nombre,
                u.nombre AS responsable_nombre
         FROM servicios s
         LEFT JOIN clientes c ON s.cliente_id = c.id
         LEFT JOIN usuarios u ON s.usuario_responsable_id = u.id
         WHERE s.proyecto_id = ? AND s.empresa_id = ?
         ORDER BY s.fecha_creacion DESC`,
        [proyectoId, empresaId]
      )
      
      return servicios
    } finally {
      if (connection) connection.release()
    }
  }
  
  /**
   * Obtiene estadísticas de un proyecto
   * @param {number} proyectoId - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Estadísticas del proyecto
   */
  static async getEstadisticas(proyectoId, empresaId) {
    let connection
    try {
      connection = await db.getConnection()
      
      const [stats] = await connection.query(
        `SELECT 
          COUNT(DISTINCT o.id) as total_obras,
          COUNT(DISTINCT s.id) as total_servicios,
          COALESCE(SUM(o.presupuesto_aprobado), 0) as presupuesto_obras,
          COALESCE(SUM(o.costo_ejecutado), 0) as costo_ejecutado_obras,
          COALESCE(SUM(s.costo_real), 0) as costo_servicios
         FROM proyectos p
         LEFT JOIN obras o ON p.id = o.proyecto_id
         LEFT JOIN servicios s ON p.id = s.proyecto_id
         WHERE p.id = ? AND p.empresa_id = ?`,
        [proyectoId, empresaId]
      )
      
      return stats[0] || {
        total_obras: 0,
        total_servicios: 0,
        presupuesto_obras: 0,
        costo_ejecutado_obras: 0,
        costo_servicios: 0
      }
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene estadísticas de proyectos para predicciones
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Estadísticas para predicciones
   */
  static async getEstadisticasParaPredicciones(empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      // Duración promedio de proyectos (en días)
      const [duracion] = await connection.query(`
        SELECT 
          AVG(DATEDIFF(fecha_fin_estimada, fecha_inicio)) as duracion_promedio
        FROM proyectos
        WHERE empresa_id = ?
          AND fecha_inicio IS NOT NULL
          AND fecha_fin_estimada IS NOT NULL
          AND estado IN ('finalizado', 'activo')
      `, [empresaId])

      // Presupuesto promedio
      const [presupuesto] = await connection.query(`
        SELECT 
          AVG(presupuesto_total) as presupuesto_promedio
        FROM proyectos
        WHERE empresa_id = ?
          AND presupuesto_total > 0
      `, [empresaId])

      // Etiquetas más frecuentes
      const [etiquetas] = await connection.query(`
        SELECT 
          JSON_EXTRACT(tags, '$[*]') as tag
        FROM proyectos
        WHERE empresa_id = ?
          AND tags IS NOT NULL
          AND tags != '[]'
      `, [empresaId])

      // Procesar etiquetas
      const etiquetasFrecuentes = []
      if (etiquetas && etiquetas.length > 0) {
        const tagCounts = {}
        etiquetas.forEach(row => {
          try {
            const tags = JSON.parse(row.tag || '[]')
            if (Array.isArray(tags)) {
              tags.forEach(tag => {
                if (tag && typeof tag === 'string') {
                  tagCounts[tag] = (tagCounts[tag] || 0) + 1
                }
              })
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        })
        etiquetasFrecuentes.push(...Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 20))
      }

      return {
        success: true,
        estadisticas: {
          duracionPromedioDias: Math.round(duracion[0]?.duracion_promedio || 30),
          presupuestoPromedio: parseFloat(presupuesto[0]?.presupuesto_promedio || 0),
          etiquetasFrecuentes
        }
      }
    } catch (error) {
      console.error('Error al obtener estadísticas para predicciones:', error)
      return {
        success: false,
        estadisticas: {
          duracionPromedioDias: 30,
          presupuestoPromedio: 0,
          etiquetasFrecuentes: []
        }
      }
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene usuarios responsables disponibles
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de usuarios
   */
  static async getUsuariosResponsables(empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      const [usuarios] = await connection.query(`
        SELECT id, nombre, email, tipo
        FROM usuarios
        WHERE empresa_id = ?
          AND activo = 1
        ORDER BY nombre ASC
      `, [empresaId])

      return usuarios || []
    } catch (error) {
      console.error('Error al obtener usuarios responsables:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene etiquetas existentes de proyectos
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de etiquetas únicas
   */
  static async getEtiquetasExistentes(empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      const [proyectos] = await connection.query(`
        SELECT tags
        FROM proyectos
        WHERE empresa_id = ?
          AND tags IS NOT NULL
          AND tags != '[]'
      `, [empresaId])

      const etiquetasUnicas = new Set()
      proyectos.forEach(proyecto => {
        try {
          const tags = JSON.parse(proyecto.tags || '[]')
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag && typeof tag === 'string') {
                etiquetasUnicas.add(tag)
              }
            })
          }
        } catch (e) {
          // Ignorar errores de parsing
        }
      })

      return Array.from(etiquetasUnicas).sort()
    } catch (error) {
      console.error('Error al obtener etiquetas existentes:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Crea una nueva plantilla
   * @param {Object} datos - Datos de la plantilla
   * @returns {Promise<Object>} Plantilla creada
   */
  static async createPlantilla(datos) {
    let connection
    try {
      connection = await db.getConnection()

      // Convertir estructura_json a string si es objeto
      let estructuraJson = datos.estructura_json
      if (typeof estructuraJson === 'object') {
        estructuraJson = JSON.stringify(estructuraJson)
      }

      const [result] = await connection.query(`
        INSERT INTO plantillas_proyecto (
          empresa_id, nombre, descripcion, tipo_plantilla,
          estructura_json, activa, creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.empresa_id,
        datos.nombre,
        datos.descripcion || null,
        datos.tipo_plantilla || 'otro',
        estructuraJson,
        datos.activa !== undefined ? datos.activa : 1,
        datos.creado_por
      ])

      return await this.findPlantillaById(result.insertId, datos.empresa_id)
    } catch (error) {
      console.error('Error al crear plantilla:', error)
      throw error
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Actualiza una plantilla existente
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Plantilla actualizada
   */
  static async updatePlantilla(id, empresaId, datos) {
    let connection
    try {
      connection = await db.getConnection()

      const campos = []
      const valores = []

      if (datos.nombre !== undefined) {
        campos.push('nombre = ?')
        valores.push(datos.nombre)
      }

      if (datos.descripcion !== undefined) {
        campos.push('descripcion = ?')
        valores.push(datos.descripcion)
      }

      if (datos.tipo_plantilla !== undefined) {
        campos.push('tipo_plantilla = ?')
        valores.push(datos.tipo_plantilla)
      }

      if (datos.estructura_json !== undefined) {
        let estructuraJson = datos.estructura_json
        if (typeof estructuraJson === 'object') {
          estructuraJson = JSON.stringify(estructuraJson)
        }
        campos.push('estructura_json = ?')
        valores.push(estructuraJson)
      }

      if (datos.activa !== undefined) {
        campos.push('activa = ?')
        valores.push(datos.activa)
      }

      if (campos.length === 0) {
        return await this.findPlantillaById(id, empresaId)
      }

      valores.push(id, empresaId)

      await connection.query(`
        UPDATE plantillas_proyecto
        SET ${campos.join(', ')}
        WHERE id = ? AND empresa_id = ?
      `, valores)

      return await this.findPlantillaById(id, empresaId)
    } catch (error) {
      console.error('Error al actualizar plantilla:', error)
      throw error
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Elimina una plantilla (soft delete)
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<boolean>} true si se eliminó
   */
  static async deletePlantilla(id, empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      const [result] = await connection.query(`
        UPDATE plantillas_proyecto
        SET activa = 0
        WHERE id = ? AND empresa_id = ?
      `, [id, empresaId])

      return result.affectedRows > 0
    } catch (error) {
      console.error('Error al eliminar plantilla:', error)
      throw error
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene todas las plantillas activas de una empresa
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Array>} Lista de plantillas
   */
  static async findAllPlantillas(empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      const [plantillas] = await connection.query(`
        SELECT id, nombre, descripcion, tipo_plantilla, activa, fecha_creacion
        FROM plantillas_proyecto
        WHERE empresa_id = ? AND activa = 1
        ORDER BY tipo_plantilla, nombre ASC
      `, [empresaId])

      return plantillas || []
    } catch (error) {
      console.error('Error al obtener plantillas:', error)
      return []
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Obtiene una plantilla por ID
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object|null>} Plantilla encontrada o null
   */
  static async findPlantillaById(id, empresaId) {
    let connection
    try {
      connection = await db.getConnection()

      const [plantillas] = await connection.query(`
        SELECT *
        FROM plantillas_proyecto
        WHERE id = ? AND empresa_id = ? AND activa = 1
      `, [id, empresaId])

      if (plantillas.length === 0) {
        return null
      }

      const plantilla = plantillas[0]
      
      // Parsear JSON si existe
      if (plantilla.estructura_json) {
        try {
          plantilla.estructura_json = typeof plantilla.estructura_json === 'string' 
            ? JSON.parse(plantilla.estructura_json)
            : plantilla.estructura_json
        } catch (e) {
          console.error('Error al parsear estructura_json:', e)
          plantilla.estructura_json = { obras: [] }
        }
      } else {
        plantilla.estructura_json = { obras: [] }
      }

      return plantilla
    } catch (error) {
      console.error('Error al obtener plantilla:', error)
      return null
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Genera un código único para una obra
   * Formato: OB-YYYY-XXX (ej: OB-2026-001)
   * @param {number} empresaId - ID de la empresa
   * @param {string} prefix - Prefijo opcional (default: 'OB')
   * @param {Object} connection - Conexión externa (opcional, para transacciones)
   * @returns {Promise<string>} Código generado
   */
  static async generarCodigoObra(empresaId, prefix = 'OB', connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      const [ultimaObra] = await connection.query(
        'SELECT codigo_obra FROM obras WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
        [empresaId]
      )

      let numero = 1
      if (ultimaObra.length > 0 && ultimaObra[0].codigo_obra) {
        const match = ultimaObra[0].codigo_obra.match(/\d+$/)
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
   * Crea una nueva obra
   * @param {Object} datos - Datos de la obra
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID de la obra creada
   */
  static async createObra(datos, connection = null) {
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
   * Crea un nuevo presupuesto
   * @param {Object} datos - Datos del presupuesto
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID del presupuesto creado
   */
  static async createPresupuesto(datos, connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      const [result] = await connection.query(`
        INSERT INTO presupuestos (
          empresa_id, tipo_destino, destino_id, nombre, descripcion,
          version, subtotal, impuestos, descuento, total,
          estado, es_activo, fecha_emision, creado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.empresa_id,
        datos.tipo_destino, // 'proyecto', 'obra', 'servicio'
        datos.destino_id,
        datos.nombre,
        datos.descripcion || null,
        datos.version || 1,
        datos.subtotal || 0.00,
        datos.impuestos || 0.00,
        datos.descuento || 0.00,
        datos.total || 0.00,
        datos.estado || 'borrador',
        datos.es_activo !== undefined ? datos.es_activo : 1,
        datos.fecha_emision || new Date().toISOString().split('T')[0],
        datos.creado_por
      ])

      return result.insertId
    } catch (error) {
      console.error('Error al crear presupuesto:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }

  /**
   * Crea un nuevo capítulo de presupuesto
   * @param {Object} datos - Datos del capítulo
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID del capítulo creado
   */
  static async createPresupuestoCapitulo(datos, connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      const [result] = await connection.query(`
        INSERT INTO presupuesto_capitulos (
          presupuesto_id, empresa_id, codigo, nombre, descripcion,
          orden, nivel, capitulo_padre_id, subtotal, impuestos, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.presupuesto_id,
        datos.empresa_id,
        datos.codigo || null,
        datos.nombre,
        datos.descripcion || null,
        datos.orden || 0,
        datos.nivel || 1,
        datos.capitulo_padre_id || null,
        datos.subtotal || 0.00,
        datos.impuestos || 0.00,
        datos.total || 0.00
      ])

      return result.insertId
    } catch (error) {
      console.error('Error al crear capítulo:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }

  /**
   * Crea una nueva tarea de presupuesto
   * @param {Object} datos - Datos de la tarea
   * @param {Object} connection - Conexión de base de datos (para transacciones)
   * @returns {Promise<number>} ID de la tarea creada
   */
  static async createPresupuestoTarea(datos, connection = null) {
    const useExternalConnection = connection !== null
    if (!connection) {
      connection = await db.getConnection()
    }

    try {
      // Calcular subtotales
      const cantidad = parseFloat(datos.cantidad || 1.000)
      const precioCoste = parseFloat(datos.precio_unitario_coste || 0.00)
      const precioVenta = parseFloat(datos.precio_unitario_venta || 0.00)
      
      const subtotalCoste = cantidad * precioCoste
      const subtotalVenta = cantidad * precioVenta
      const descuento = parseFloat(datos.descuento || 0.00)
      const impuestos = parseFloat(datos.impuestos || 0.00)
      const total = subtotalVenta - descuento + impuestos

      const [result] = await connection.query(`
        INSERT INTO presupuesto_tareas (
          presupuesto_id, capitulo_id, empresa_id, codigo, nombre, descripcion,
          unidad_medida, cantidad, precio_unitario_coste, precio_unitario_venta,
          margen_porcentaje, subtotal_coste, subtotal_venta, descuento, impuestos,
          total, producto_id, material_id, orden
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        datos.presupuesto_id,
        datos.capitulo_id,
        datos.empresa_id,
        datos.codigo || null,
        datos.nombre,
        datos.descripcion || null,
        datos.unidad_medida,
        cantidad,
        precioCoste,
        precioVenta,
        datos.margen_porcentaje || 0.00,
        subtotalCoste,
        subtotalVenta,
        descuento,
        impuestos,
        total,
        datos.producto_id || null,
        datos.material_id || null,
        datos.orden || 0
      ])

      return result.insertId
    } catch (error) {
      console.error('Error al crear tarea:', error)
      throw error
    } finally {
      if (!useExternalConnection && connection) {
        connection.release()
      }
    }
  }
}


/**
 * Servicio de Negocio para Proyectos
 * 
 * Capa de lógica de negocio que orquesta las operaciones
 * de proyectos, obras y presupuestos.
 * 
 * Responsabilidades:
 * - Reglas de negocio
 * - Validaciones de dominio
 * - Generación de códigos
 * - Orquestación de operaciones complejas
 * - NO contiene queries SQL directas
 */

import { ProyectoRepository } from '../repositories/ProyectoRepository'
import { validarCrearProyecto, validarActualizarProyecto } from '../schemas/validaciones'
import { ESTADOS_PROYECTO } from '../../core/construction/estados'
import db from '@/_DB/db'

export class ProyectoService {
  /**
   * Genera un código único para un proyecto
   * Formato: PRJ-YYYY-XXX (ej: PRJ-2026-001)
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<string>} Código generado
   */
  static async generarCodigoProyecto(empresaId) {
    const ultimoCodigo = await ProyectoRepository.getUltimoCodigo(empresaId)
    
    let numero = 1
    if (ultimoCodigo) {
      // Extraer número del código (ej: PRJ-2026-001 -> 001)
      const match = ultimoCodigo.match(/\d+$/)
      if (match) {
        numero = parseInt(match[0]) + 1
      }
    }
    
    const año = new Date().getFullYear()
    return `PRJ-${año}-${String(numero).padStart(3, '0')}`
  }
  
  /**
   * Valida y crea un nuevo proyecto
   * @param {Object} datos - Datos del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario creador
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearProyecto(datos, empresaId, userId) {
    try {
      // Validar datos
      const validacion = validarCrearProyecto(datos)
      if (!validacion.valido) {
        return {
          success: false,
          mensaje: 'Error de validación',
          errores: validacion.errores
        }
      }
      
      // Verificar que no exista un proyecto con el mismo nombre
      const existe = await ProyectoRepository.existsByNombre(
        datos.nombre.trim(),
        empresaId
      )
      
      if (existe) {
        return {
          success: false,
          mensaje: 'Ya existe un proyecto con ese nombre en esta empresa',
          errores: { nombre: 'El nombre del proyecto ya está en uso' }
        }
      }
      
      // Generar código único
      const codigoProyecto = await this.generarCodigoProyecto(empresaId)
      
      // Preparar datos para inserción
      const datosInsercion = {
        empresa_id: empresaId,
        codigo_proyecto: codigoProyecto,
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || null,
        fecha_inicio: datos.fecha_inicio,
        fecha_fin_estimada: datos.fecha_fin_estimada,
        presupuesto_total: datos.presupuesto_total ? parseFloat(datos.presupuesto_total) : 0.00,
        cliente_id: datos.cliente_id ? parseInt(datos.cliente_id) : null,
        usuario_responsable_id: datos.usuario_responsable_id ? parseInt(datos.usuario_responsable_id) : null,
        estado: ESTADOS_PROYECTO.PLANIFICACION, // Estado inicial según reglas
        prioridad: 'media',
        forma_pago: datos.forma_pago?.trim() || null,
        ubicacion: datos.ubicacion?.trim() || null,
        creado_por: userId
      }
      
      // Crear proyecto
      const proyecto = await ProyectoRepository.create(datosInsercion)
      
      // Si hay plantilla_id, aplicar la plantilla
      if (datos.plantilla_id) {
        const resultadoPlantilla = await this.aplicarPlantilla(
          proyecto.id,
          datos.plantilla_id,
          empresaId,
          userId
        )
        
        if (!resultadoPlantilla.success) {
          // Si falla la plantilla, el proyecto ya está creado
          // Podríamos hacer rollback aquí si es necesario
          console.warn('Proyecto creado pero falló al aplicar plantilla:', resultadoPlantilla.mensaje)
        }
      }
      
      return {
        success: true,
        mensaje: 'Proyecto creado exitosamente',
        proyecto: proyecto
      }
    } catch (error) {
      // Otros errores
      console.error('Error en ProyectoService.crearProyecto:', error)
      return {
        success: false,
        mensaje: 'Error al crear proyecto',
        error: error.message
      }
    }
  }
  
  /**
   * Obtiene proyectos con filtros
   * @param {number} empresaId - ID de la empresa
   * @param {Object} filtros - Filtros de búsqueda
   * @returns {Promise<Object>} Resultado con proyectos
   */
  static async obtenerProyectos(empresaId, filtros = {}) {
    try {
      const proyectos = await ProyectoRepository.findAll(empresaId, filtros)
      
      return {
        success: true,
        proyectos: proyectos,
        total: proyectos.length
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerProyectos:', error)
      return {
        success: false,
        mensaje: 'Error al obtener proyectos',
        proyectos: []
      }
    }
  }
  
  /**
   * Obtiene un proyecto por ID
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Resultado con proyecto
   */
  static async obtenerProyectoPorId(id, empresaId) {
    try {
      const proyecto = await ProyectoRepository.findById(id, empresaId)
      
      if (!proyecto) {
        return {
          success: false,
          mensaje: 'Proyecto no encontrado'
        }
      }
      
      // Obtener datos relacionados
      const [obras, servicios, estadisticas] = await Promise.all([
        ProyectoRepository.getObras(id, empresaId),
        ProyectoRepository.getServicios(id, empresaId),
        ProyectoRepository.getEstadisticas(id, empresaId)
      ])
      
      return {
        success: true,
        proyecto: {
          ...proyecto,
          obras: obras,
          servicios: servicios,
          estadisticas: estadisticas
        }
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerProyectoPorId:', error)
      return {
        success: false,
        mensaje: 'Error al obtener proyecto'
      }
    }
  }
  
  /**
   * Actualiza un proyecto
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarProyecto(id, empresaId, datos) {
    try {
      // Verificar que el proyecto existe
      const proyectoExistente = await ProyectoRepository.findById(id, empresaId)
      if (!proyectoExistente) {
        return {
          success: false,
          mensaje: 'Proyecto no encontrado'
        }
      }
      
      // Validar nombre único si se está cambiando
      if (datos.nombre && datos.nombre !== proyectoExistente.nombre) {
        const existe = await ProyectoRepository.existsByNombre(
          datos.nombre,
          empresaId,
          id
        )
        
        if (existe) {
          return {
            success: false,
            mensaje: 'Ya existe un proyecto con ese nombre',
            errores: { nombre: 'El nombre del proyecto ya está en uso' }
          }
        }
      }
      
      // Actualizar proyecto
      const proyectoActualizado = await ProyectoRepository.update(
        id,
        empresaId,
        datos
      )
      
      return {
        success: true,
        mensaje: 'Proyecto actualizado exitosamente',
        proyecto: proyectoActualizado
      }
    } catch (error) {
      console.error('Error en ProyectoService.actualizarProyecto:', error)
      return {
        success: false,
        mensaje: 'Error al actualizar proyecto'
      }
    }
  }
  
  /**
   * Cambia el estado de un proyecto
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {string} nuevoEstado - Nuevo estado
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async cambiarEstado(id, empresaId, nuevoEstado) {
    try {
      // Validar estado
      const estadosValidos = Object.values(ESTADOS_PROYECTO)
      if (!estadosValidos.includes(nuevoEstado)) {
        return {
          success: false,
          mensaje: 'Estado inválido'
        }
      }
      
      // Verificar que el proyecto existe
      const proyecto = await ProyectoRepository.findById(id, empresaId)
      if (!proyecto) {
        return {
          success: false,
          mensaje: 'Proyecto no encontrado'
        }
      }
      
      // Aplicar reglas de transición de estado (si las hay)
      // Por ejemplo: no se puede cancelar un proyecto finalizado
      if (proyecto.estado === ESTADOS_PROYECTO.FINALIZADO && 
          nuevoEstado === ESTADOS_PROYECTO.CANCELADO) {
        return {
          success: false,
          mensaje: 'No se puede cancelar un proyecto finalizado'
        }
      }
      
      // Actualizar estado
      const proyectoActualizado = await ProyectoRepository.update(
        id,
        empresaId,
        { estado: nuevoEstado }
      )
      
      return {
        success: true,
        mensaje: 'Estado actualizado exitosamente',
        proyecto: proyectoActualizado
      }
    } catch (error) {
      console.error('Error en ProyectoService.cambiarEstado:', error)
      return {
        success: false,
        mensaje: 'Error al cambiar estado'
      }
    }
  }
  
  /**
   * Crea una obra dentro de un proyecto
   * @param {Object} datos - Datos de la obra
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario creador
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearObraEnProyecto(datos, empresaId, userId) {
    try {
      // Verificar que el proyecto existe
      const proyecto = await ProyectoRepository.findById(
        datos.proyecto_id,
        empresaId
      )
      
      if (!proyecto) {
        return {
          success: false,
          mensaje: 'El proyecto especificado no existe'
        }
      }
      
      // La creación real de la obra se hará en el módulo de obras
      // Este método solo valida que el proyecto existe
      
      return {
        success: true,
        mensaje: 'Proyecto válido para crear obra',
        proyecto: proyecto
      }
    } catch (error) {
      console.error('Error en ProyectoService.crearObraEnProyecto:', error)
      return {
        success: false,
        mensaje: 'Error al validar proyecto'
      }
    }
  }
  
  /**
   * Elimina un proyecto
   * @param {number} id - ID del proyecto
   * @param {number} empresaId - ID de la empresa
   * @param {boolean} hardDelete - Si es true, elimina físicamente
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async eliminarProyecto(id, empresaId, hardDelete = false) {
    try {
      // Verificar que el proyecto existe
      const proyecto = await ProyectoRepository.findById(id, empresaId)
      if (!proyecto) {
        return {
          success: false,
          mensaje: 'Proyecto no encontrado'
        }
      }
      
      // Verificar si tiene obras o servicios asociados
      const estadisticas = await ProyectoRepository.getEstadisticas(id, empresaId)
      
      if (!hardDelete && (estadisticas.total_obras > 0 || estadisticas.total_servicios > 0)) {
        return {
          success: false,
          mensaje: 'No se puede eliminar un proyecto que tiene obras o servicios asociados. Cancele el proyecto en su lugar.'
        }
      }
      
      // Eliminar proyecto
      const eliminado = await ProyectoRepository.delete(id, empresaId, hardDelete)
      
      if (!eliminado) {
        return {
          success: false,
          mensaje: 'No se pudo eliminar el proyecto'
        }
      }
      
      return {
        success: true,
        mensaje: hardDelete 
          ? 'Proyecto eliminado permanentemente' 
          : 'Proyecto cancelado exitosamente'
      }
    } catch (error) {
      console.error('Error en ProyectoService.eliminarProyecto:', error)
      return {
        success: false,
        mensaje: 'Error al eliminar proyecto'
      }
    }
  }

  /**
   * Obtiene estadísticas de proyectos para predicciones inteligentes
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Estadísticas (duración promedio, presupuesto promedio, etc.)
   */
  static async obtenerEstadisticasParaPredicciones(empresaId) {
    try {
      return await ProyectoRepository.getEstadisticasParaPredicciones(empresaId)
    } catch (error) {
      console.error('Error en ProyectoService.obtenerEstadisticasParaPredicciones:', error)
      return {
        success: false,
        mensaje: 'Error al obtener estadísticas',
        estadisticas: {
          duracionPromedioDias: 30,
          presupuestoPromedio: 0,
          etiquetasFrecuentes: []
        }
      }
    }
  }

  /**
   * Obtiene usuarios responsables disponibles
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Lista de usuarios
   */
  static async obtenerUsuariosResponsables(empresaId) {
    try {
      const usuarios = await ProyectoRepository.getUsuariosResponsables(empresaId)
      return {
        success: true,
        usuarios
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerUsuariosResponsables:', error)
      return {
        success: false,
        mensaje: 'Error al obtener usuarios',
        usuarios: []
      }
    }
  }

  /**
   * Obtiene etiquetas existentes de proyectos
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Lista de etiquetas únicas
   */
  static async obtenerEtiquetasExistentes(empresaId) {
    try {
      const etiquetas = await ProyectoRepository.getEtiquetasExistentes(empresaId)
      return {
        success: true,
        etiquetas
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerEtiquetasExistentes:', error)
      return {
        success: false,
        mensaje: 'Error al obtener etiquetas',
        etiquetas: []
      }
    }
  }

  /**
   * Aplica una plantilla a un proyecto existente
   * Crea obras, presupuestos, capítulos y tareas según la estructura de la plantilla
   * Soporta nueva estructura JSON y clonado desde obras plantilla
   * @param {number} proyectoId - ID del proyecto
   * @param {number} plantillaId - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async aplicarPlantilla(proyectoId, plantillaId, empresaId, userId) {
    let connection
    try {
      // Cargar plantilla
      const plantilla = await ProyectoRepository.findPlantillaById(plantillaId, empresaId)
      
      if (!plantilla) {
        return {
          success: false,
          mensaje: 'Plantilla no encontrada o inactiva'
        }
      }

      // Validar estructura JSON
      const estructura = plantilla.estructura_json
      if (!estructura) {
        return {
          success: false,
          mensaje: 'La plantilla no tiene una estructura válida'
        }
      }

      // Obtener conexión para transacción
      connection = await db.getConnection()
      await connection.beginTransaction()

      const obrasCreadas = []
      const presupuestosCreados = []
      const serviciosCreados = []

      try {
        // Obtener datos del proyecto para usar en obras
        const proyecto = await ProyectoRepository.findById(proyectoId, empresaId)
        if (!proyecto) {
          throw new Error('Proyecto no encontrado')
        }

        // Obtener configuración de la plantilla (nueva estructura)
        const configuracion = estructura.configuracion || {
          crear_presupuesto_proyecto: true,
          crear_obras: true,
          crear_servicios: true
        }

        // Procesar obras de la plantilla
        if (configuracion.crear_obras && estructura.obras && estructura.obras.length > 0) {
          for (const obraPlantilla of estructura.obras) {
            let obraId

            // Si tiene obra_plantilla_id, clonar desde obra plantilla
            if (obraPlantilla.obra_plantilla_id) {
              const { ObraService } = await import('../../obras/services/ObraService')
              const resultado = await ObraService.clonarObraDesdePlantilla(
                obraPlantilla.obra_plantilla_id,
                proyectoId,
                {
                  nombre: obraPlantilla.nombre || null,
                  descripcion: obraPlantilla.descripcion || null,
                  ubicacion: proyecto.ubicacion || '',
                  zona: obraPlantilla.zona || null,
                  municipio: obraPlantilla.municipio || null,
                  provincia: obraPlantilla.provincia || null,
                  fecha_inicio: proyecto.fecha_inicio,
                  fecha_fin_estimada: proyecto.fecha_fin_estimada
                },
                empresaId,
                userId
              )

              if (!resultado.success) {
                throw new Error(resultado.mensaje || 'Error al clonar obra desde plantilla')
              }

              obraId = resultado.obra_id
            } else {
              // Crear obra desde estructura embebida (comportamiento legacy)
              obraId = await ProyectoRepository.createObra({
                empresa_id: empresaId,
                proyecto_id: proyectoId,
                nombre: obraPlantilla.nombre,
                descripcion: obraPlantilla.descripcion || null,
                tipo_obra: obraPlantilla.tipo_obra || 'construccion',
                ubicacion: proyecto.ubicacion || '',
                presupuesto_aprobado: 0.00,
                fecha_inicio: proyecto.fecha_inicio,
                fecha_fin_estimada: proyecto.fecha_fin_estimada,
                estado: 'planificacion',
                cliente_id: proyecto.cliente_id,
                usuario_responsable_id: proyecto.usuario_responsable_id,
                es_plantilla: 0,
                obra_plantilla_id: null,
                creado_por: userId
              }, connection)

              // Procesar presupuestos embebidos (solo si no viene de obra plantilla)
              if (obraPlantilla.presupuesto) {
                const presupuestoId = await ProyectoRepository.createPresupuesto({
                  empresa_id: empresaId,
                  tipo_destino: 'obra',
                  destino_id: obraId,
                  nombre: obraPlantilla.presupuesto.nombre || 'Presupuesto Inicial',
                  descripcion: obraPlantilla.presupuesto.descripcion || null,
                  version: 1,
                  subtotal: 0.00,
                  impuestos: 0.00,
                  descuento: 0.00,
                  total: 0.00,
                  estado: 'borrador',
                  es_activo: 1,
                  fecha_emision: proyecto.fecha_inicio,
                  creado_por: userId
                }, connection)

                presupuestosCreados.push(presupuestoId)

                // Procesar capítulos
                for (const capituloPlantilla of obraPlantilla.presupuesto.capitulos || []) {
                  const capituloId = await this._crearCapituloConTareas(
                    presupuestoId,
                    capituloPlantilla,
                    empresaId,
                    connection
                  )
                }
              }

              // Procesar servicios embebidos en la obra
              if (obraPlantilla.servicios && obraPlantilla.servicios.length > 0) {
                const { ObraRepository } = await import('../../obras/repositories/ObraRepository')
                for (const servicioPlantilla of obraPlantilla.servicios) {
                  const servicioId = await ObraRepository.createServicio({
                    empresa_id: empresaId,
                    proyecto_id: proyectoId,
                    obra_id: obraId,
                    nombre: servicioPlantilla.nombre,
                    descripcion: servicioPlantilla.descripcion || null,
                    tipo_servicio: servicioPlantilla.tipo_servicio || servicioPlantilla.categoria || 'otro',
                    ubicacion: proyecto.ubicacion || '',
                    costo_estimado: servicioPlantilla.costo_estimado || 0.00,
                    fecha_solicitud: proyecto.fecha_inicio,
                    estado: 'pendiente',
                    prioridad: servicioPlantilla.prioridad || 'media',
                    cliente_id: proyecto.cliente_id,
                    usuario_responsable_id: proyecto.usuario_responsable_id,
                    creado_por: userId
                  }, connection)

                  serviciosCreados.push(servicioId)
                }
              }
            }

            obrasCreadas.push(obraId)
          }
        }

        // Procesar servicios directos del proyecto (nueva estructura)
        if (configuracion.crear_servicios && estructura.servicios_proyecto && estructura.servicios_proyecto.length > 0) {
          const { ObraRepository } = await import('../../obras/repositories/ObraRepository')
          for (const servicioPlantilla of estructura.servicios_proyecto) {
            const servicioId = await ObraRepository.createServicio({
              empresa_id: empresaId,
              proyecto_id: proyectoId,
              obra_id: null,
              nombre: servicioPlantilla.nombre,
              descripcion: servicioPlantilla.descripcion || null,
              tipo_servicio: servicioPlantilla.tipo_servicio || servicioPlantilla.categoria || 'otro',
              ubicacion: proyecto.ubicacion || '',
              costo_estimado: servicioPlantilla.costo_estimado || 0.00,
              fecha_solicitud: proyecto.fecha_inicio,
              estado: 'pendiente',
              prioridad: servicioPlantilla.prioridad || 'media',
              cliente_id: proyecto.cliente_id,
              usuario_responsable_id: proyecto.usuario_responsable_id,
              creado_por: userId
            }, connection)

            serviciosCreados.push(servicioId)
          }
        }

        // Procesar presupuesto directo del proyecto (nueva estructura)
        if (configuracion.crear_presupuesto_proyecto && estructura.presupuesto_proyecto) {
          const presupuestoId = await ProyectoRepository.createPresupuesto({
            empresa_id: empresaId,
            tipo_destino: 'proyecto',
            destino_id: proyectoId,
            nombre: estructura.presupuesto_proyecto.nombre || 'Presupuesto General',
            descripcion: estructura.presupuesto_proyecto.descripcion || null,
            version: 1,
            subtotal: 0.00,
            impuestos: 0.00,
            descuento: 0.00,
            total: 0.00,
            estado: 'borrador',
            es_activo: 1,
            fecha_emision: proyecto.fecha_inicio,
            creado_por: userId
          }, connection)

          presupuestosCreados.push(presupuestoId)

          // Procesar capítulos del presupuesto del proyecto
          for (const capituloPlantilla of estructura.presupuesto_proyecto.capitulos || []) {
            await this._crearCapituloConTareas(
              presupuestoId,
              capituloPlantilla,
              empresaId,
              connection
            )
          }
        }

        // Commit transacción
        await connection.commit()

        return {
          success: true,
          mensaje: 'Plantilla aplicada exitosamente',
          estadisticas: {
            obras: obrasCreadas.length,
            presupuestos: presupuestosCreados.length,
            servicios: serviciosCreados.length
          }
        }
      } catch (error) {
        // Rollback en caso de error
        await connection.rollback()
        throw error
      }
    } catch (error) {
      console.error('Error en ProyectoService.aplicarPlantilla:', error)
      return {
        success: false,
        mensaje: 'Error al aplicar plantilla: ' + error.message
      }
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  /**
   * Obtiene todas las plantillas de una empresa
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Resultado con plantillas
   */
  static async obtenerPlantillas(empresaId) {
    try {
      const plantillas = await ProyectoRepository.findAllPlantillas(empresaId)
      return {
        success: true,
        plantillas: plantillas || []
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerPlantillas:', error)
      return {
        success: false,
        mensaje: 'Error al obtener plantillas',
        plantillas: []
      }
    }
  }

  /**
   * Obtiene una plantilla por ID
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Resultado con plantilla
   */
  static async obtenerPlantillaPorId(id, empresaId) {
    try {
      const plantilla = await ProyectoRepository.findPlantillaById(id, empresaId)
      
      if (!plantilla) {
        return {
          success: false,
          mensaje: 'Plantilla no encontrada'
        }
      }

      return {
        success: true,
        plantilla
      }
    } catch (error) {
      console.error('Error en ProyectoService.obtenerPlantillaPorId:', error)
      return {
        success: false,
        mensaje: 'Error al obtener plantilla'
      }
    }
  }

  /**
   * Crea una nueva plantilla
   * @param {Object} datos - Datos de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario creador
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async crearPlantilla(datos, empresaId, userId) {
    try {
      // Validaciones básicas
      if (!datos.nombre || datos.nombre.trim() === '') {
        return {
          success: false,
          mensaje: 'El nombre de la plantilla es obligatorio',
          errores: { nombre: 'El nombre es requerido' }
        }
      }

      if (!datos.estructura_json || !datos.estructura_json.obras || datos.estructura_json.obras.length === 0) {
        return {
          success: false,
          mensaje: 'La plantilla debe tener al menos una obra',
          errores: { estructura_json: 'Debe tener al menos una obra' }
        }
      }

      // Verificar que no exista una plantilla con el mismo nombre
      const plantillas = await ProyectoRepository.findAllPlantillas(empresaId)
      const existe = plantillas.some(p => p.nombre.toLowerCase() === datos.nombre.trim().toLowerCase())
      
      if (existe) {
        return {
          success: false,
          mensaje: 'Ya existe una plantilla con ese nombre',
          errores: { nombre: 'El nombre de la plantilla ya está en uso' }
        }
      }

      // Crear plantilla
      const plantilla = await ProyectoRepository.createPlantilla({
        empresa_id: empresaId,
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || null,
        tipo_plantilla: datos.tipo_plantilla || 'otro',
        estructura_json: datos.estructura_json,
        activa: datos.activa !== undefined ? datos.activa : 1,
        creado_por: userId
      })

      return {
        success: true,
        mensaje: 'Plantilla creada exitosamente',
        plantilla
      }
    } catch (error) {
      console.error('Error en ProyectoService.crearPlantilla:', error)
      return {
        success: false,
        mensaje: 'Error al crear plantilla',
        error: error.message
      }
    }
  }

  /**
   * Actualiza una plantilla existente
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async actualizarPlantilla(id, empresaId, datos) {
    try {
      // Validar que la plantilla existe
      const plantillaExistente = await ProyectoRepository.findPlantillaById(id, empresaId)
      if (!plantillaExistente) {
        return {
          success: false,
          mensaje: 'Plantilla no encontrada'
        }
      }

      // Validaciones
      if (datos.nombre !== undefined && datos.nombre.trim() === '') {
        return {
          success: false,
          mensaje: 'El nombre de la plantilla no puede estar vacío',
          errores: { nombre: 'El nombre es requerido' }
        }
      }

      if (datos.estructura_json !== undefined) {
        if (!datos.estructura_json.obras || datos.estructura_json.obras.length === 0) {
          return {
            success: false,
            mensaje: 'La plantilla debe tener al menos una obra',
            errores: { estructura_json: 'Debe tener al menos una obra' }
          }
        }
      }

      // Verificar nombre único si se está cambiando
      if (datos.nombre && datos.nombre.trim() !== plantillaExistente.nombre) {
        const plantillas = await ProyectoRepository.findAllPlantillas(empresaId)
        const existe = plantillas.some(p => p.id !== id && p.nombre.toLowerCase() === datos.nombre.trim().toLowerCase())
        
        if (existe) {
          return {
            success: false,
            mensaje: 'Ya existe una plantilla con ese nombre',
            errores: { nombre: 'El nombre de la plantilla ya está en uso' }
          }
        }
      }

      // Actualizar plantilla
      const plantilla = await ProyectoRepository.updatePlantilla(id, empresaId, datos)

      return {
        success: true,
        mensaje: 'Plantilla actualizada exitosamente',
        plantilla
      }
    } catch (error) {
      console.error('Error en ProyectoService.actualizarPlantilla:', error)
      return {
        success: false,
        mensaje: 'Error al actualizar plantilla',
        error: error.message
      }
    }
  }

  /**
   * Elimina una plantilla (soft delete)
   * @param {number} id - ID de la plantilla
   * @param {number} empresaId - ID de la empresa
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async eliminarPlantilla(id, empresaId) {
    try {
      const eliminada = await ProyectoRepository.deletePlantilla(id, empresaId)
      
      if (!eliminada) {
        return {
          success: false,
          mensaje: 'Plantilla no encontrada'
        }
      }

      return {
        success: true,
        mensaje: 'Plantilla eliminada exitosamente'
      }
    } catch (error) {
      console.error('Error en ProyectoService.eliminarPlantilla:', error)
      return {
        success: false,
        mensaje: 'Error al eliminar plantilla',
        error: error.message
      }
    }
  }

  /**
   * Helper: Crea un capítulo con sus tareas (soporta subcapítulos recursivamente)
   * @private
   */
  static async _crearCapituloConTareas(presupuestoId, capituloPlantilla, empresaId, connection) {
    // Crear capítulo
    const capituloId = await ProyectoRepository.createPresupuestoCapitulo({
      presupuesto_id: presupuestoId,
      empresa_id: empresaId,
      codigo: capituloPlantilla.codigo || null,
      nombre: capituloPlantilla.nombre,
      descripcion: capituloPlantilla.descripcion || null,
      orden: capituloPlantilla.orden || 0,
      nivel: capituloPlantilla.nivel || 1,
      capitulo_padre_id: capituloPlantilla.capitulo_padre_id || null,
      subtotal: 0.00,
      impuestos: 0.00,
      total: 0.00
    }, connection)

    // Procesar tareas del capítulo
    if (capituloPlantilla.tareas && capituloPlantilla.tareas.length > 0) {
      for (const tareaPlantilla of capituloPlantilla.tareas) {
        // Validar campos requeridos
        if (!tareaPlantilla.nombre || !tareaPlantilla.unidad_medida) {
          console.warn('Tarea sin nombre o unidad_medida, omitiendo:', tareaPlantilla)
          continue
        }

        await ProyectoRepository.createPresupuestoTarea({
          presupuesto_id: presupuestoId,
          capitulo_id: capituloId,
          empresa_id: empresaId,
          codigo: tareaPlantilla.codigo || null,
          nombre: tareaPlantilla.nombre,
          descripcion: tareaPlantilla.descripcion || null,
          unidad_medida: tareaPlantilla.unidad_medida,
          cantidad: parseFloat(tareaPlantilla.cantidad || 1.000),
          precio_unitario_coste: parseFloat(tareaPlantilla.precio_unitario_coste || 0.00),
          precio_unitario_venta: parseFloat(tareaPlantilla.precio_unitario_venta || 0.00),
          margen_porcentaje: parseFloat(tareaPlantilla.margen_porcentaje || 0.00),
          descuento: parseFloat(tareaPlantilla.descuento || 0.00),
          impuestos: parseFloat(tareaPlantilla.impuestos || 0.00),
          orden: tareaPlantilla.orden || 0,
          producto_id: tareaPlantilla.producto_id || null,
          material_id: tareaPlantilla.material_id || null
        }, connection)
      }
    }

    // Procesar subcapítulos recursivamente
    if (capituloPlantilla.subcapitulos && capituloPlantilla.subcapitulos.length > 0) {
      for (const subcapituloPlantilla of capituloPlantilla.subcapitulos) {
        subcapituloPlantilla.capitulo_padre_id = capituloId
        subcapituloPlantilla.nivel = (capituloPlantilla.nivel || 1) + 1
        await this._crearCapituloConTareas(presupuestoId, subcapituloPlantilla, empresaId, connection)
      }
    }

    return capituloId
  }
}


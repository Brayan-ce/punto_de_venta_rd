/**
 * Servicio de Lógica de Negocio para Obras
 * 
 * Capa de lógica de negocio que orquesta operaciones complejas
 * relacionadas con obras, incluyendo clonado desde plantillas.
 * 
 * Responsabilidades:
 * - Validaciones de negocio
 * - Orquestación de operaciones complejas
 * - Lógica de clonado
 * - NO contiene queries SQL directas
 */

import { ObraRepository } from '../repositories/ObraRepository'
import { ProyectoRepository } from '../../proyectos/repositories/ProyectoRepository'
import db from "@/_DB/db"

export class ObraService {
  /**
   * Clona una obra desde una plantilla
   * Crea una nueva obra operativa con todos sus servicios y presupuestos
   * @param {number} obraPlantillaId - ID de la obra plantilla
   * @param {number} proyectoId - ID del proyecto destino
   * @param {Object} datos - Datos adicionales (nombre, fechas, etc.)
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario que realiza la operación
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async clonarObraDesdePlantilla(obraPlantillaId, proyectoId, datos, empresaId, userId) {
    let connection
    try {
      // Validar que la obra plantilla existe
      const obraPlantilla = await ObraRepository.findPlantillaById(obraPlantillaId, empresaId)
      
      if (!obraPlantilla) {
        return {
          success: false,
          mensaje: 'Obra plantilla no encontrada o no es una plantilla válida'
        }
      }

      // Validar que el proyecto existe
      const proyecto = await ProyectoRepository.findById(proyectoId, empresaId)
      if (!proyecto) {
        return {
          success: false,
          mensaje: 'Proyecto no encontrado'
        }
      }

      // Obtener conexión para transacción
      connection = await db.getConnection()
      await connection.beginTransaction()

      try {
        // 1. Crear nueva obra (clonada)
        const nuevaObraId = await ObraRepository.create({
          empresa_id: empresaId,
          proyecto_id: proyectoId,
          nombre: datos.nombre || obraPlantilla.nombre,
          descripcion: datos.descripcion || obraPlantilla.descripcion,
          tipo_obra: obraPlantilla.tipo_obra,
          ubicacion: datos.ubicacion || proyecto.ubicacion || obraPlantilla.ubicacion || '',
          zona: datos.zona || obraPlantilla.zona,
          municipio: datos.municipio || obraPlantilla.municipio,
          provincia: datos.provincia || obraPlantilla.provincia,
          presupuesto_aprobado: 0.00, // Se calcula después
          fecha_inicio: datos.fecha_inicio || proyecto.fecha_inicio,
          fecha_fin_estimada: datos.fecha_fin_estimada || proyecto.fecha_fin_estimada,
          estado: 'planificacion',
          cliente_id: proyecto.cliente_id || null,
          usuario_responsable_id: proyecto.usuario_responsable_id || null,
          es_plantilla: 0,
          obra_plantilla_id: obraPlantillaId,
          creado_por: userId
        }, connection)

        // 2. Clonar servicios asociados
        const serviciosPlantilla = await ObraRepository.findServiciosByObraId(obraPlantillaId)
        const serviciosCreados = []
        
        for (const servicioPlantilla of serviciosPlantilla) {
          const servicioId = await ObraRepository.createServicio({
            empresa_id: empresaId,
            proyecto_id: proyectoId,
            obra_id: nuevaObraId,
            nombre: servicioPlantilla.nombre,
            descripcion: servicioPlantilla.descripcion,
            tipo_servicio: servicioPlantilla.tipo_servicio,
            ubicacion: servicioPlantilla.ubicacion,
            zona: servicioPlantilla.zona,
            costo_estimado: servicioPlantilla.costo_estimado || 0.00,
            fecha_solicitud: datos.fecha_inicio || proyecto.fecha_inicio,
            fecha_programada: datos.fecha_inicio || proyecto.fecha_inicio,
            estado: 'pendiente',
            prioridad: servicioPlantilla.prioridad || 'media',
            cliente_id: proyecto.cliente_id || null,
            usuario_responsable_id: proyecto.usuario_responsable_id || null,
            creado_por: userId
          }, connection)
          
          serviciosCreados.push(servicioId)
        }

        // 3. Clonar presupuestos
        const presupuestosPlantilla = await ObraRepository.findPresupuestosByObraId(obraPlantillaId)
        const presupuestosCreados = []
        
        // Solo clonar el presupuesto activo o el primero si no hay activo
        const presupuestoActivo = presupuestosPlantilla.find(p => p.es_activo === 1) || presupuestosPlantilla[0]
        
        if (presupuestoActivo) {
          // Crear nuevo presupuesto
          const nuevoPresupuestoId = await ProyectoRepository.createPresupuesto({
            empresa_id: empresaId,
            tipo_destino: 'obra',
            destino_id: nuevaObraId,
            nombre: presupuestoActivo.nombre,
            descripcion: presupuestoActivo.descripcion,
            version: 1,
            subtotal: 0.00, // Se recalcula
            impuestos: 0.00,
            descuento: 0.00,
            total: 0.00,
            estado: 'borrador',
            es_activo: 1,
            fecha_emision: new Date().toISOString().split('T')[0],
            creado_por: userId
          }, connection)
          
          presupuestosCreados.push(nuevoPresupuestoId)

          // 4. Clonar capítulos y tareas
          const capitulosPlantilla = await ObraRepository.findCapitulosByPresupuestoId(presupuestoActivo.id)
          const capitulosMap = new Map() // Para mapear IDs antiguos a nuevos (subcapítulos)
          
          // Primero crear capítulos de nivel 1
          for (const capituloPlantilla of capitulosPlantilla.filter(c => !c.capitulo_padre_id)) {
            const nuevoCapituloId = await ProyectoRepository.createPresupuestoCapitulo({
              presupuesto_id: nuevoPresupuestoId,
              empresa_id: empresaId,
              codigo: capituloPlantilla.codigo,
              nombre: capituloPlantilla.nombre,
              descripcion: capituloPlantilla.descripcion,
              orden: capituloPlantilla.orden,
              nivel: capituloPlantilla.nivel || 1,
              capitulo_padre_id: null,
              subtotal: 0.00,
              impuestos: 0.00,
              total: 0.00
            }, connection)
            
            capitulosMap.set(capituloPlantilla.id, nuevoCapituloId)
          }
          
          // Luego crear subcapítulos
          for (const capituloPlantilla of capitulosPlantilla.filter(c => c.capitulo_padre_id)) {
            const nuevoPadreId = capitulosMap.get(capituloPlantilla.capitulo_padre_id)
            if (nuevoPadreId) {
              const nuevoCapituloId = await ProyectoRepository.createPresupuestoCapitulo({
                presupuesto_id: nuevoPresupuestoId,
                empresa_id: empresaId,
                codigo: capituloPlantilla.codigo,
                nombre: capituloPlantilla.nombre,
                descripcion: capituloPlantilla.descripcion,
                orden: capituloPlantilla.orden,
                nivel: capituloPlantilla.nivel || 2,
                capitulo_padre_id: nuevoPadreId,
                subtotal: 0.00,
                impuestos: 0.00,
                total: 0.00
              }, connection)
              
              capitulosMap.set(capituloPlantilla.id, nuevoCapituloId)
            }
          }
          
          // 5. Clonar tareas
          for (const capituloPlantilla of capitulosPlantilla) {
            const nuevoCapituloId = capitulosMap.get(capituloPlantilla.id)
            if (nuevoCapituloId) {
              const tareasPlantilla = await ObraRepository.findTareasByCapituloId(capituloPlantilla.id)
              
              for (const tareaPlantilla of tareasPlantilla) {
                await ProyectoRepository.createPresupuestoTarea({
                  presupuesto_id: nuevoPresupuestoId,
                  capitulo_id: nuevoCapituloId,
                  empresa_id: empresaId,
                  codigo: tareaPlantilla.codigo,
                  nombre: tareaPlantilla.nombre,
                  descripcion: tareaPlantilla.descripcion,
                  unidad_medida: tareaPlantilla.unidad_medida,
                  cantidad: tareaPlantilla.cantidad,
                  precio_unitario_coste: tareaPlantilla.precio_unitario_coste || 0.00,
                  precio_unitario_venta: tareaPlantilla.precio_unitario_venta || 0.00,
                  margen_porcentaje: tareaPlantilla.margen_porcentaje || 0.00,
                  descuento: tareaPlantilla.descuento || 0.00,
                  impuestos: tareaPlantilla.impuestos || 0.00,
                  producto_id: tareaPlantilla.producto_id || null,
                  material_id: tareaPlantilla.material_id || null,
                  orden: tareaPlantilla.orden || 0
                }, connection)
              }
            }
          }
        }

        // Commit transacción
        await connection.commit()

        return {
          success: true,
          mensaje: 'Obra clonada exitosamente',
          obra_id: nuevaObraId,
          servicios_creados: serviciosCreados.length,
          presupuestos_creados: presupuestosCreados.length
        }
      } catch (error) {
        await connection.rollback()
        throw error
      }
    } catch (error) {
      console.error('Error al clonar obra desde plantilla:', error)
      return {
        success: false,
        mensaje: 'Error al clonar obra desde plantilla',
        error: error.message
      }
    } finally {
      if (connection) connection.release()
    }
  }

  /**
   * Guarda una obra existente como plantilla
   * @param {number} obraId - ID de la obra a convertir
   * @param {number} empresaId - ID de la empresa
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async guardarObraComoPlantilla(obraId, empresaId, userId) {
    let connection
    try {
      // Obtener obra original
      const obraOriginal = await ObraRepository.findById(obraId, empresaId)
      
      if (!obraOriginal) {
        return {
          success: false,
          mensaje: 'Obra no encontrada'
        }
      }

      // Validar que no sea ya una plantilla
      if (obraOriginal.es_plantilla === 1) {
        return {
          success: false,
          mensaje: 'Esta obra ya es una plantilla'
        }
      }

      // Validar que tenga proyecto (no puede ser plantilla si no tiene proyecto)
      if (!obraOriginal.proyecto_id) {
        return {
          success: false,
          mensaje: 'No se puede convertir en plantilla una obra sin proyecto'
        }
      }

      connection = await db.getConnection()
      await connection.beginTransaction()

      try {
        // Crear nueva obra plantilla (clonada)
        const nuevaPlantillaId = await ObraRepository.create({
          empresa_id: empresaId,
          proyecto_id: null, // Plantillas no tienen proyecto
          nombre: obraOriginal.nombre,
          descripcion: obraOriginal.descripcion,
          tipo_obra: obraOriginal.tipo_obra,
          ubicacion: obraOriginal.ubicacion,
          zona: obraOriginal.zona,
          municipio: obraOriginal.municipio,
          provincia: obraOriginal.provincia,
          presupuesto_aprobado: obraOriginal.presupuesto_aprobado, // Mantener como referencia
          fecha_inicio: new Date().toISOString().split('T')[0], // Fecha genérica
          fecha_fin_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días después
          estado: 'planificacion',
          cliente_id: null, // Plantillas no tienen cliente
          usuario_responsable_id: null, // Plantillas no tienen responsable
          es_plantilla: 1,
          obra_plantilla_id: null,
          creado_por: userId
        }, connection)

        // Clonar servicios (solo estructura, sin datos operativos)
        const serviciosOriginales = await ObraRepository.findServiciosByObraId(obraId)
        for (const servicio of serviciosOriginales) {
          await ObraRepository.createServicio({
            empresa_id: empresaId,
            proyecto_id: null,
            obra_id: nuevaPlantillaId,
            nombre: servicio.nombre,
            descripcion: servicio.descripcion,
            tipo_servicio: servicio.tipo_servicio,
            ubicacion: servicio.ubicacion,
            zona: servicio.zona,
            costo_estimado: servicio.costo_estimado || 0.00,
            fecha_solicitud: new Date().toISOString().split('T')[0],
            fecha_programada: null,
            estado: 'pendiente',
            prioridad: servicio.prioridad || 'media',
            cliente_id: null,
            usuario_responsable_id: null,
            creado_por: userId
          }, connection)
        }

        // Clonar presupuesto activo (solo estructura)
        const presupuestosOriginales = await ObraRepository.findPresupuestosByObraId(obraId)
        const presupuestoActivo = presupuestosOriginales.find(p => p.es_activo === 1) || presupuestosOriginales[0]
        
        if (presupuestoActivo) {
          const nuevoPresupuestoId = await ProyectoRepository.createPresupuesto({
            empresa_id: empresaId,
            tipo_destino: 'obra',
            destino_id: nuevaPlantillaId,
            nombre: presupuestoActivo.nombre,
            descripcion: presupuestoActivo.descripcion,
            version: 1,
            subtotal: 0.00,
            impuestos: 0.00,
            descuento: 0.00,
            total: 0.00,
            estado: 'borrador',
            es_activo: 1,
            fecha_emision: new Date().toISOString().split('T')[0],
            creado_por: userId
          }, connection)

          // Clonar capítulos y tareas
          const capitulosOriginales = await ObraRepository.findCapitulosByPresupuestoId(presupuestoActivo.id)
          const capitulosMap = new Map()
          
          // Capítulos nivel 1
          for (const capitulo of capitulosOriginales.filter(c => !c.capitulo_padre_id)) {
            const nuevoCapituloId = await ProyectoRepository.createPresupuestoCapitulo({
              presupuesto_id: nuevoPresupuestoId,
              empresa_id: empresaId,
              codigo: capitulo.codigo,
              nombre: capitulo.nombre,
              descripcion: capitulo.descripcion,
              orden: capitulo.orden,
              nivel: capitulo.nivel || 1,
              capitulo_padre_id: null,
              subtotal: 0.00,
              impuestos: 0.00,
              total: 0.00
            }, connection)
            
            capitulosMap.set(capitulo.id, nuevoCapituloId)
          }
          
          // Subcapítulos
          for (const capitulo of capitulosOriginales.filter(c => c.capitulo_padre_id)) {
            const nuevoPadreId = capitulosMap.get(capitulo.capitulo_padre_id)
            if (nuevoPadreId) {
              const nuevoCapituloId = await ProyectoRepository.createPresupuestoCapitulo({
                presupuesto_id: nuevoPresupuestoId,
                empresa_id: empresaId,
                codigo: capitulo.codigo,
                nombre: capitulo.nombre,
                descripcion: capitulo.descripcion,
                orden: capitulo.orden,
                nivel: capitulo.nivel || 2,
                capitulo_padre_id: nuevoPadreId,
                subtotal: 0.00,
                impuestos: 0.00,
                total: 0.00
              }, connection)
              
              capitulosMap.set(capitulo.id, nuevoCapituloId)
            }
          }
          
          // Tareas
          for (const capitulo of capitulosOriginales) {
            const nuevoCapituloId = capitulosMap.get(capitulo.id)
            if (nuevoCapituloId) {
              const tareas = await ObraRepository.findTareasByCapituloId(capitulo.id)
              
              for (const tarea of tareas) {
                await ProyectoRepository.createPresupuestoTarea({
                  presupuesto_id: nuevoPresupuestoId,
                  capitulo_id: nuevoCapituloId,
                  empresa_id: empresaId,
                  codigo: tarea.codigo,
                  nombre: tarea.nombre,
                  descripcion: tarea.descripcion,
                  unidad_medida: tarea.unidad_medida,
                  cantidad: tarea.cantidad,
                  precio_unitario_coste: tarea.precio_unitario_coste || 0.00,
                  precio_unitario_venta: tarea.precio_unitario_venta || 0.00,
                  margen_porcentaje: tarea.margen_porcentaje || 0.00,
                  descuento: 0.00, // Limpiar descuentos
                  impuestos: 0.00, // Limpiar impuestos
                  producto_id: tarea.producto_id || null,
                  material_id: tarea.material_id || null,
                  orden: tarea.orden || 0
                }, connection)
              }
            }
          }
        }

        await connection.commit()

        return {
          success: true,
          mensaje: 'Obra guardada como plantilla exitosamente',
          plantilla_id: nuevaPlantillaId
        }
      } catch (error) {
        await connection.rollback()
        throw error
      }
    } catch (error) {
      console.error('Error al guardar obra como plantilla:', error)
      return {
        success: false,
        mensaje: 'Error al guardar obra como plantilla',
        error: error.message
      }
    } finally {
      if (connection) connection.release()
    }
  }
}


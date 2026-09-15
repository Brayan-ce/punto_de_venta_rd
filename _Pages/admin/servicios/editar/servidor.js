"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { validarServicio } from '../../core/construction/validaciones'
import { ESTADOS_SERVICIO, PRIORIDADES } from '../../core/construction/estados'

/**
 * Actualizar un servicio existente
 */
export async function actualizarServicio(id, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        await connection.beginTransaction()

        try {
            // Verificar que el servicio existe y pertenece a la empresa
            const [servicios] = await connection.query(
                'SELECT * FROM servicios WHERE id = ? AND empresa_id = ?',
                [id, empresaId]
            )
            
            if (servicios.length === 0) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'Servicio no encontrado' }
            }
            
            const servicioActual = servicios[0]

            // Combinar datos existentes con los nuevos para validación
            const datosCompletos = {
                servicio_plantilla_id: datos.servicio_plantilla_id !== undefined ? datos.servicio_plantilla_id : servicioActual.servicio_plantilla_id,
                fecha_inicio: datos.fecha_inicio !== undefined ? datos.fecha_inicio : servicioActual.fecha_inicio,
                fecha_fin_estimada: datos.fecha_fin_estimada !== undefined ? datos.fecha_fin_estimada : servicioActual.fecha_fin_estimada,
                presupuesto_asignado: datos.presupuesto_asignado !== undefined ? datos.presupuesto_asignado : servicioActual.presupuesto_asignado,
                ...datos
            }

            // Validar datos usando reglas del dominio
            const validacion = validarServicio(datosCompletos)
            if (!validacion.valido) {
                await connection.rollback()
                connection.release()
                return { 
                    success: false, 
                    mensaje: Object.values(validacion.errores)[0], 
                    errores: validacion.errores 
                }
            }

            // Si se proporciona una nueva plantilla, validar que existe y está activa
            if (datos.servicio_plantilla_id && datos.servicio_plantilla_id !== servicioActual.servicio_plantilla_id) {
                const [plantillas] = await connection.query(
                    'SELECT * FROM servicios_plantillas WHERE id = ? AND empresa_id = ? AND activa = 1',
                    [datos.servicio_plantilla_id, empresaId]
                )
                
                if (plantillas.length === 0) {
                    await connection.rollback()
                    connection.release()
                    return { success: false, mensaje: 'Plantilla no encontrada o inactiva' }
                }
            }

            // Si se cambia obra_id, heredar proyecto, zona y ubicación desde la obra
            let proyectoId = datos.proyecto_id !== undefined ? datos.proyecto_id : servicioActual.proyecto_id
            let zona = datos.zona !== undefined ? datos.zona : servicioActual.zona
            let ubicacion = datos.ubicacion !== undefined ? datos.ubicacion : servicioActual.ubicacion
            
            if (datos.obra_id !== undefined && datos.obra_id !== servicioActual.obra_id) {
                if (datos.obra_id) {
                    const [obras] = await connection.query(
                        'SELECT proyecto_id, zona, ubicacion FROM obras WHERE id = ? AND empresa_id = ?',
                        [datos.obra_id, empresaId]
                    )
                    
                    if (obras.length > 0) {
                        const obra = obras[0]
                        proyectoId = obra.proyecto_id || proyectoId
                        zona = obra.zona || zona
                        ubicacion = obra.ubicacion || ubicacion
                    }
                }
            }

            // Asegurar que ubicacion nunca sea null (requerido por la BD)
            if (!ubicacion) {
                ubicacion = servicioActual.ubicacion || 'Por definir'
            }

            // Calcular duración estimada en horas si se proporciona días desde la plantilla
            let duracionHoras = datos.duracion_estimada_horas !== undefined ? 
                datos.duracion_estimada_horas : servicioActual.duracion_estimada_horas

            // Si se cambió la plantilla, recalcular duración desde la nueva plantilla
            if (datos.servicio_plantilla_id && datos.servicio_plantilla_id !== servicioActual.servicio_plantilla_id) {
                const [plantillas] = await connection.query(
                    'SELECT duracion_estimada_dias FROM servicios_plantillas WHERE id = ?',
                    [datos.servicio_plantilla_id]
                )
                if (plantillas.length > 0 && plantillas[0].duracion_estimada_dias) {
                    duracionHoras = plantillas[0].duracion_estimada_dias * 8 // 8 horas por día
                }
            }

            // Actualizar servicio
            await connection.query(
                `UPDATE servicios SET
                    nombre = ?,
                    descripcion = ?,
                    notas_tecnicas = ?,
                    tipo_servicio = ?,
                    ubicacion = ?,
                    zona = ?,
                    costo_estimado = ?,
                    presupuesto_asignado = ?,
                    fecha_solicitud = ?,
                    fecha_programada = ?,
                    fecha_inicio = ?,
                    fecha_fin_estimada = ?,
                    duracion_estimada_horas = ?,
                    estado = ?,
                    prioridad = ?,
                    cliente_id = ?,
                    obra_id = ?,
                    proyecto_id = ?,
                    usuario_responsable_id = ?,
                    servicio_plantilla_id = ?
                WHERE id = ? AND empresa_id = ?`,
                [
                    datos.nombre !== undefined ? datos.nombre : servicioActual.nombre,
                    datos.descripcion !== undefined ? datos.descripcion : servicioActual.descripcion,
                    datos.notas_tecnicas !== undefined ? datos.notas_tecnicas : servicioActual.notas_tecnicas,
                    datos.tipo_servicio !== undefined ? datos.tipo_servicio : servicioActual.tipo_servicio,
                    ubicacion,
                    zona,
                    datos.costo_estimado !== undefined ? datos.costo_estimado : servicioActual.costo_estimado,
                    datos.presupuesto_asignado !== undefined ? datos.presupuesto_asignado : servicioActual.presupuesto_asignado,
                    datos.fecha_solicitud !== undefined ? datos.fecha_solicitud : servicioActual.fecha_solicitud,
                    datos.fecha_programada !== undefined ? datos.fecha_programada : servicioActual.fecha_programada,
                    datos.fecha_inicio !== undefined ? datos.fecha_inicio : servicioActual.fecha_inicio,
                    datos.fecha_fin_estimada !== undefined ? datos.fecha_fin_estimada : servicioActual.fecha_fin_estimada,
                    duracionHoras,
                    datos.estado !== undefined ? datos.estado : servicioActual.estado,
                    datos.prioridad !== undefined ? datos.prioridad : servicioActual.prioridad,
                    datos.cliente_id !== undefined ? datos.cliente_id : servicioActual.cliente_id,
                    datos.obra_id !== undefined ? datos.obra_id : servicioActual.obra_id,
                    proyectoId,
                    datos.responsable_id !== undefined ? datos.responsable_id : servicioActual.usuario_responsable_id,
                    datos.servicio_plantilla_id !== undefined ? datos.servicio_plantilla_id : servicioActual.servicio_plantilla_id,
                    id,
                    empresaId
                ]
            )
            
            // Registrar evento de actualización
            await connection.query(
                `INSERT INTO servicios_eventos (
                    servicio_id, empresa_id, tipo_evento, descripcion, usuario_id
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    id,
                    empresaId,
                    'ACTUALIZADO',
                    `Servicio actualizado: ${datos.nombre !== undefined ? datos.nombre : servicioActual.nombre}`,
                    userId
                ]
            )
            
            await connection.commit()
            connection.release()
            
            return { 
                success: true, 
                mensaje: 'Servicio actualizado exitosamente'
            }
        } catch (error) {
            await connection.rollback()
            throw error
        }
    } catch (error) {
        console.error('Error al actualizar servicio:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al actualizar servicio: ' + error.message }
    }
}


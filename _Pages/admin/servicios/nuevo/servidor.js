"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { validarServicio } from '../../core/construction/validaciones'
import { ESTADOS_SERVICIO, TIPOS_SERVICIO, PRIORIDADES, ESTADOS_OBRA, TIPOS_OBRA } from '../../core/construction/estados'

export async function crearServicio(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validar usando reglas del dominio
        const validacion = validarServicio(datos)
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
            // Obtener datos de la plantilla
            const [plantillas] = await connection.query(
                'SELECT * FROM servicios_plantillas WHERE id = ? AND empresa_id = ? AND activa = 1',
                [datos.servicio_plantilla_id, empresaId]
            )
            
            if (plantillas.length === 0) {
                await connection.rollback()
                connection.release()
                return { success: false, mensaje: 'Plantilla no encontrada o inactiva' }
            }
            
            const plantilla = plantillas[0]
            
            // Determinar obra_id y heredar datos si es necesario
            let obraId = datos.obra_id || null
            let proyectoId = datos.proyecto_id || null
            let zona = datos.zona || null
            let ubicacion = datos.ubicacion || null
            
            // Si hay obra_id, heredar proyecto, zona y ubicación desde la obra
            if (obraId) {
                const [obras] = await connection.query(
                    'SELECT proyecto_id, zona, ubicacion FROM obras WHERE id = ? AND empresa_id = ?',
                    [obraId, empresaId]
                )
                
                if (obras.length > 0) {
                    const obra = obras[0]
                    proyectoId = proyectoId || obra.proyecto_id
                    zona = zona || obra.zona
                    ubicacion = ubicacion || obra.ubicacion
                }
            } else {
                // Si no hay obra_id, auto-crear obra contenedora tipo SERVICIO
                obraId = await crearObraContenedora(connection, empresaId, userId, {
                    nombre: datos.nombre || plantilla.nombre,
                    ubicacion: ubicacion || 'Por definir',
                    zona: zona,
                    presupuesto_asignado: datos.presupuesto_asignado || plantilla.costo_base_estimado,
                    fecha_inicio: datos.fecha_inicio,
                    fecha_fin_estimada: datos.fecha_fin_estimada
                })
                
                // Consultar los datos de la obra recién creada para heredar ubicacion y zona
                const [obrasCreadas] = await connection.query(
                    'SELECT proyecto_id, zona, ubicacion FROM obras WHERE id = ? AND empresa_id = ?',
                    [obraId, empresaId]
                )
                
                if (obrasCreadas.length > 0) {
                    const obraCreada = obrasCreadas[0]
                    proyectoId = proyectoId || obraCreada.proyecto_id
                    zona = zona || obraCreada.zona
                    ubicacion = ubicacion || obraCreada.ubicacion
                }
            }
            
            // Asegurar que ubicacion nunca sea null (requerido por la BD)
            if (!ubicacion) {
                ubicacion = 'Por definir'
            }
            
            // Generar código único de servicio
            const [ultimoServicio] = await connection.query(
                'SELECT codigo_servicio FROM servicios WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
                [empresaId]
            )
            
            let numero = 1
            if (ultimoServicio.length > 0 && ultimoServicio[0].codigo_servicio) {
                const match = ultimoServicio[0].codigo_servicio.match(/\d+$/)
                if (match) numero = parseInt(match[0]) + 1
            }
            
            const codigoServicio = `SRV-${new Date().getFullYear()}-${String(numero).padStart(3, '0')}`
            
            // Calcular duración estimada en horas desde días
            const duracionHoras = plantilla.duracion_estimada_dias ? 
                plantilla.duracion_estimada_dias * 8 : // 8 horas por día
                datos.duracion_estimada_horas || null
            
            // Crear servicio
            const [result] = await connection.query(
                `INSERT INTO servicios (
                    empresa_id, codigo_servicio, nombre, descripcion, notas_tecnicas,
                    tipo_servicio, ubicacion, zona,
                    costo_estimado, presupuesto_asignado,
                    fecha_solicitud, fecha_programada, fecha_inicio, fecha_fin_estimada,
                    duracion_estimada_horas, estado, prioridad,
                    cliente_id, obra_id, proyecto_id, usuario_responsable_id,
                    servicio_plantilla_id, creado_por
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empresaId,
                    codigoServicio,
                    datos.nombre || plantilla.nombre,
                    datos.descripcion || plantilla.descripcion || null,
                    datos.notas_tecnicas || null,
                    plantilla.tipo_servicio,
                    ubicacion,
                    zona,
                    datos.costo_estimado || plantilla.costo_base_estimado,
                    datos.presupuesto_asignado || plantilla.costo_base_estimado,
                    datos.fecha_solicitud || new Date().toISOString().split('T')[0],
                    datos.fecha_programada || datos.fecha_inicio,
                    datos.fecha_inicio,
                    datos.fecha_fin_estimada,
                    duracionHoras,
                    ESTADOS_SERVICIO.PENDIENTE,
                    datos.prioridad || PRIORIDADES.MEDIA,
                    datos.cliente_id || null,
                    obraId,
                    proyectoId,
                    datos.responsable_id || null,
                    plantilla.id,
                    userId
                ]
            )
            
            const servicioId = result.insertId
            
            // Registrar evento inicial
            await connection.query(
                `INSERT INTO servicios_eventos (
                    servicio_id, empresa_id, tipo_evento, descripcion, usuario_id
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    servicioId,
                    empresaId,
                    'CREADO',
                    `Servicio creado desde plantilla: ${plantilla.nombre}`,
                    userId
                ]
            )
            
            await connection.commit()
            connection.release()
            
            return { 
                success: true, 
                mensaje: 'Servicio creado exitosamente', 
                id: servicioId,
                codigo: codigoServicio,
                obra_id: obraId
            }
        } catch (error) {
            await connection.rollback()
            throw error
        }
    } catch (error) {
        console.error('Error al crear servicio:', error)
        if (connection) {
            try {
                await connection.rollback()
            } catch (rollbackError) {
                console.error('Error en rollback:', rollbackError)
            }
            connection.release()
        }
        return { success: false, mensaje: 'Error al crear servicio: ' + error.message }
    }
}

/**
 * Crear una obra contenedora tipo SERVICIO automáticamente
 */
async function crearObraContenedora(connection, empresaId, usuarioId, datosServicio) {
    try {
        // Generar código de obra
        const [ultimaObra] = await connection.query(
            'SELECT codigo_obra FROM obras WHERE empresa_id = ? ORDER BY id DESC LIMIT 1',
            [empresaId]
        )
        
        let numero = 1
        if (ultimaObra.length > 0 && ultimaObra[0].codigo_obra) {
            const match = ultimaObra[0].codigo_obra.match(/\d+$/)
            if (match) numero = parseInt(match[0]) + 1
        }
        
        const codigoObra = `OB-SERV-${new Date().getFullYear()}-${String(numero).padStart(3, '0')}`
        
        // Crear obra tipo servicio
        const [result] = await connection.query(
            `INSERT INTO obras (
                empresa_id, codigo_obra, nombre, descripcion, tipo_obra,
                ubicacion, zona, presupuesto_aprobado,
                fecha_inicio, fecha_fin_estimada,
                estado, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                empresaId,
                codigoObra,
                `Obra contenedora: ${datosServicio.nombre || 'Servicio'}`,
                'Obra creada automáticamente para contener servicio',
                TIPOS_OBRA.SERVICIO || 'servicio',
                datosServicio.ubicacion,
                datosServicio.zona || null,
                datosServicio.presupuesto_asignado || 0,
                datosServicio.fecha_inicio,
                datosServicio.fecha_fin_estimada,
                ESTADOS_OBRA.ACTIVA,
                usuarioId
            ]
        )
        
        return result.insertId
    } catch (error) {
        console.error('Error al crear obra contenedora:', error)
        throw error
    }
}


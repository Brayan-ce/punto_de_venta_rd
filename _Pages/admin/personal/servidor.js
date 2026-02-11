"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { REGLAS_NEGOCIO, validarCantidadTrabajadores } from '../core/construction/reglas'
import { obtenerObras } from '../obras/servidor'

export async function obtenerTrabajadores(filtros = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        let query = `
            SELECT t.*,
                   COUNT(DISTINCT a.id) as asignaciones_activas
            FROM trabajadores_obra t
            LEFT JOIN asignaciones_trabajadores a ON t.id = a.trabajador_id 
                AND a.estado = 'activo' 
                AND a.fecha_asignacion = CURDATE()
            WHERE t.empresa_id = ?
        `
        const params = [empresaId]
        
        if (filtros.estado) {
            query += ' AND t.estado = ?'
            params.push(filtros.estado)
        }
        
        if (filtros.rol) {
            query += ' AND t.rol_especialidad = ?'
            params.push(filtros.rol)
        }
        
        if (filtros.busqueda) {
            query += ' AND (t.nombre LIKE ? OR t.apellidos LIKE ? OR t.numero_documento LIKE ?)'
            const busqueda = `%${filtros.busqueda}%`
            params.push(busqueda, busqueda, busqueda)
        }
        
        query += ' GROUP BY t.id ORDER BY t.nombre ASC'
        
        const [trabajadores] = await connection.query(query, params)
        connection.release()
        
        return { success: true, trabajadores }
    } catch (error) {
        console.error('Error al obtener trabajadores:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar trabajadores' }
    }
}

export async function obtenerPersonalEnCampo(fecha = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const fechaConsulta = fecha || new Date().toISOString().split('T')[0]
        connection = await db.getConnection()
        
        const [personal] = await connection.query(
            `SELECT a.*,
                    t.nombre,
                    t.apellidos,
                    t.rol_especialidad as rol,
                    t.tarifa_por_hora,
                    o.nombre as obra_nombre,
                    o.codigo_obra,
                    s.nombre as servicio_nombre
             FROM asignaciones_trabajadores a
             INNER JOIN trabajadores_obra t ON a.trabajador_id = t.id
             LEFT JOIN obras o ON a.tipo_destino = 'obra' AND a.destino_id = o.id
             LEFT JOIN servicios s ON a.tipo_destino = 'servicio' AND a.destino_id = s.id
             WHERE a.empresa_id = ? 
               AND a.fecha_asignacion = ?
               AND a.estado = 'activo'
             ORDER BY a.hora_inicio ASC`,
            [empresaId, fechaConsulta]
        )
        
        connection.release()
        
        return { success: true, personal }
    } catch (error) {
        console.error('Error al obtener personal en campo:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar personal en campo' }
    }
}

export async function crearTrabajador(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones básicas
        if (!datos.nombre || datos.nombre.trim() === '') {
            return { success: false, mensaje: 'El nombre es obligatorio' }
        }
        
        if (!datos.numero_documento || datos.numero_documento.trim() === '') {
            return { success: false, mensaje: 'El número de documento es obligatorio' }
        }
        
        if (!datos.rol_especialidad || datos.rol_especialidad.trim() === '') {
            return { success: false, mensaje: 'El rol/especialidad es obligatorio' }
        }

        connection = await db.getConnection()
        
        // Verificar si ya existe el documento
        const [existentes] = await connection.query(
            'SELECT id FROM trabajadores_obra WHERE numero_documento = ? AND empresa_id = ?',
            [datos.numero_documento, empresaId]
        )
        
        if (existentes.length > 0) {
            connection.release()
            return { success: false, mensaje: 'Ya existe un trabajador con este número de documento' }
        }
        
        const [result] = await connection.query(
            `INSERT INTO trabajadores_obra (
                empresa_id, nombre, apellidos, tipo_documento_id, numero_documento,
                telefono, email, rol_especialidad, tarifa_por_hora, tarifa_por_dia, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
            [
                empresaId,
                datos.nombre,
                datos.apellidos || null,
                datos.tipo_documento_id || 1, // Default tipo documento
                datos.numero_documento,
                datos.telefono || null,
                datos.email || null,
                datos.rol_especialidad,
                datos.tarifa_por_hora || null,
                datos.tarifa_por_dia || null
            ]
        )
        
        connection.release()
        
        return { success: true, mensaje: 'Trabajador creado exitosamente', id: result.insertId }
    } catch (error) {
        console.error('Error al crear trabajador:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al crear trabajador' }
    }
}

export async function asignarTrabajador(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        // Validaciones
        if (!datos.trabajador_id) {
            return { success: false, mensaje: 'Debe seleccionar un trabajador' }
        }
        
        if (!datos.tipo_destino || !['obra', 'servicio'].includes(datos.tipo_destino)) {
            return { success: false, mensaje: 'Tipo de destino inválido' }
        }
        
        if (!datos.destino_id) {
            return { success: false, mensaje: 'Debe seleccionar una obra o servicio' }
        }
        
        if (!datos.fecha_asignacion) {
            return { success: false, mensaje: 'La fecha de asignación es obligatoria' }
        }

        connection = await db.getConnection()
        
        // Verificar que el trabajador existe y está activo
        const [trabajador] = await connection.query(
            'SELECT id, tarifa_por_hora FROM trabajadores_obra WHERE id = ? AND empresa_id = ? AND estado = "activo"',
            [datos.trabajador_id, empresaId]
        )
        
        if (trabajador.length === 0) {
            connection.release()
            return { success: false, mensaje: 'Trabajador no encontrado o inactivo' }
        }
        
        // Verificar que no esté ya asignado el mismo día
        const [asignacionExistente] = await connection.query(
            `SELECT id FROM asignaciones_trabajadores 
             WHERE trabajador_id = ? 
               AND fecha_asignacion = ? 
               AND estado = 'activo'
               AND empresa_id = ?`,
            [datos.trabajador_id, datos.fecha_asignacion, empresaId]
        )
        
        if (asignacionExistente.length > 0) {
            connection.release()
            return { success: false, mensaje: 'El trabajador ya está asignado para esta fecha' }
        }
        
        const tarifaPorHora = trabajador[0].tarifa_por_hora || 0
        
        const [result] = await connection.query(
            `INSERT INTO asignaciones_trabajadores (
                empresa_id, trabajador_id, tipo_destino, destino_id,
                fecha_asignacion, hora_inicio, hora_fin, actividad, zona_trabajo,
                estado, creado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?)`,
            [
                empresaId,
                datos.trabajador_id,
                datos.tipo_destino,
                datos.destino_id,
                datos.fecha_asignacion,
                datos.hora_inicio || null,
                datos.hora_fin || null,
                datos.actividad || null,
                datos.zona_trabajo || null,
                userId
            ]
        )
        
        connection.release()
        
        return { success: true, mensaje: 'Trabajador asignado exitosamente', id: result.insertId }
    } catch (error) {
        console.error('Error al asignar trabajador:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al asignar trabajador' }
    }
}

export async function obtenerObrasYServicios() {
    const resObras = await obtenerObras({ estado: 'activa' })
    
    // TODO: Agregar servicios cuando se implemente ese módulo
    const servicios = []
    
    return {
        success: true,
        obras: resObras.success ? resObras.obras : [],
        servicios: servicios
    }
}

export async function obtenerTrabajadorPorId(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()
        
        const [trabajadores] = await connection.query(
            'SELECT * FROM trabajadores_obra WHERE id = ? AND empresa_id = ?',
            [id, empresaId]
        )
        
        connection.release()
        
        if (trabajadores.length === 0) {
            return { success: false, mensaje: 'Trabajador no encontrado' }
        }
        
        return { success: true, trabajador: trabajadores[0] }
    } catch (error) {
        console.error('Error al obtener trabajador:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar trabajador' }
    }
}

export async function obtenerEstadisticasPersonal() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value

        if (!empresaId) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        const fechaHoy = new Date().toISOString().split('T')[0]
        connection = await db.getConnection()
        
        // Total de trabajadores
        const [totalResult] = await connection.query(
            'SELECT COUNT(*) as total FROM trabajadores_obra WHERE empresa_id = ?',
            [empresaId]
        )
        
        // Personal activo hoy
        const [activosResult] = await connection.query(
            `SELECT COUNT(DISTINCT a.trabajador_id) as activos
             FROM asignaciones_trabajadores a
             WHERE a.empresa_id = ? 
               AND a.fecha_asignacion = ?
               AND a.estado = 'activo'`,
            [empresaId, fechaHoy]
        )
        
        // En obras
        const [obrasResult] = await connection.query(
            `SELECT COUNT(DISTINCT a.trabajador_id) as en_obras
             FROM asignaciones_trabajadores a
             WHERE a.empresa_id = ? 
               AND a.fecha_asignacion = ?
               AND a.tipo_destino = 'obra'
               AND a.estado = 'activo'`,
            [empresaId, fechaHoy]
        )
        
        // En servicios
        const [serviciosResult] = await connection.query(
            `SELECT COUNT(DISTINCT a.trabajador_id) as en_servicios
             FROM asignaciones_trabajadores a
             WHERE a.empresa_id = ? 
               AND a.fecha_asignacion = ?
               AND a.tipo_destino = 'servicio'
               AND a.estado = 'activo'`,
            [empresaId, fechaHoy]
        )
        
        // Disponibles (activos sin asignación hoy)
        const [disponiblesResult] = await connection.query(
            `SELECT COUNT(*) as disponibles
             FROM trabajadores_obra t
             WHERE t.empresa_id = ?
               AND t.estado = 'activo'
               AND NOT EXISTS (
                   SELECT 1 FROM asignaciones_trabajadores a
                   WHERE a.trabajador_id = t.id
                     AND a.fecha_asignacion = ?
                     AND a.estado = 'activo'
               )`,
            [empresaId, fechaHoy]
        )
        
        connection.release()
        
        return {
            success: true,
            data: {
                total_trabajadores: totalResult[0].total,
                activos: activosResult[0].activos,
                en_obras: obrasResult[0].en_obras,
                en_servicios: serviciosResult[0].en_servicios,
                disponibles: disponiblesResult[0].disponibles
            }
        }
    } catch (error) {
        console.error('Error al obtener estadísticas:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estadísticas' }
    }
}


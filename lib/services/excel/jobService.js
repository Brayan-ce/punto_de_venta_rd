/**
 * ============================================
 * SERVICIO DE JOBS PARA IMPORTACIÓN ASÍNCRONA
 * ============================================
 * 
 * Gestiona jobs de importación de productos
 * Permite procesamiento asíncrono y seguimiento de progreso
 */

import db from "@/_DB/db";
import { importarProductosDesdeExcel } from "./importarProductos";
import { leerArchivoTemporal, eliminarArchivoTemporal } from "./storageService";

/**
 * Estados de un job
 */
export const JOB_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

/**
 * Crea un nuevo job de importación
 * 
 * @param {string} fileId - ID del archivo temporal
 * @param {number} empresaId - ID de la empresa
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} - ID del job creado
 */
export async function crearJobImportacion(fileId, empresaId, usuarioId) {
    let connection;
    
    try {
        connection = await db.getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO importaciones_productos (
                empresa_id,
                usuario_id,
                file_id,
                estado,
                fecha_creacion
            ) VALUES (?, ?, ?, ?, NOW())`,
            [empresaId, usuarioId, fileId, JOB_STATUS.PENDING]
        );
        
        connection.release();
        return result.insertId;
        
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al crear job:', error);
        throw error;
    }
}

/**
 * Actualiza el estado de un job
 * 
 * @param {number} jobId - ID del job
 * @param {string} estado - Nuevo estado
 * @param {Object} resultado - Resultado del procesamiento (opcional)
 */
export async function actualizarJob(jobId, estado, resultado = null) {
    let connection;
    
    try {
        connection = await db.getConnection();
        
        const updates = ['estado = ?', 'fecha_actualizacion = NOW()'];
        const params = [estado];
        
        if (resultado) {
            updates.push('estadisticas = ?');
            updates.push('mensaje = ?');
            params.push(JSON.stringify(resultado.estadisticas || {}));
            params.push(resultado.mensaje || null);
            
            if (resultado.errores && resultado.errores.length > 0) {
                updates.push('errores = ?');
                params.push(JSON.stringify(resultado.errores));
            }
        }
        
        params.push(jobId);
        
        await connection.execute(
            `UPDATE importaciones_productos 
             SET ${updates.join(', ')}
             WHERE id = ?`,
            params
        );
        
        connection.release();
        
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al actualizar job:', error);
        throw error;
    }
}

/**
 * Procesa un job de importación
 * Esta función se ejecuta de forma asíncrona
 * 
 * @param {number} jobId - ID del job
 * @param {string} fileId - ID del archivo temporal
 * @param {number} empresaId - ID de la empresa
 * @param {number} usuarioId - ID del usuario
 */
export async function procesarJobImportacion(jobId, fileId, empresaId, usuarioId) {
    try {
        // Actualizar estado a procesando
        await actualizarJob(jobId, JOB_STATUS.PROCESSING);
        
        // Leer archivo temporal
        const buffer = await leerArchivoTemporal(fileId);
        
        // Callback para actualizar progreso durante el guardado
        const onProgresoGuardado = async (procesados, total, estadisticas) => {
            // Actualizar job con progreso intermedio
            await actualizarJob(jobId, JOB_STATUS.PROCESSING, {
                success: false, // Aún no terminó
                mensaje: `Guardando en base de datos: ${procesados} de ${total} productos...`,
                estadisticas: estadisticas
            });
        };
        
        // Procesar importación con callback de progreso
        const resultado = await importarProductosDesdeExcel(
            buffer,
            empresaId,
            usuarioId,
            onProgresoGuardado
        );
        
        // Actualizar job con resultado final
        await actualizarJob(
            jobId,
            resultado.success ? JOB_STATUS.COMPLETED : JOB_STATUS.FAILED,
            resultado
        );
        
        // Eliminar archivo temporal después de procesar
        await eliminarArchivoTemporal(fileId);
        
        return resultado;
        
    } catch (error) {
        console.error('Error al procesar job:', error);
        
        // Actualizar job como fallido
        await actualizarJob(jobId, JOB_STATUS.FAILED, {
            success: false,
            mensaje: `Error al procesar: ${error.message}`,
            estadisticas: {
                total: 0,
                procesados: 0,
                creados: 0,
                actualizados: 0,
                errores: 0
            },
            errores: []
        });
        
        // Intentar eliminar archivo temporal
        try {
            await eliminarArchivoTemporal(fileId);
        } catch (deleteError) {
            console.error('Error al eliminar archivo temporal:', deleteError);
        }
        
        throw error;
    }
}

/**
 * Obtiene el estado de un job
 * 
 * @param {number} jobId - ID del job
 * @param {number} empresaId - ID de la empresa (para seguridad)
 * @returns {Promise<Object|null>} - Estado del job o null si no existe
 */
export async function obtenerEstadoJob(jobId, empresaId) {
    let connection;
    
    try {
        connection = await db.getConnection();
        
        const [jobs] = await connection.execute(
            `SELECT 
                id,
                empresa_id,
                usuario_id,
                file_id,
                estado,
                estadisticas,
                mensaje,
                errores,
                fecha_creacion,
                fecha_actualizacion
             FROM importaciones_productos
             WHERE id = ? AND empresa_id = ?`,
            [jobId, empresaId]
        );
        
        connection.release();
        
        if (jobs.length === 0) {
            return null;
        }
        
        const job = jobs[0];
        
        // Función helper para parsear JSON (maneja tanto strings como objetos ya parseados)
        const parseJSON = (value) => {
            if (!value) return null;
            if (typeof value === 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    console.warn('Error al parsear JSON:', e);
                    return null;
                }
            }
            // Si ya es un objeto, retornarlo directamente
            return value;
        };
        
        return {
            id: job.id,
            estado: job.estado,
            estadisticas: parseJSON(job.estadisticas),
            mensaje: job.mensaje,
            errores: parseJSON(job.errores),
            fecha_creacion: job.fecha_creacion,
            fecha_actualizacion: job.fecha_actualizacion
        };
        
    } catch (error) {
        if (connection) connection.release();
        console.error('Error al obtener estado del job:', error);
        throw error;
    }
}


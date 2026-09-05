/**
 * ============================================
 * SERVICIO DE ALMACENAMIENTO TEMPORAL DE EXCEL
 * ============================================
 * 
 * Guarda archivos Excel temporalmente antes de procesarlos
 * Separando upload de procesamiento para evitar 413 y timeouts
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';

// Directorios para archivos Excel temporales
const EXCEL_TEMP_DIR_PRODUCTION = '/var/data/pdv_temp/excel';
const EXCEL_TEMP_DIR_DEVELOPMENT = path.join(process.cwd(), 'public', 'temp', 'excel');
const EXCEL_TEMP_DIR = isProduction ? EXCEL_TEMP_DIR_PRODUCTION : EXCEL_TEMP_DIR_DEVELOPMENT;

// Tiempo de expiración: 24 horas
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 horas en ms

/**
 * Asegura que el directorio temporal existe
 */
async function ensureTempDirExists() {
    try {
        await fs.mkdir(EXCEL_TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error al crear directorio temporal:', error);
        throw new Error('No se pudo crear el directorio temporal');
    }
}

/**
 * Genera un ID único para el archivo
 */
function generarFileId() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Guarda un archivo Excel temporalmente
 * 
 * @param {Buffer} buffer - Buffer del archivo Excel
 * @param {string} originalName - Nombre original del archivo
 * @param {number} empresaId - ID de la empresa
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<{fileId: string, filePath: string, expiresAt: number}>}
 */
export async function guardarArchivoTemporal(buffer, originalName, empresaId, usuarioId) {
    await ensureTempDirExists();
    
    // Validar tamaño (máximo 50MB para storage temporal)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (buffer.length > maxSize) {
        throw new Error('El archivo es demasiado grande (máximo 50MB)');
    }
    
    // Generar ID único
    const fileId = generarFileId();
    
    // Nombre del archivo
    const extension = path.extname(originalName) || '.xlsx';
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(EXCEL_TEMP_DIR, fileName);
    
    // Guardar archivo
    await fs.writeFile(filePath, buffer);
    
    // Fecha de expiración
    const expiresAt = Date.now() + EXPIRATION_TIME;
    
    return {
        fileId,
        filePath,
        fileName,
        expiresAt,
        size: buffer.length
    };
}

/**
 * Lee un archivo temporal por su ID
 * 
 * @param {string} fileId - ID del archivo
 * @returns {Promise<Buffer>} - Buffer del archivo
 */
export async function leerArchivoTemporal(fileId) {
    // Buscar archivo por ID (puede tener diferentes extensiones)
    const extensions = ['.xlsx', '.xls'];
    
    for (const ext of extensions) {
        const filePath = path.join(EXCEL_TEMP_DIR, `${fileId}${ext}`);
        try {
            const buffer = await fs.readFile(filePath);
            return buffer;
        } catch (error) {
            // Continuar buscando con otra extensión
            continue;
        }
    }
    
    throw new Error(`Archivo temporal no encontrado: ${fileId}`);
}

/**
 * Elimina un archivo temporal
 * 
 * @param {string} fileId - ID del archivo
 */
export async function eliminarArchivoTemporal(fileId) {
    const extensions = ['.xlsx', '.xls'];
    
    for (const ext of extensions) {
        const filePath = path.join(EXCEL_TEMP_DIR, `${fileId}${ext}`);
        try {
            await fs.unlink(filePath);
            return;
        } catch (error) {
            // Continuar intentando con otra extensión
            continue;
        }
    }
    
    // Si no se encontró, no es crítico (puede haber sido eliminado ya)
    console.warn(`No se pudo eliminar archivo temporal: ${fileId}`);
}

/**
 * Limpia archivos temporales expirados
 * Se puede ejecutar periódicamente como job
 */
export async function limpiarArchivosExpirados() {
    try {
        await ensureTempDirExists();
        const files = await fs.readdir(EXCEL_TEMP_DIR);
        const now = Date.now();
        let eliminados = 0;
        
        for (const file of files) {
            const filePath = path.join(EXCEL_TEMP_DIR, file);
            try {
                const stats = await fs.stat(filePath);
                // Eliminar archivos más antiguos de 24 horas
                if (now - stats.mtimeMs > EXPIRATION_TIME) {
                    await fs.unlink(filePath);
                    eliminados++;
                }
            } catch (error) {
                // Continuar con siguiente archivo
                continue;
            }
        }
        
        return { eliminados, total: files.length };
    } catch (error) {
        console.error('Error al limpiar archivos expirados:', error);
        return { eliminados: 0, total: 0 };
    }
}


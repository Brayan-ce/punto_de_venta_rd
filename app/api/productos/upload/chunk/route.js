/**
 * ============================================
 * API ROUTE: UPLOAD DE CHUNK (PARTE DEL ARCHIVO)
 * ============================================
 * 
 * POST /api/productos/upload/chunk
 * 
 * Sube una parte (chunk) de un archivo Excel
 * Los chunks se unen en el backend para formar el archivo completo
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

export const runtime = 'nodejs';
export const maxDuration = 60;

// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';
const CHUNKS_TEMP_DIR = isProduction 
    ? '/var/data/pdv_temp/excel/chunks'
    : path.join(process.cwd(), 'public', 'temp', 'excel', 'chunks');

// Tamaño máximo de cada chunk (5MB - seguro para nginx/Apache)
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Asegura que el directorio de chunks existe
 */
async function ensureChunksDirExists() {
    try {
        await fs.mkdir(CHUNKS_TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error al crear directorio de chunks:', error);
        throw new Error('No se pudo crear el directorio temporal');
    }
}

export async function POST(request) {
    try {
        // Verificar autenticación
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        const userTipo = cookieStore.get("userTipo")?.value;
        
        if (!userId || !empresaId) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "No autenticado"
                },
                { status: 401 }
            );
        }
        
        // Solo admin puede importar
        if (userTipo !== "admin") {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "No tienes permisos para importar productos"
                },
                { status: 403 }
            );
        }
        
        // Obtener datos del chunk
        const formData = await request.formData();
        const chunk = formData.get("chunk");
        const chunkIndex = parseInt(formData.get("chunkIndex"));
        const totalChunks = parseInt(formData.get("totalChunks"));
        const fileId = formData.get("fileId");
        const fileName = formData.get("fileName");
        const fileSize = parseInt(formData.get("fileSize"));
        
        if (!chunk || chunkIndex === undefined || totalChunks === undefined || !fileId || !fileName) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "Datos del chunk incompletos"
                },
                { status: 400 }
            );
        }
        
        // Validar tamaño del chunk
        const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
        if (chunkBuffer.length > CHUNK_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: `Chunk demasiado grande (máximo ${CHUNK_SIZE / 1024 / 1024}MB)`
                },
                { status: 400 }
            );
        }
        
        await ensureChunksDirExists();
        
        // Guardar chunk en archivo temporal
        const chunkFileName = `${fileId}_chunk_${chunkIndex}`;
        const chunkFilePath = path.join(CHUNKS_TEMP_DIR, chunkFileName);
        await fs.writeFile(chunkFilePath, chunkBuffer);
        
        // Si es el último chunk, unir todos los chunks
        if (chunkIndex === totalChunks - 1) {
            const { guardarArchivoTemporal } = await import("@/lib/services/excel/storageService");
            
            // Verificar que todos los chunks existen antes de unir
            const chunks = [];
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(CHUNKS_TEMP_DIR, `${fileId}_chunk_${i}`);
                try {
                    const chunkData = await fs.readFile(chunkPath);
                    chunks.push(chunkData);
                } catch (error) {
                    // Si falta un chunk, limpiar y retornar error
                    for (let j = 0; j < i; j++) {
                        try {
                            await fs.unlink(path.join(CHUNKS_TEMP_DIR, `${fileId}_chunk_${j}`));
                        } catch (e) {
                            // Ignorar errores de limpieza
                        }
                    }
                    return NextResponse.json(
                        {
                            success: false,
                            mensaje: `Chunk ${i} no encontrado. La subida puede haber fallado.`
                        },
                        { status: 400 }
                    );
                }
            }
            
            // Unir todos los chunks
            const fullBuffer = Buffer.concat(chunks);
            
            // Validar tamaño total (debe coincidir con fileSize)
            if (fullBuffer.length !== fileSize) {
                // Limpiar chunks
                for (let i = 0; i < totalChunks; i++) {
                    try {
                        await fs.unlink(path.join(CHUNKS_TEMP_DIR, `${fileId}_chunk_${i}`));
                    } catch (e) {
                        // Ignorar errores de limpieza
                    }
                }
                
                return NextResponse.json(
                    {
                        success: false,
                        mensaje: `El tamaño del archivo reconstruido no coincide. Esperado: ${fileSize}, Obtenido: ${fullBuffer.length}`
                    },
                    { status: 400 }
                );
            }
            
            // Validar tamaño máximo
            const maxSize = 100 * 1024 * 1024; // 100MB máximo
            if (fullBuffer.length > maxSize) {
                // Limpiar chunks
                for (let i = 0; i < totalChunks; i++) {
                    try {
                        await fs.unlink(path.join(CHUNKS_TEMP_DIR, `${fileId}_chunk_${i}`));
                    } catch (e) {
                        // Ignorar errores de limpieza
                    }
                }
                
                return NextResponse.json(
                    {
                        success: false,
                        mensaje: `El archivo completo es demasiado grande (máximo ${maxSize / 1024 / 1024}MB)`
                    },
                    { status: 400 }
                );
            }
            
            // Guardar archivo completo
            const { fileId: finalFileId, expiresAt, size } = await guardarArchivoTemporal(
                fullBuffer,
                fileName,
                parseInt(empresaId),
                parseInt(userId)
            );
            
            // Limpiar chunks
            for (let i = 0; i < totalChunks; i++) {
                try {
                    await fs.unlink(path.join(CHUNKS_TEMP_DIR, `${fileId}_chunk_${i}`));
                } catch (e) {
                    // Ignorar errores de limpieza
                }
            }
            
            return NextResponse.json({
                success: true,
                fileId: finalFileId,
                fileName,
                size,
                expiresAt,
                mensaje: "Archivo subido correctamente. Ahora puedes procesarlo.",
                isComplete: true
            }, { status: 200 });
        }
        
        // Chunk intermedio, retornar éxito para continuar
        return NextResponse.json({
            success: true,
            chunkIndex,
            totalChunks,
            mensaje: `Chunk ${chunkIndex + 1} de ${totalChunks} subido correctamente`,
            isComplete: false
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error en API de upload chunk:", error);
        
        return NextResponse.json(
            {
                success: false,
                mensaje: `Error al subir chunk: ${error.message}`
            },
            { status: 500 }
        );
    }
}


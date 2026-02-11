/**
 * ============================================
 * API ROUTE: PROCESAR ARCHIVO EXCEL SUBIDO
 * ============================================
 * 
 * POST /api/productos/procesar
 * 
 * Procesa un archivo Excel previamente subido
 * Crea un job asíncrono para procesamiento
 * 
 * Body: { fileId: string }
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { crearJobImportacion, procesarJobImportacion } from "@/lib/services/excel/jobService";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos (para procesamiento)

export async function POST(request) {
    let connection;
    
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
        
        // Obtener fileId del body
        const body = await request.json();
        const { fileId } = body;
        
        if (!fileId) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "fileId es requerido"
                },
                { status: 400 }
            );
        }
        
        // Crear job de importación
        const jobId = await crearJobImportacion(
            fileId,
            parseInt(empresaId),
            parseInt(userId)
        );
        
        // Procesar job de forma asíncrona (no esperar)
        // En producción, esto debería ir a una cola de jobs (Bull, Agenda, etc.)
        // Por ahora, lo procesamos en background sin bloquear la respuesta
        procesarJobImportacion(
            jobId,
            fileId,
            parseInt(empresaId),
            parseInt(userId)
        ).catch(error => {
            console.error('Error en procesamiento asíncrono:', error);
        });
        
        // Retornar inmediatamente con jobId
        return NextResponse.json({
            success: true,
            jobId,
            mensaje: "Importación iniciada. El procesamiento se está realizando en segundo plano.",
            estado: "processing"
        }, { status: 202 }); // 202 Accepted = procesamiento asíncrono
        
    } catch (error) {
        console.error("Error en API de procesamiento:", error);
        
        return NextResponse.json(
            {
                success: false,
                mensaje: `Error al iniciar el procesamiento: ${error.message}`
            },
            { status: 500 }
        );
    }
}


/**
 * ============================================
 * API ROUTE: UPLOAD DE ARCHIVO EXCEL (SIN PROCESAR)
 * ============================================
 * 
 * POST /api/productos/upload
 * 
 * Solo guarda el archivo Excel temporalmente
 * NO procesa el archivo (evita 413 y timeouts)
 * 
 * Retorna fileId para procesar después
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { guardarArchivoTemporal } from "@/lib/services/excel/storageService";

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minuto máximo (solo upload, no procesamiento)

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
        
        // Obtener archivo del FormData
        const formData = await request.formData();
        const file = formData.get("file");
        
        if (!file) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "No se proporcionó ningún archivo"
                },
                { status: 400 }
            );
        }
        
        // Validar tipo de archivo
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "El archivo debe ser Excel (.xlsx o .xls)"
                },
                { status: 400 }
            );
        }
        
        // Validar tamaño (máximo 50MB para storage temporal)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "El archivo es demasiado grande (máximo 50MB). Por favor, divide el archivo en partes más pequeñas o comprime el Excel."
                },
                { status: 400 }
            );
        }
        
        // Convertir a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Guardar archivo temporalmente
        const { fileId, expiresAt, size } = await guardarArchivoTemporal(
            buffer,
            file.name,
            parseInt(empresaId),
            parseInt(userId)
        );
        
        // Retornar fileId para procesar después
        return NextResponse.json({
            success: true,
            fileId,
            fileName: file.name,
            size,
            expiresAt,
            mensaje: "Archivo subido correctamente. Ahora puedes procesarlo."
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error en API de upload:", error);
        
        // Detectar error 413
        if (error.message && (error.message.includes('413') || error.message.includes('too large'))) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "El archivo es demasiado grande. El límite máximo es de 50MB. Por favor, divide el archivo en partes más pequeñas o comprime el Excel."
                },
                { status: 413 }
            );
        }
        
        return NextResponse.json(
            {
                success: false,
                mensaje: `Error al subir el archivo: ${error.message}`
            },
            { status: 500 }
        );
    }
}


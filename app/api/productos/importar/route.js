/**
 * ============================================
 * API ROUTE: IMPORTAR PRODUCTOS DESDE EXCEL
 * ============================================
 * 
 * POST /api/productos/importar
 * 
 * Recibe un archivo Excel y lo procesa para importar productos
 * con sus respectivos movimientos de inventario.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { importarProductosDesdeExcel } from "@/lib/services/excel/importarProductos";

// Configurar runtime y límites para esta ruta
export const runtime = 'nodejs'; // Usar Node.js runtime para manejar archivos grandes
export const maxDuration = 300; // 5 minutos máximo para procesar

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
        
        // Validar tamaño (máximo 20MB para archivos Excel grandes)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "El archivo es demasiado grande (máximo 20MB). Por favor, divide el archivo en partes más pequeñas o comprime el Excel."
                },
                { status: 400 }
            );
        }
        
        // Convertir a buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Procesar importación
        const resultado = await importarProductosDesdeExcel(
            buffer,
            parseInt(empresaId),
            parseInt(userId)
        );
        
        // Retornar resultado
        if (resultado.success) {
            return NextResponse.json(resultado, { status: 200 });
        } else {
            return NextResponse.json(resultado, { status: 400 });
        }
        
    } catch (error) {
        console.error("Error en API de importación:", error);
        
        // Detectar error 413 (Request Entity Too Large)
        if (error.message && error.message.includes('413') || error.message && error.message.includes('too large')) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "El archivo es demasiado grande. El límite máximo es de 20MB. Por favor, divide el archivo en partes más pequeñas o comprime el Excel.",
                    estadisticas: {
                        total: 0,
                        procesados: 0,
                        creados: 0,
                        actualizados: 0,
                        errores: 0
                    },
                    errores: []
                },
                { status: 413 }
            );
        }
        
        return NextResponse.json(
            {
                success: false,
                mensaje: `Error al procesar la importación: ${error.message}`,
                estadisticas: {
                    total: 0,
                    procesados: 0,
                    creados: 0,
                    actualizados: 0,
                    errores: 0
                },
                errores: []
            },
            { status: 500 }
        );
    }
}


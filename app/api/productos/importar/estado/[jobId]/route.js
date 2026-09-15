/**
 * ============================================
 * API ROUTE: ESTADO DE IMPORTACIÓN
 * ============================================
 * 
 * GET /api/productos/importar/estado/[jobId]
 * 
 * Obtiene el estado actual de un job de importación
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { obtenerEstadoJob } from "@/lib/services/excel/jobService";

export const runtime = 'nodejs';

export async function GET(request, { params }) {
    try {
        // Verificar autenticación
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;
        const empresaId = cookieStore.get("empresaId")?.value;
        
        if (!userId || !empresaId) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "No autenticado"
                },
                { status: 401 }
            );
        }
        
        // En Next.js 16, params es una Promise y debe ser await
        const resolvedParams = await params;
        const jobId = parseInt(resolvedParams.jobId);
        
        if (!jobId || isNaN(jobId)) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "jobId inválido"
                },
                { status: 400 }
            );
        }
        
        // Obtener estado del job
        const estado = await obtenerEstadoJob(jobId, parseInt(empresaId));
        
        if (!estado) {
            return NextResponse.json(
                {
                    success: false,
                    mensaje: "Job no encontrado"
                },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            ...estado
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error al obtener estado del job:", error);
        
        return NextResponse.json(
            {
                success: false,
                mensaje: `Error al obtener estado: ${error.message}`
            },
            { status: 500 }
        );
    }
}


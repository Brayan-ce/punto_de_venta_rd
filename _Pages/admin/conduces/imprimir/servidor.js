"use server"

import { obtenerDetalleConduce } from "../ver/servidor"

/**
 * =====================================================
 * IMPRIMIR/SERVIDOR.JS - GENERAR IMPRESIÓN DE CONDUCE
 * =====================================================
 * 
 * Nota: Por ahora reutiliza obtenerDetalleConduce.
 * En el futuro aquí se puede agregar generación de PDF.
 */

export async function obtenerDatosImpresion(id) {
    // Reutilizamos la función de ver para obtener los datos
    return await obtenerDetalleConduce(id)
}


"use server"

import { crearTransferencia, obtenerOpcionesTransferencia, obtenerProductosPorSucursal } from '../servidor'

export async function obtenerOpciones() {
    return await obtenerOpcionesTransferencia()
}

export async function obtenerProductosOrigen(sucursalId) {
    return await obtenerProductosPorSucursal(sucursalId)
}

export async function guardarTransferencia(payload) {
    return await crearTransferencia(payload)
}

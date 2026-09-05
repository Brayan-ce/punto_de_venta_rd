"use server"

import {
    actualizarTransferencia,
    obtenerOpcionesTransferencia,
    obtenerProductosPorSucursal,
    obtenerTransferenciaPorId
} from '../servidor'

export async function obtenerTransferencia(id) {
    return await obtenerTransferenciaPorId(id)
}

export async function obtenerOpciones() {
    return await obtenerOpcionesTransferencia()
}

export async function obtenerProductosOrigen(sucursalId) {
    return await obtenerProductosPorSucursal(sucursalId)
}

export async function guardarCambios(id, payload) {
    return await actualizarTransferencia(id, payload)
}

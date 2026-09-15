"use server"

import { actualizarProductoSucursal, obtenerOpcionesSucursalesProducto, obtenerProductoSucursalPorId } from '../servidor'

export async function obtenerProducto(id) {
    return await obtenerProductoSucursalPorId(id)
}

export async function actualizarProducto(id, datos) {
    return await actualizarProductoSucursal(id, datos)
}

export async function obtenerOpcionesFormularioProducto() {
    return await obtenerOpcionesSucursalesProducto()
}

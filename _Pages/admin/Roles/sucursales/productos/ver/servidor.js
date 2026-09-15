"use server"

import { obtenerProductoSucursalPorId } from '../servidor'

export async function obtenerProducto(id) {
    return await obtenerProductoSucursalPorId(id)
}

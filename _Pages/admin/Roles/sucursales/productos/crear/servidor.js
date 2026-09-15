"use server"

import { crearProductoSucursal, obtenerOpcionesSucursalesProducto } from '../servidor'

export async function crearProducto(datos) {
    return await crearProductoSucursal(datos)
}

export async function obtenerOpcionesFormularioProducto() {
    return await obtenerOpcionesSucursalesProducto()
}

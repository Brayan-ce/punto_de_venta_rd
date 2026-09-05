"use server"

import { eliminarAcceso, obtenerAccesoPorId } from '../servidor'

export async function obtenerAcceso(id) {
    return await obtenerAccesoPorId(id)
}

export async function eliminarAccesoPorId(accesoId) {
    return await eliminarAcceso({ accesoId })
}

"use server"

import { obtenerTransferenciaPorId } from '../servidor'

export async function obtenerTransferencia(id) {
    return await obtenerTransferenciaPorId(id)
}

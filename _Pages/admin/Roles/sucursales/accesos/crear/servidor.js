"use server"

import { guardarSucursal, obtenerDatosSucursales } from '../../sedes/servidor'

export async function obtenerOpcionesCreacionSucursal() {
    const res = await obtenerDatosSucursales({})
    if (!res.success) return res

    const monedas = res.monedas || []
    const monedaPorDefecto = monedas.find((m) => String(m.codigo || '').toUpperCase() === 'DOP')

    return {
        success: true,
        usuarios: res.usuarios || [],
        monedas,
        monedaPorDefectoId: monedaPorDefecto?.id || ''
    }
}

export async function crearSucursalDesdeAccesos(payload = {}) {
    return await guardarSucursal(payload)
}

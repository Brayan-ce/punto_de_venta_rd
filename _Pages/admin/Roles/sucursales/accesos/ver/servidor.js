"use server"

import { obtenerDatosSucursales } from '../../sedes/servidor'
import { obtenerDatosAccesos } from '../servidor'
import { obtenerCredencialesEditable } from '../editar/servidor'
import { regenerarPasswordUsuarioSucursal } from '../../sedes/servidor'

export async function obtenerDetalleSucursal(id) {
    const sucursalId = Number(id)
    if (!sucursalId) return { success: false, mensaje: 'Sucursal invalida' }

    const datosSucursales = await obtenerDatosSucursales({})
    if (!datosSucursales.success) return datosSucursales

    const sucursal = (datosSucursales.sucursales || []).find((s) => Number(s.id) === sucursalId)
    if (!sucursal) return { success: false, mensaje: 'No tienes permiso para ver esta sucursal' }

    const datosAccesos = await obtenerDatosAccesos({ sucursalId })
    if (!datosAccesos.success) return datosAccesos

    const credenciales = await obtenerCredencialesEditable(sucursalId)

    return {
        success: true,
        sucursal,
        accesos: datosAccesos.accesos || [],
        usuarioPos: credenciales.success ? credenciales.usuarioPos : null
    }
}

export async function regenerarPasswordDesdeAccesos(sucursalId) {
    return await regenerarPasswordUsuarioSucursal({ sucursalId: Number(sucursalId) })
}

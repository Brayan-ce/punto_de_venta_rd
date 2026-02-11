"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerConfiguracion() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver la configuracion'
            }
        }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT * FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresas.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        connection.release()

        return {
            success: true,
            empresa: empresas[0]
        }

    } catch (error) {
        console.error('Error al obtener configuracion:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar configuracion'
        }
    }
}

export async function actualizarEmpresa(datosEmpresa) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar la configuracion'
            }
        }

        connection = await db.getConnection()

        const [empresaExiste] = await connection.execute(
            `SELECT id FROM empresas WHERE id = ?`,
            [empresaId]
        )

        if (empresaExiste.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Empresa no encontrada'
            }
        }

        const paisId = datosEmpresa.pais_id ? parseInt(datosEmpresa.pais_id) : null
        const regionId = datosEmpresa.region_id ? parseInt(datosEmpresa.region_id) : null
        const locale = datosEmpresa.locale?.trim() || null

        await connection.execute(
            `UPDATE empresas SET
                nombre_empresa = ?,
                rnc = ?,
                razon_social = ?,
                nombre_comercial = ?,
                actividad_economica = ?,
                direccion = ?,
                sector = ?,
                municipio = ?,
                provincia = ?,
                pais_id = ?,
                region_id = ?,
                telefono = ?,
                email = ?,
                moneda = ?,
                simbolo_moneda = ?,
                locale = ?,
                impuesto_nombre = ?,
                impuesto_porcentaje = ?,
                mensaje_factura = ?
            WHERE id = ?`,
            [
                datosEmpresa.nombre_empresa.trim(),
                datosEmpresa.rnc.trim(),
                datosEmpresa.razon_social.trim(),
                datosEmpresa.nombre_comercial?.trim() || null,
                datosEmpresa.actividad_economica?.trim() || null,
                datosEmpresa.direccion?.trim() || null,
                datosEmpresa.sector?.trim() || null,
                datosEmpresa.municipio?.trim() || null,
                datosEmpresa.provincia?.trim() || null,
                Number.isNaN(paisId) ? null : paisId,
                Number.isNaN(regionId) ? null : regionId,
                datosEmpresa.telefono?.trim() || null,
                datosEmpresa.email?.trim() || null,
                datosEmpresa.moneda || 'DOP',
                datosEmpresa.simbolo_moneda || 'RD$',
                locale,
                datosEmpresa.impuesto_nombre?.trim() || 'ITBIS',
                datosEmpresa.impuesto_porcentaje !== undefined && datosEmpresa.impuesto_porcentaje !== null && datosEmpresa.impuesto_porcentaje !== '' ? parseFloat(datosEmpresa.impuesto_porcentaje) : 0.00,
                datosEmpresa.mensaje_factura?.trim() || null,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Configuracion actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar empresa:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la configuracion'
        }
    }
}

export async function obtenerMonedas() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [monedas] = await connection.execute(
            `SELECT * FROM monedas ORDER BY activo DESC, nombre ASC`
        )

        connection.release()

        return {
            success: true,
            monedas: monedas
        }

    } catch (error) {
        console.error('Error al obtener monedas:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar monedas',
            monedas: []
        }
    }
}

export async function obtenerPaises() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver paises'
            }
        }

        connection = await db.getConnection()

        const [paises] = await connection.execute(
            `SELECT id, codigo_iso2, nombre, moneda_principal_codigo, locale_default, activo
             FROM paises
             WHERE activo = TRUE
             ORDER BY nombre ASC`
        )

        connection.release()

        return {
            success: true,
            paises
        }
    } catch (error) {
        console.error('Error al obtener paises:', error)
        if (connection) {
            connection.release()
        }
        return {
            success: false,
            mensaje: 'Error al cargar paises',
            paises: []
        }
    }
}

export async function obtenerRegiones(paisId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver regiones'
            }
        }

        if (!paisId) {
            return { success: true, regiones: [] }
        }

        connection = await db.getConnection()

        const [regiones] = await connection.execute(
            `SELECT id, nombre, codigo, tipo
             FROM regiones
             WHERE pais_id = ? AND activo = TRUE
             ORDER BY nombre ASC`,
            [paisId]
        )

        connection.release()

        return {
            success: true,
            regiones
        }
    } catch (error) {
        console.error('Error al obtener regiones:', error)
        if (connection) {
            connection.release()
        }
        return {
            success: false,
            mensaje: 'Error al cargar regiones',
            regiones: []
        }
    }
}

export async function obtenerMonedasPorPais(paisId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver monedas'
            }
        }

        if (!paisId) {
            return { success: true, monedas: [] }
        }

        connection = await db.getConnection()

        const [monedas] = await connection.execute(
            `SELECT m.id, m.codigo, m.nombre, m.simbolo, m.activo, pm.es_principal
             FROM paises_monedas pm
             INNER JOIN monedas m ON m.codigo = pm.moneda_codigo
             WHERE pm.pais_id = ?
             ORDER BY pm.es_principal DESC, m.nombre ASC`,
            [paisId]
        )

        connection.release()

        return {
            success: true,
            monedas
        }
    } catch (error) {
        console.error('Error al obtener monedas por pais:', error)
        if (connection) {
            connection.release()
        }
        return {
            success: false,
            mensaje: 'Error al cargar monedas',
            monedas: []
        }
    }
}

export async function crearMoneda(datosMoneda) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear monedas'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM monedas WHERE codigo = ?`,
            [datosMoneda.codigo.toUpperCase()]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de moneda ya existe'
            }
        }

        await connection.execute(
            `INSERT INTO monedas (codigo, nombre, simbolo, activo) VALUES (?, ?, ?, ?)`,
            [
                datosMoneda.codigo.toUpperCase().trim(),
                datosMoneda.nombre.trim(),
                datosMoneda.simbolo.trim(),
                datosMoneda.activo
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la moneda'
        }
    }
}

export async function actualizarMoneda(id, datosMoneda) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar monedas'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM monedas WHERE codigo = ? AND id != ?`,
            [datosMoneda.codigo.toUpperCase(), id]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de moneda ya existe'
            }
        }

        await connection.execute(
            `UPDATE monedas SET codigo = ?, nombre = ?, simbolo = ?, activo = ? WHERE id = ?`,
            [
                datosMoneda.codigo.toUpperCase().trim(),
                datosMoneda.nombre.trim(),
                datosMoneda.simbolo.trim(),
                datosMoneda.activo,
                id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la moneda'
        }
    }
}

export async function eliminarMoneda(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar monedas'
            }
        }

        connection = await db.getConnection()

        const [enUso] = await connection.execute(
            `SELECT id FROM empresas WHERE moneda = (SELECT codigo FROM monedas WHERE id = ?)`,
            [id]
        )

        if (enUso.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar, la moneda esta en uso'
            }
        }

        await connection.execute(
            `DELETE FROM monedas WHERE id = ?`,
            [id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Moneda eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar moneda:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la moneda'
        }
    }
}

export async function obtenerUnidadesMedida() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [unidades] = await connection.execute(
            `SELECT * FROM unidades_medida ORDER BY activo DESC, nombre ASC`
        )

        connection.release()

        return {
            success: true,
            unidades: unidades
        }

    } catch (error) {
        console.error('Error al obtener unidades:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar unidades',
            unidades: []
        }
    }
}

export async function crearUnidadMedida(datosUnidad) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para crear unidades'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ?`,
            [datosUnidad.codigo.toUpperCase()]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de unidad ya existe'
            }
        }

        await connection.execute(
            `INSERT INTO unidades_medida (codigo, nombre, abreviatura, activo) VALUES (?, ?, ?, ?)`,
            [
                datosUnidad.codigo.toUpperCase().trim(),
                datosUnidad.nombre.trim(),
                datosUnidad.abreviatura.trim(),
                datosUnidad.activo
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad creada exitosamente'
        }

    } catch (error) {
        console.error('Error al crear unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear la unidad'
        }
    }
}

export async function actualizarUnidadMedida(id, datosUnidad) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para actualizar unidades'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ? AND id != ?`,
            [datosUnidad.codigo.toUpperCase(), id]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de unidad ya existe'
            }
        }

        await connection.execute(
            `UPDATE unidades_medida SET codigo = ?, nombre = ?, abreviatura = ?, activo = ? WHERE id = ?`,
            [
                datosUnidad.codigo.toUpperCase().trim(),
                datosUnidad.nombre.trim(),
                datosUnidad.abreviatura.trim(),
                datosUnidad.activo,
                id
            ]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad actualizada exitosamente'
        }

    } catch (error) {
        console.error('Error al actualizar unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al actualizar la unidad'
        }
    }
}

export async function eliminarUnidadMedida(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar unidades'
            }
        }

        connection = await db.getConnection()

        const [enUso] = await connection.execute(
            `SELECT id FROM productos WHERE unidad_medida_id = ?`,
            [id]
        )

        if (enUso.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar, la unidad esta en uso'
            }
        }

        await connection.execute(
            `DELETE FROM unidades_medida WHERE id = ?`,
            [id]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Unidad eliminada exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar unidad:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar la unidad'
        }
    }
}

// ============================================
// FUNCIONES DE CONVERSIONES (FASE 3.1)
// ============================================

export async function obtenerConversiones() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para ver conversiones'
            }
        }

        connection = await db.getConnection()

        const [conversiones] = await connection.execute(
            `SELECT 
                c.id,
                c.unidad_origen_id,
                c.unidad_destino_id,
                c.factor,
                c.activo,
                c.empresa_id,
                uo.nombre as unidad_origen_nombre,
                uo.abreviatura as unidad_origen_abrev,
                uo.codigo as unidad_origen_codigo,
                ud.nombre as unidad_destino_nombre,
                ud.abreviatura as unidad_destino_abrev,
                ud.codigo as unidad_destino_codigo
            FROM conversiones_unidad c
            INNER JOIN unidades_medida uo ON c.unidad_origen_id = uo.id
            INNER JOIN unidades_medida ud ON c.unidad_destino_id = ud.id
            WHERE (c.empresa_id = ? OR c.empresa_id IS NULL)
            ORDER BY c.empresa_id DESC, uo.nombre, ud.nombre`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            conversiones
        }
    } catch (error) {
        console.error('Error al obtener conversiones:', error)
        if (connection) connection.release()
        return { success: false, conversiones: [], mensaje: 'Error al cargar conversiones' }
    }
}

export async function crearConversion(datosConversion) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos'
            }
        }

        if (!datosConversion.unidad_origen_id || !datosConversion.unidad_destino_id || !datosConversion.factor) {
            return {
                success: false,
                mensaje: 'Datos incompletos'
            }
        }

        if (datosConversion.unidad_origen_id === datosConversion.unidad_destino_id) {
            return {
                success: false,
                mensaje: 'Las unidades origen y destino no pueden ser iguales'
            }
        }

        connection = await db.getConnection()

        // Verificar si ya existe
        const [existe] = await connection.execute(
            `SELECT id FROM conversiones_unidad 
            WHERE unidad_origen_id = ? 
            AND unidad_destino_id = ? 
            AND (empresa_id = ? OR empresa_id IS NULL)`,
            [datosConversion.unidad_origen_id, datosConversion.unidad_destino_id, empresaId]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Ya existe una conversión entre estas unidades'
            }
        }

        await connection.execute(
            `INSERT INTO conversiones_unidad (empresa_id, unidad_origen_id, unidad_destino_id, factor, activo)
            VALUES (?, ?, ?, ?, ?)`,
            [
                datosConversion.empresa_id || null,
                datosConversion.unidad_origen_id,
                datosConversion.unidad_destino_id,
                parseFloat(datosConversion.factor),
                datosConversion.activo !== undefined ? datosConversion.activo : true
            ]
        )

        connection.release()

        // Invalidar cache del grafo
        try {
            const { invalidarCache } = await import('@/utils/unidadesGrafoCache')
            invalidarCache()
        } catch (e) {
            console.warn('No se pudo invalidar cache:', e)
        }

        return {
            success: true,
            mensaje: 'Conversión creada exitosamente'
        }
    } catch (error) {
        console.error('Error al crear conversión:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al crear conversión' }
    }
}

export async function actualizarConversion(id, datosConversion) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE conversiones_unidad 
            SET factor = ?, activo = ?
            WHERE id = ?`,
            [
                parseFloat(datosConversion.factor),
                datosConversion.activo !== undefined ? datosConversion.activo : true,
                id
            ]
        )

        connection.release()

        // Invalidar cache del grafo
        try {
            const { invalidarCache } = await import('@/utils/unidadesGrafoCache')
            invalidarCache()
        } catch (e) {
            console.warn('No se pudo invalidar cache:', e)
        }

        return {
            success: true,
            mensaje: 'Conversión actualizada exitosamente'
        }
    } catch (error) {
        console.error('Error al actualizar conversión:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar conversión' }
    }
}

export async function eliminarConversion(id) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos'
            }
        }

        connection = await db.getConnection()

        await connection.execute(
            `DELETE FROM conversiones_unidad WHERE id = ?`,
            [id]
        )

        connection.release()

        // Invalidar cache del grafo
        try {
            const { invalidarCache } = await import('@/utils/unidadesGrafoCache')
            invalidarCache()
        } catch (e) {
            console.warn('No se pudo invalidar cache:', e)
        }

        return {
            success: true,
            mensaje: 'Conversión eliminada exitosamente'
        }
    } catch (error) {
        console.error('Error al eliminar conversión:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al eliminar conversión' }
    }
}
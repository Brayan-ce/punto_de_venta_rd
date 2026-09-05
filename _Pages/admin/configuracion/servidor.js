"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { conPermisoEscrituraOffline, invalidarCacheModoOffline } from '@/_DB/db'
import { subirBaseDatos as subirBaseDatosServidor } from '@/lib/offline/offlineServidor'

export async function subirImagenEmpresa(formData) {
    try {
        const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }

        const imagen = formData.get('imagen')
        if (!imagen) {
            return { success: false, mensaje: 'No se proporcionó ninguna imagen' }
        }

        const vpsFormData = new FormData()
        vpsFormData.append('file', imagen)
        vpsFormData.append('folder', 'logos')

        const response = await fetch(VPS_UPLOAD_URL, {
            method: 'POST',
            body: vpsFormData
        })

        if (!response.ok) {
            return { success: false, mensaje: 'Error al conectar con el servidor de imágenes' }
        }

        const resultado = await response.json()

        if (!resultado.success) {
            return { success: false, mensaje: resultado.mensaje || 'Error al subir imagen' }
        }

        const VPS_IMAGE_BASE_URL = process.env.VPS_IMAGE_BASE_URL
        const urlCompleta = `${VPS_IMAGE_BASE_URL}/${resultado.filename}`

        return { success: true, url: urlCompleta }

    } catch (error) {
        console.error('Error al subir imagen empresa:', error)
        return { success: false, mensaje: 'Error al subir la imagen' }
    }
}

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

        const impuestoNombreNormalizado = String(datosEmpresa.impuesto_nombre || 'ITBIS').trim().toUpperCase()
        const IMPUESTOS_PERMITIDOS = new Set(['ITBIS', 'IVA', 'SALES TAX', 'GST', 'ISC'])
        const impuestoNombre = IMPUESTOS_PERMITIDOS.has(impuestoNombreNormalizado)
            ? impuestoNombreNormalizado
            : 'ITBIS'

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
                mensaje_factura = ?,
                logo_url = ?
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
                impuestoNombre,
                datosEmpresa.impuesto_porcentaje !== undefined && datosEmpresa.impuesto_porcentaje !== null && datosEmpresa.impuesto_porcentaje !== '' ? parseFloat(datosEmpresa.impuesto_porcentaje) : 0.00,
                datosEmpresa.mensaje_factura?.trim() || null,
                datosEmpresa.logo_url || null,
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
                mensaje: 'No tienes permisos para ver unidades'
            }
        }

        connection = await db.getConnection()

        const [unidades] = await connection.execute(
            `SELECT * FROM unidades_medida WHERE empresa_id = ? ORDER BY activo DESC, nombre ASC`,
            [empresaId]
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
                mensaje: 'No tienes permisos para crear unidades'
            }
        }

        connection = await db.getConnection()

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ? AND empresa_id = ?`,
            [datosUnidad.codigo.toUpperCase(), empresaId]
        )

        if (existe.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'El codigo de unidad ya existe'
            }
        }

        await connection.execute(
            `INSERT INTO unidades_medida (empresa_id, codigo, nombre, abreviatura, activo) VALUES (?, ?, ?, ?, ?)`,
            [
                empresaId,
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
                mensaje: 'No tienes permisos para actualizar unidades'
            }
        }

        connection = await db.getConnection()

        const [pertenece] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (pertenece.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Unidad no encontrada'
            }
        }

        const [existe] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE codigo = ? AND id != ? AND empresa_id = ?`,
            [datosUnidad.codigo.toUpperCase(), id, empresaId]
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
                mensaje: 'No tienes permisos para eliminar unidades'
            }
        }

        connection = await db.getConnection()

        const [pertenece] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (pertenece.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Unidad no encontrada'
            }
        }

        const [enUso] = await connection.execute(
            `SELECT id FROM productos WHERE unidad_medida_id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        if (enUso.length > 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'No se puede eliminar, la unidad esta en uso'
            }
        }

        await connection.execute(
            `DELETE FROM unidades_medida WHERE id = ? AND empresa_id = ?`,
            [id, empresaId]
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

// ============================================
// NOTIFICACIONES DEL HEADER
// ============================================

const CONFIG_NOTIF_DEFAULT = {
    notif_mostrar_proximas: 1,
    notif_mostrar_vencidas: 1,
    notif_mostrar_alertas: 1,
    notif_proximas_dias: 7,
}

export async function obtenerNotificacionesConfig() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT notif_mostrar_proximas, notif_mostrar_vencidas, notif_mostrar_alertas, notif_proximas_dias
             FROM empresas WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        const fila = rows[0]
        return {
            success: true,
            config: {
                notif_mostrar_proximas: fila.notif_mostrar_proximas == null ? CONFIG_NOTIF_DEFAULT.notif_mostrar_proximas : !!fila.notif_mostrar_proximas,
                notif_mostrar_vencidas: fila.notif_mostrar_vencidas == null ? CONFIG_NOTIF_DEFAULT.notif_mostrar_vencidas : !!fila.notif_mostrar_vencidas,
                notif_mostrar_alertas: fila.notif_mostrar_alertas == null ? CONFIG_NOTIF_DEFAULT.notif_mostrar_alertas : !!fila.notif_mostrar_alertas,
                notif_proximas_dias: fila.notif_proximas_dias == null ? CONFIG_NOTIF_DEFAULT.notif_proximas_dias : parseInt(fila.notif_proximas_dias) || CONFIG_NOTIF_DEFAULT.notif_proximas_dias,
            }
        }
    } catch (error) {
        console.error('Error al obtener configuracion de notificaciones:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar configuracion de notificaciones' }
    }
}

export async function actualizarNotificacionesConfig(opciones = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        if (userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }

        connection = await db.getConnection()

        const dias = opciones.notif_proximas_dias
        const diasValor = dias === undefined || dias === null || isNaN(dias)
            ? CONFIG_NOTIF_DEFAULT.notif_proximas_dias
            : Math.min(Math.max(parseInt(dias), 1), 90)

        await connection.execute(
            `UPDATE empresas SET
                notif_mostrar_proximas = ?,
                notif_mostrar_vencidas = ?,
                notif_mostrar_alertas = ?,
                notif_proximas_dias = ?
             WHERE id = ?`,
            [
                opciones.notif_mostrar_proximas === undefined ? CONFIG_NOTIF_DEFAULT.notif_mostrar_proximas : (opciones.notif_mostrar_proximas ? 1 : 0),
                opciones.notif_mostrar_vencidas === undefined ? CONFIG_NOTIF_DEFAULT.notif_mostrar_vencidas : (opciones.notif_mostrar_vencidas ? 1 : 0),
                opciones.notif_mostrar_alertas === undefined ? CONFIG_NOTIF_DEFAULT.notif_mostrar_alertas : (opciones.notif_mostrar_alertas ? 1 : 0),
                diasValor,
                empresaId
            ]
        )

        connection.release()

        return {
            success: true,
            config: {
                notif_mostrar_proximas: opciones.notif_mostrar_proximas === undefined ? !!CONFIG_NOTIF_DEFAULT.notif_mostrar_proximas : !!opciones.notif_mostrar_proximas,
                notif_mostrar_vencidas: opciones.notif_mostrar_vencidas === undefined ? !!CONFIG_NOTIF_DEFAULT.notif_mostrar_vencidas : !!opciones.notif_mostrar_vencidas,
                notif_mostrar_alertas: opciones.notif_mostrar_alertas === undefined ? !!CONFIG_NOTIF_DEFAULT.notif_mostrar_alertas : !!opciones.notif_mostrar_alertas,
                notif_proximas_dias: diasValor,
            },
            mensaje: 'Configuracion de notificaciones actualizada'
        }
    } catch (error) {
        console.error('Error al actualizar configuracion de notificaciones:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar configuracion de notificaciones' }
    }
}

// ============================================
// OTP SEGURIDAD
// ============================================

export async function obtenerOtpEstado() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        if (userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT otp_habilitado FROM empresas WHERE id = ?`,
            [empresaId]
        )

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        return {
            success: true,
            otp_habilitado: !!rows[0].otp_habilitado
        }
    } catch (error) {
        console.error('Error al obtener estado OTP:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estado OTP' }
    }
}

export async function actualizarOtpEstado(habilitado) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        if (userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }

        connection = await db.getConnection()

        await connection.execute(
            `UPDATE empresas SET otp_habilitado = ? WHERE id = ?`,
            [habilitado ? 1 : 0, empresaId]
        )

        connection.release()

        return {
            success: true,
            mensaje: 'Estado de verificación en dos pasos actualizado'
        }
    } catch (error) {
        console.error('Error al actualizar OTP:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar verificación en dos pasos' }
    }
}

// ============================================
// OFFLINE MODO
// ============================================

export async function obtenerOfflineEstado() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [rows] = await connection.execute(
            `SELECT offline_habilitado FROM usuarios WHERE id = ?`,
            [userId]
        )

        let empresaBloqueada = false
        let offlineConfirmado = false
        if (empresaId) {
            const [empresaRows] = await connection.execute(
                `SELECT value FROM settings WHERE empresa_id = ? AND name = 'modo_offline' LIMIT 1`,
                [empresaId]
            )
            empresaBloqueada = empresaRows.length > 0 && String(empresaRows[0].value) === '1'
            const [confirmadoRows] = await connection.execute(
                `SELECT value FROM settings WHERE empresa_id = ? AND name = 'modo_offline_confirmado' LIMIT 1`,
                [empresaId]
            )
            offlineConfirmado = confirmadoRows.length > 0 && String(confirmadoRows[0].value) === '1'
        }

        connection.release()

        if (rows.length === 0) {
            return { success: false, mensaje: 'Usuario no encontrado' }
        }

        return {
            success: true,
            offline_habilitado: !!rows[0].offline_habilitado,
            empresa_bloqueada: empresaBloqueada,
            offline_confirmado: offlineConfirmado
        }
    } catch (error) {
        console.error('Error al obtener estado offline:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar estado offline' }
    }
}

export async function actualizarOfflineEstado(habilitado) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        if (userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }

        connection = await db.getConnection()

        return await conPermisoEscrituraOffline(async () => {
            await connection.execute(
                `UPDATE usuarios SET offline_habilitado = ? WHERE id = ?`,
                [habilitado ? 1 : 0, userId]
            )

            if (empresaId) {
                // Al activar NO se bloquea la empresa: el modo offline total solo
                // comienza cuando el admin confirma la descarga (confirmarOfflineDescargado).
                // Al desactivar sí se desbloquea y se limpia la confirmación.
                if (!habilitado) {
                    await connection.execute(
                        `UPDATE settings SET value = '0', updated_at = NOW() WHERE empresa_id = ? AND name = 'modo_offline'`,
                        [empresaId]
                    )
                    await connection.execute(
                        `UPDATE settings SET value = '0', updated_at = NOW() WHERE empresa_id = ? AND name = 'modo_offline_confirmado'`,
                        [empresaId]
                    )
                }
                await invalidarCacheModoOffline(empresaId)
            }

            return {
                success: true,
                mensaje: 'Estado de modo offline actualizado'
            }
        })
    } catch (error) {
        console.error('Error al actualizar offline:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar modo offline' }
    }
}

export async function subirBaseDatos(datos) {
    return subirBaseDatosServidor(datos)
}

/**
 * Confirma que el administrador ya descargó el JSON y deja la empresa
 * totalmente offline (bloqueada). No se re-habilita hasta subir la nueva
 * base de datos.
 */
export async function confirmarOfflineDescargado() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const userTipo = cookieStore.get('userTipo')?.value
        const empresaId = cookieStore.get('empresaId')?.value

        if (!userId) {
            return { success: false, mensaje: 'Sesion invalida' }
        }
        if (userTipo !== 'admin') {
            return { success: false, mensaje: 'Sin permisos' }
        }
        if (!empresaId) {
            return { success: false, mensaje: 'Empresa no identificada' }
        }

        connection = await db.getConnection()

        return await conPermisoEscrituraOffline(async () => {
            await connection.execute(
                `INSERT INTO settings (empresa_id, name, value, updated_at)
                 VALUES (?, 'modo_offline_confirmado', '1', NOW())
                 ON DUPLICATE KEY UPDATE value = '1', updated_at = NOW()`,
                [empresaId]
            )
            // Bloquear la empresa (queda offline hasta subir la nueva BD)
            await connection.execute(
                `INSERT INTO settings (empresa_id, name, value, updated_at)
                 VALUES (?, 'modo_offline', '1', NOW())
                 ON DUPLICATE KEY UPDATE value = '1', updated_at = NOW()`,
                [empresaId]
            )
            await invalidarCacheModoOffline(empresaId)

            return {
                success: true,
                mensaje: 'Descarga confirmada. La empresa quedó en modo offline total hasta subir la nueva base de datos.'
            }
        })
    } catch (error) {
        console.error('Error al confirmar descarga offline:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al confirmar la descarga' }
    }
}

export async function eliminarUnidadesMedida(ids) {
    let connection;
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        const empresaId = cookieStore.get('empresaId')?.value;
        const userTipo = cookieStore.get('userTipo')?.value;

        if (!userId || !empresaId) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            };
        }
        if (userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar unidades'
            };
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            return {
                success: false,
                mensaje: 'No se recibieron unidades a eliminar'
            };
        }

        connection = await db.getConnection();
        // Validar que todas las unidades pertenezcan a la empresa y no estén en uso
        const placeholders = ids.map(() => '?').join(',');
        const [pertenecen] = await connection.execute(
            `SELECT id FROM unidades_medida WHERE id IN (${placeholders}) AND empresa_id = ?`,
            [...ids, empresaId]
        );
        if (pertenecen.length !== ids.length) {
            connection.release();
            return {
                success: false,
                mensaje: 'Algunas unidades no existen o no pertenecen a la empresa'
            };
        }
        // Validar que ninguna esté en uso
        const [enUso] = await connection.execute(
            `SELECT id FROM productos WHERE unidad_medida_id IN (${placeholders}) AND empresa_id = ?`,
            [...ids, empresaId]
        );
        if (enUso.length > 0) {
            connection.release();
            return {
                success: false,
                mensaje: 'No se puede eliminar, una o más unidades están en uso'
            };
        }
        // Eliminar en lote
        await connection.execute(
            `DELETE FROM unidades_medida WHERE id IN (${placeholders}) AND empresa_id = ?`,
            [...ids, empresaId]
        );
        connection.release();
        return {
            success: true,
            mensaje: 'Unidades eliminadas exitosamente'
        };
    } catch (error) {
        console.error('Error al eliminar unidades en lote:', error);
        if (connection) {
            connection.release();
        }
        return {
            success: false,
            mensaje: 'Error al eliminar las unidades'
        };
    }
}
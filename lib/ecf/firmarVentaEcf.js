
import db from '@/_DB/db'
import { cookies } from 'next/headers'
import dns from 'node:dns/promises'
import {
    construirCuerpoINI,
    enviarDocumentoApiEecf,
    normalizarFirmaRespuesta,
    resolverServidorApi,
    ECF_AMBIENTE_DEFAULT,
    mensajeErrorConexionECF,
    mensajeErrorValidacionECF,
    resolverRncEmisor,
    validarRequisitosFirmaECF
} from '@/lib/ecf/apiEecf'

async function usuarioPuedeFirmar(connection, userId) {
    const [rows] = await connection.execute(
        `SELECT tipo, permite_impresion FROM usuarios WHERE id = ? AND activo = TRUE LIMIT 1`,
        [userId]
    )
    if (!rows.length) return false
    const u = rows[0]
    return u.tipo === 'admin' || u.permite_impresion === 1 || u.permite_impresion === true
}

/**
 * Firma electrónicamente una venta vía API-EECF (EFRENIS SOFT)
 */
export async function ejecutarFirmaVentaECF(ventaId, ambienteOverride = null) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesión inválida' }
        }

        connection = await db.getConnection()

        if (!(await usuarioPuedeFirmar(connection, userId))) {
            connection.release()
            return { success: false, mensaje: 'No tienes permisos para firmar documentos electrónicos' }
        }

        const { url: servidorApi, origen: origenServidor } = resolverServidorApi()
        const ambiente = ambienteOverride || ECF_AMBIENTE_DEFAULT

        const [venta] = await connection.execute(
            `SELECT v.*,
                    tc.codigo AS tipo_comprobante_codigo,
                    tc.prefijo_ncf,
                    c.nombre AS cliente_nombre,
                    c.numero_documento AS cliente_numero_documento,
                    c.direccion AS cliente_direccion,
                    c.email AS cliente_email
             FROM ventas v
             INNER JOIN tipos_comprobante tc ON v.tipo_comprobante_id = tc.id
             LEFT JOIN clientes c ON v.cliente_id = c.id
             WHERE v.id = ? AND v.empresa_id = ?`,
            [ventaId, empresaId]
        )

        if (!venta.length) {
            connection.release()
            return { success: false, mensaje: 'Venta no encontrada' }
        }

        const ventaData = venta[0]

        if (ventaData.ecf_firmado) {
            connection.release()
            return {
                success: true,
                yaFirmado: true,
                mensaje: 'Esta venta ya está firmada electrónicamente',
                firma: {
                    comprobante: ventaData.ecf_comprobante,
                    codigoSeguridad: ventaData.ecf_codigo_seguridad,
                    fechaFirma: ventaData.ecf_fecha_firma,
                    qr: ventaData.ecf_qr
                }
            }
        }

        if (!ventaData.ncf) {
            connection.release()
            return { success: false, mensaje: 'La venta no tiene NCF/e-NCF asignado' }
        }

        const [productos] = await connection.execute(
            `SELECT dv.*, p.nombre AS nombre_producto, p.codigo_barras, p.sku, p.aplica_itbis
             FROM detalle_ventas dv
             INNER JOIN productos p ON dv.producto_id = p.id
             WHERE dv.venta_id = ?
             ORDER BY dv.id ASC`,
            [ventaId]
        )

        if (!productos.length) {
            connection.release()
            return { success: false, mensaje: 'La venta no tiene productos en el detalle' }
        }

        const [extras] = await connection.execute(
            `SELECT * FROM venta_extras WHERE venta_id = ? ORDER BY id ASC`,
            [ventaId]
        )

        const [pagosMixtos] = await connection.execute(
            `SELECT metodo_pago, monto FROM ventas_pagos_mixtos WHERE venta_id = ? ORDER BY id ASC`,
            [ventaId]
        )

        const [empresaRows] = await connection.execute(
            `SELECT * FROM empresas WHERE id = ? AND activo = TRUE LIMIT 1`,
            [empresaId]
        )

        if (!empresaRows.length) {
            connection.release()
            return { success: false, mensaje: 'Empresa no encontrada' }
        }

        const datosParaINI = {
            ...ventaData,
            productos,
            extras,
            pagos_mixtos: pagosMixtos
        }

        const tipoComprobante = {
            codigo: ventaData.tipo_comprobante_codigo,
            prefijo_ncf: ventaData.prefijo_ncf
        }

        const validacion = validarRequisitosFirmaECF(
            { ...datosParaINI, empresa_rnc: resolverRncEmisor(empresaRows[0]) },
            tipoComprobante
        )
        if (!validacion.valido) {
            connection.release()
            return { success: false, ...validacion }
        }

        const cuerpoINI = construirCuerpoINI(datosParaINI, empresaRows[0], tipoComprobante)

        const urlFirma = `${servidorApi}/api-eecf/${ambiente}`

        let hostDestino = servidorApi
        let ipDestino = '(no resuelta)'
        try {
            const parsed = new URL(servidorApi)
            hostDestino = parsed.hostname
            const resueltas = await dns.lookup(hostDestino, { all: true })
            ipDestino = resueltas.map(r => r.address).join(', ')
        } catch {
            // si falla DNS, igual queda el host en log
        }

        const rncIni = resolverRncEmisor(empresaRows[0])

        console.log('[API-EECF][QA] ========== FIRMA e-NCF ==========')
        console.log('[API-EECF][QA] Venta ID:', ventaId)
        console.log('[API-EECF][QA] Servidor configurado:', servidorApi)
        console.log('[API-EECF][QA] Host destino:', hostDestino)
        console.log('[API-EECF][QA] IP destino (DNS):', ipDestino)
        console.log('[API-EECF][QA] Origen config:', origenServidor, '(lib/ecf/apiEecf.js)')
        console.log('[API-EECF][QA] Ambiente:', ambiente)
        console.log('[API-EECF][QA] URL firma:', urlFirma)
        console.log('[API-EECF][QA] RNC emisor INI:', rncIni, '(decodificado desde config)')
        console.log('[API-EECF][QA] RNC empresa BD:', empresaRows[0].rnc || '(vacío)')
        console.log('[API-EECF][QA] NCF venta:', ventaData.ncf)
        console.log('[API-EECF][QA] ================================')
        console.log('[API-EECF] Cuerpo INI:\n', cuerpoINI)

        let resultadoApi
        try {
            resultadoApi = await enviarDocumentoApiEecf({ servidorApi, ambiente, cuerpoINI })
        } catch (fetchError) {
            console.error('[API-EECF] Error de conexión:', fetchError)
            const err = mensajeErrorConexionECF(fetchError)
            await connection.execute(
                `UPDATE ventas SET ecf_intentos_firma = COALESCE(ecf_intentos_firma, 0) + 1, ecf_ultimo_error = ? WHERE id = ?`,
                [`${err.titulo}. ${err.mensaje}`, ventaId]
            )
            connection.release()
            return { success: false, ...err }
        }

        console.log('[API-EECF] Respuesta:', resultadoApi.texto)

        if (resultadoApi.ok && resultadoApi.datos.DATA) {
            const firmaRaw = resultadoApi.datos.DATA
            const firma = normalizarFirmaRespuesta(firmaRaw, ventaData.ncf)

            await connection.execute(
                `UPDATE ventas SET
                    ecf_firmado = TRUE,
                    ecf_comprobante = ?,
                    ecf_codigo_seguridad = ?,
                    ecf_fecha_firma = STR_TO_DATE(?, '%d-%m-%Y %H:%i:%s'),
                    ecf_qr = ?,
                    ecf_ambiente = ?,
                    ecf_ultimo_error = NULL,
                    ecf_intentos_firma = COALESCE(ecf_intentos_firma, 0) + 1
                 WHERE id = ?`,
                [
                    firma.comprobante,
                    firma.codigoSeguridad,
                    firma.fechaFirma,
                    firma.qr,
                    ambiente,
                    ventaId
                ]
            )

            connection.release()

            return {
                success: true,
                mensaje: 'Documento firmado electrónicamente exitosamente',
                firma,
                cuerpoEnviado: cuerpoINI
            }
        }

        const mensajeApi = resultadoApi.datos.ERROR?.mensaje
            || resultadoApi.datos.error?.mensaje
            || null

        const err = mensajeApi
            ? mensajeErrorValidacionECF(mensajeApi)
            : mensajeErrorValidacionECF(
                resultadoApi.status === 422
                    ? 'El comprobante no cumple con los requisitos de la DGII.'
                    : 'Respuesta inválida del servicio de firma.'
            )

        await connection.execute(
            `UPDATE ventas SET ecf_intentos_firma = COALESCE(ecf_intentos_firma, 0) + 1, ecf_ultimo_error = ? WHERE id = ?`,
            [`${err.titulo}. ${err.mensaje}`, ventaId]
        )

        connection.release()

        return {
            success: false,
            ...err
        }

    } catch (error) {
        console.error('Error al firmar venta ECF:', error)
        if (connection) connection.release()
        const err = mensajeErrorConexionECF(error)
        return { success: false, ...err }
    }
}

export async function obtenerConfiguracionECFEmpresa() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const resuelto = resolverServidorApi()

        return {
            success: true,
            configurado: true,
            configuracion: {
                servidor_api: resuelto.url,
                url_firma: `${resuelto.url}/api-eecf/${ECF_AMBIENTE_DEFAULT}`,
                ambiente: ECF_AMBIENTE_DEFAULT,
                rnc_emisor_configurado: true,
                activo: true
            }
        }
    } catch (error) {
        return { success: false, mensaje: error.message }
    }
}

/** Reservado — la URL del servidor está fija en lib/ecf/apiEecf.js */
export async function guardarConfiguracionECFEmpresa() {
    return {
        success: false,
        mensaje: 'La conexión con EFRENIS usa el servidor configurado en el sistema (marcopinero.ddns.net:8000).'
    }
}

export async function obtenerEstadoFirmaECF(ventaId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT ecf_firmado, ecf_comprobante, ecf_codigo_seguridad,
                    ecf_fecha_firma, ecf_qr, ecf_ambiente,
                    ecf_intentos_firma, ecf_ultimo_error
             FROM ventas WHERE id = ? AND empresa_id = ?`,
            [ventaId, empresaId]
        )
        connection.release()

        if (!rows.length) return { success: false, mensaje: 'Venta no encontrada' }
        return { success: true, estado: rows[0] }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

"use server"

import { cookies } from 'next/headers'
import db from '@/_DB/db'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerClientesFinanciamiento({ busqueda = '', pagina = 0, limite = 30 } = {}) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, clientes: [], total: 0, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const offset = pagina * limite
        const like   = `%${busqueda}%`

        const whereExtra = busqueda
            ? `AND (c.nombre LIKE ? OR c.apellidos LIKE ? OR CONCAT(c.nombre,' ',IFNULL(c.apellidos,'')) LIKE ? OR c.numero_documento LIKE ? OR c.telefono LIKE ?)`
            : ''
        const params = busqueda ? [empresaId, like, like, like, like, like] : [empresaId]

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(DISTINCT c.id) AS total FROM clientes c WHERE c.empresa_id = ? ${whereExtra}`,
            params
        )

        const [filas] = await connection.execute(
            `SELECT
                c.id,
                CONCAT(c.nombre, IFNULL(CONCAT(' ', c.apellidos), '')) AS nombre_completo,
                c.numero_documento,
                c.telefono,
                c.email,
                COUNT(DISTINCT fc.id)                                                    AS total_contratos,
                COUNT(DISTINCT CASE WHEN fc.estado = 'activo' THEN fc.id END)            AS contratos_activos,
                COUNT(DISTINCT CASE WHEN fc.estado = 'pagado' THEN fc.id END)            AS contratos_pagados,
                COUNT(DISTINCT CASE WHEN cu.estado = 'vencida' THEN cu.id END)           AS cuotas_vencidas,
                cc.clasificacion,
                cc.score_crediticio,
                cc.estado_credito,
                cc.limite_credito,
                cc.saldo_utilizado
            FROM clientes c
            LEFT JOIN fin_contratos    fc ON fc.cliente_id  = c.id AND fc.empresa_id = ?
            LEFT JOIN fin_cuotas       cu ON cu.contrato_id = fc.id
            LEFT JOIN credito_clientes cc ON cc.cliente_id  = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
            WHERE c.empresa_id = ? ${whereExtra}
            GROUP BY c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono, c.email,
                     cc.clasificacion, cc.score_crediticio, cc.estado_credito,
                     cc.limite_credito, cc.saldo_utilizado
            ORDER BY cuotas_vencidas DESC, contratos_activos DESC, c.nombre ASC
            LIMIT ? OFFSET ?`,
            [...(busqueda ? [empresaId, empresaId, empresaId, like, like, like, like, like] : [empresaId, empresaId, empresaId]), limite, offset]
        )

        connection.release()
        return { success: true, clientes: filas, total: parseInt(total) }
    } catch (error) {
        console.error('[obtenerClientesFinanciamiento]', error)
        if (connection) connection.release()
        return { success: false, clientes: [], total: 0 }
    }
}

export async function obtenerClienteDetalle(clienteId) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [[cliente]] = await connection.execute(
            `SELECT c.id, c.nombre, c.apellidos, c.numero_documento, c.telefono, c.email,
                    c.direccion, c.sector, c.municipio, c.provincia, c.fecha_nacimiento,
                    c.fecha_creacion,
                    cc.clasificacion, cc.score_crediticio, cc.estado_credito,
                    cc.limite_credito, cc.saldo_utilizado
             FROM clientes c
             LEFT JOIN credito_clientes cc ON cc.cliente_id = c.id AND cc.empresa_id = ? AND cc.activo = TRUE
             WHERE c.id = ? AND c.empresa_id = ?`,
            [empresaId, clienteId, empresaId]
        )

        if (!cliente) { connection.release(); return { success: false, mensaje: 'Cliente no encontrado' } }

        const [contratos] = await connection.execute(
            `SELECT fc.id, fc.numero AS numero_contrato, fc.estado, fc.monto_financiado,
                    fc.cuota_mensual, fc.fecha_inicio, fc.fecha_fin,
                    fp.nombre AS plan_nombre,
                    COUNT(cu.id)                                           AS total_cuotas,
                    COUNT(CASE WHEN cu.estado = 'pagada' THEN 1 END)       AS cuotas_pagadas,
                    COUNT(CASE WHEN cu.estado = 'vencida' THEN 1 END)      AS cuotas_vencidas,
                    COUNT(CASE WHEN cu.estado = 'pendiente' THEN 1 END)    AS cuotas_pendientes,
                    SUM(CASE WHEN cu.estado != 'pagada' THEN cu.monto ELSE 0 END) AS saldo_pendiente
             FROM fin_contratos fc
             LEFT JOIN fin_planes fp ON fp.id = fc.plan_id
             LEFT JOIN fin_cuotas cu ON cu.contrato_id = fc.id
             WHERE fc.cliente_id = ? AND fc.empresa_id = ?
             GROUP BY fc.id
             ORDER BY fc.created_at DESC`,
            [clienteId, empresaId]
        )

        connection.release()
        return { success: true, cliente, contratos }
    } catch (error) {
        console.error('[obtenerClienteDetalle]', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener cliente' }
    }
}

export async function actualizarCliente(clienteId, datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const { nombre, apellidos, telefono, email, direccion, sector, municipio, provincia, fecha_nacimiento } = datos

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE clientes SET nombre=?, apellidos=?, telefono=?, email=?,
             direccion=?, sector=?, municipio=?, provincia=?, fecha_nacimiento=?
             WHERE id = ? AND empresa_id = ?`,
            [nombre, apellidos || null, telefono || null, email || null,
             direccion || null, sector || null, municipio || null, provincia || null,
             fecha_nacimiento || null, clienteId, empresaId]
        )
        connection.release()
        return { success: true }
    } catch (error) {
        console.error('[actualizarCliente]', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al actualizar cliente' }
    }
}

export async function crearClienteFinanciamiento(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const { nombre, apellidos, numero_documento, tipo_documento_id, telefono, email,
                direccion, sector, municipio, provincia, fecha_nacimiento } = datos

        if (!nombre || !numero_documento) return { success: false, mensaje: 'Nombre y documento son requeridos' }

        connection = await db.getConnection()

        const [[existe]] = await connection.execute(
            `SELECT id FROM clientes WHERE numero_documento = ? AND empresa_id = ? LIMIT 1`,
            [numero_documento, empresaId]
        )
        if (existe) { connection.release(); return { success: false, mensaje: 'Ya existe un cliente con ese documento' } }

        const [result] = await connection.execute(
            `INSERT INTO clientes (empresa_id, nombre, apellidos, numero_documento, tipo_documento_id,
             telefono, email, direccion, sector, municipio, provincia, fecha_nacimiento, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [empresaId, nombre, apellidos || null, numero_documento,
             tipo_documento_id || 1, telefono || null, email || null,
             direccion || null, sector || null, municipio || null,
             provincia || null, fecha_nacimiento || null]
        )
        connection.release()
        return { success: true, clienteId: result.insertId }
    } catch (error) {
        console.error('[crearClienteFinanciamiento]', error)
        if (connection) connection.release()
        if (error && error.code === 'MODO_OFFLINE') {
            return {
                success: false,
                mensaje: 'La empresa está en modo offline. No se pueden modificar datos en línea.',
                codigo: 'MODO_OFFLINE'
            }
        }
        return { success: false, mensaje: 'Error al crear cliente' }
    }
}

export async function obtenerTiposDocumento() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, tipos: [] }

        connection = await db.getConnection()
        const [tipos] = await connection.execute(`SELECT id, nombre, codigo FROM tipos_documento ORDER BY id`)
        connection.release()
        return { success: true, tipos }
    } catch (error) {
        if (connection) connection.release()
        return { success: false, tipos: [] }
    }
}

export async function obtenerDatosEmpresa() {
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        const connection = await db.getConnection()
        const [rows] = await connection.query(
            'SELECT moneda, simbolo_moneda, locale, impuesto_porcentaje, nombre_empresa FROM empresas WHERE id = ? LIMIT 1',
            [empresaId]
        )
        connection.release()

        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.locale || (e?.moneda === 'USD' ? 'en-US' : 'es-DO'),
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
            }
        }
    } catch (error) {
        console.error('Error al obtener datos empresa:', error)
        return { success: false, mensaje: 'Error al obtener datos de la empresa' }
    }
}

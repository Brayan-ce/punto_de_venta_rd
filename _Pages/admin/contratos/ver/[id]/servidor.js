"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

async function getUserId() {
    const cookieStore = await cookies()
    return cookieStore.get('userId')?.value
}

function serializarFila(obj) {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
        if (v instanceof Date) out[k] = v.toISOString().split('T')[0]
        else if (v === null || v === undefined) out[k] = null
        else if (typeof v === 'object' && !Array.isArray(v)) out[k] = serializarFila(v)
        else out[k] = v
    }
    return out
}

function calcularMoraActual(cuota, moraPct, diasGracia) {
    if (!cuota.fecha_vencimiento) return 0
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const [y,m,d] = String(cuota.fecha_vencimiento).slice(0,10).split('-').map(Number)
    const venc = new Date(y,m-1,d)
    const diasRetraso = Math.floor((hoy - venc) / 86400000)
    if (diasRetraso <= diasGracia) return 0
    const diasConMora = diasRetraso - diasGracia
    return parseFloat(((parseFloat(cuota.monto) * (moraPct / 100) / 30) * diasConMora).toFixed(2))
}

export async function obtenerContratoPorId(id) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT c.*,
                    cl.nombre        AS cliente_nombre,
                    cl.apellidos     AS cliente_apellidos,
                    cl.numero_documento AS cliente_documento,
                    cl.telefono      AS cliente_telefono,
                    cl.email         AS cliente_email,
                    cl.direccion     AS cliente_direccion,
                    p.nombre         AS plan_nombre,
                    p.codigo         AS plan_codigo,
                    p.mora_pct, p.dias_gracia,
                    u.nombre         AS vendedor_nombre
             FROM fin_contratos c
             LEFT JOIN clientes  cl ON c.cliente_id = cl.id
             LEFT JOIN fin_planes p  ON c.plan_id   = p.id
             LEFT JOIN usuarios  u  ON c.usuario_id = u.id
             WHERE c.id = ? AND c.empresa_id = ?`,
            [id, empresaId]
        )

        if (!contratos.length) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = serializarFila(contratos[0])
        const moraPct = parseFloat(contrato.mora_pct || 5)
        const diasGracia = parseInt(contrato.dias_gracia || 5)

        const [cuotasRaw] = await connection.execute(
            `SELECT * FROM fin_cuotas WHERE contrato_id = ? ORDER BY numero ASC`,
            [id]
        )

        const cuotaIds = cuotasRaw.map(c => c.id)
        let montosPagados = {}
        let ultimosPagos = {}

        if (cuotaIds.length > 0) {
            const ph = cuotaIds.map(() => '?').join(',')
            const [pagosAplicados] = await connection.execute(
                `SELECT pc.cuota_id,
                        COALESCE(SUM(pc.monto), 0) AS total_pagado,
                        MAX(pc.pago_id) AS ultimo_pago_id
                 FROM fin_pago_cuotas pc
                 WHERE pc.cuota_id IN (${ph})
                 GROUP BY pc.cuota_id`,
                cuotaIds
            )
            for (const row of pagosAplicados) {
                montosPagados[row.cuota_id] = parseFloat(row.total_pagado)
                ultimosPagos[row.cuota_id] = row.ultimo_pago_id
            }
        }

        const cuotas = cuotasRaw.map(cu => {
            const ser = serializarFila(cu)
            const montoPagado = montosPagados[cu.id] || 0
            const montoRestante = Math.max(0, parseFloat(cu.monto) - montoPagado)

            if (['pendiente','vencida','parcial'].includes(cu.estado)) {
                ser.mora = calcularMoraActual(ser, moraPct, diasGracia)
                ser.monto_restante = montoRestante
                ser.monto_pagado = montoPagado > 0 ? montoPagado : null
            } else {
                ser.mora = parseFloat(cu.mora || 0)
                ser.monto_restante = parseFloat(cu.monto)
                ser.monto_pagado = null
            }

            if (['pagada', 'parcial'].includes(cu.estado) && montoPagado > 0) {
                ser.ultimo_pago_id = ultimosPagos[cu.id] || null
            }

            return ser
        })

        const [pagos] = await connection.execute(
            `SELECT p.*, u.nombre AS registrado_por_nombre, mp.nombre AS metodo_nombre
             FROM fin_pagos p
             LEFT JOIN usuarios     u  ON p.usuario_id     = u.id
             LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
             WHERE p.contrato_id = ?
             ORDER BY p.fecha DESC`,
            [id]
        )

        const [activos] = await connection.execute(
            `SELECT * FROM fin_contrato_activos WHERE contrato_id = ? AND empresa_id = ?`,
            [id, empresaId]
        )

        const [fiadores] = await connection.execute(
            `SELECT * FROM fin_fiadores WHERE contrato_id = ?`,
            [id]
        )

        connection.release()
        return {
            success: true,
            contrato,
            cuotas,
            pagos: pagos.map(serializarFila),
            activos: activos.map(serializarFila),
            fiadores: fiadores.map(serializarFila),
        }

    } catch (error) {
        console.error('obtenerContratoPorId:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, locale, itbis_incluido, nombre_empresa AS nombre, direccion, telefono, email, rnc FROM empresas WHERE id = ?`,
            [empresaId]
        )
        connection.release()
        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.locale || 'es-DO',
                itbis_incluido: e?.itbis_incluido ?? true,
                nombre: e?.nombre || '',
                direccion: e?.direccion || '',
                telefono: e?.telefono || '',
                email: e?.email || '',
                rnc: e?.rnc || ''
            }
        }
    } catch (error) {
        console.error('obtenerDatosEmpresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}

export async function actualizarEstadoContrato(id, estado, notas = null) {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesion invalida' }

        const estadosValidos = ['activo', 'pagado', 'incumplido', 'reestructurado', 'cancelado']
        if (!estadosValidos.includes(estado))
            return { success: false, mensaje: 'Estado invalido' }

        connection = await db.getConnection()
        await connection.execute(
            `UPDATE fin_contratos SET estado = ?, notas = COALESCE(?, notas) WHERE id = ? AND empresa_id = ?`,
            [estado, notas, id, empresaId]
        )
        connection.release()
        return { success: true, mensaje: 'Estado actualizado' }

    } catch (error) {
        console.error('actualizarEstadoContrato:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message }
    }
}
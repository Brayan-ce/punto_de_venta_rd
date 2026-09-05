"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }
        connection = await db.getConnection()
        const [rows] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_porcentaje, nombre_empresa, direccion, telefono, email, rnc FROM empresas WHERE id = ?`,
            [empresaId]
        )
        connection.release()
        const e = rows[0]
        return {
            success: true,
            empresa: {
                moneda: e?.moneda || 'DOP',
                simbolo_moneda: e?.simbolo_moneda || 'RD$',
                locale: e?.moneda === 'USD' ? 'en-US' : 'es-DO',
                itbis_incluido: true,
                nombre: e?.nombre_empresa || '',
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

export async function obtenerContratoImprimir(contratoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId    = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo  = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return { success: false, mensaje: 'Sesion invalida' }
        }

        connection = await db.getConnection()

        const [contratos] = await connection.execute(
            `SELECT
                c.*,
                cl.nombre          AS cliente_nombre,
                cl.apellidos       AS cliente_apellidos,
                cl.numero_documento AS cliente_documento,
                cl.telefono        AS cliente_telefono,
                cl.email           AS cliente_email,
                cl.direccion       AS cliente_direccion,
                p.nombre           AS plan_nombre,
                p.mora_pct,
                p.dias_gracia,
                u.nombre           AS vendedor_nombre,
                e.nombre_empresa,
                e.rnc              AS empresa_rnc,
                e.direccion        AS empresa_direccion,
                e.telefono         AS empresa_telefono,
                e.mensaje_factura,
                e.moneda,
                e.locale,
                e.simbolo_moneda
             FROM fin_contratos c
             LEFT JOIN clientes   cl ON c.cliente_id  = cl.id
             LEFT JOIN fin_planes p  ON c.plan_id     = p.id
             LEFT JOIN usuarios   u  ON c.usuario_id  = u.id
             LEFT JOIN empresas   e  ON e.id          = ?
             WHERE c.id = ? AND c.empresa_id = ?`,
            [empresaId, contratoId, empresaId]
        )

        if (!contratos.length) {
            connection.release()
            return { success: false, mensaje: 'Contrato no encontrado' }
        }

        const contrato = contratos[0]

        const [cuotas] = await connection.execute(
            `SELECT * FROM fin_cuotas
             WHERE contrato_id = ?
             ORDER BY numero ASC`,
            [contratoId]
        )

        const [pagos] = await connection.execute(
            `SELECT fp.*, mp.nombre AS metodo_nombre
             FROM fin_pagos fp
             LEFT JOIN metodos_pago mp ON fp.metodo_pago_id = mp.id
             WHERE fp.contrato_id = ?
             ORDER BY fp.fecha DESC
             LIMIT 10`,
            [contratoId]
        )

        connection.release()

        const totalCuotas   = cuotas.length
        const cuotasPagadas = cuotas.filter(c => c.estado === 'pagada').length
        const proximaCuota  = cuotas.find(c => ['pendiente', 'vencida', 'parcial'].includes(c.estado)) || null
        const cuotasVencidas = cuotas.filter(c => c.estado === 'vencida')
        const totalMora     = cuotasVencidas.reduce((s, c) => s + parseFloat(c.mora || 0), 0)
        const totalAtrasos  = cuotasVencidas.reduce((s, c) => s + parseFloat(c.monto || 0), 0)

        return {
            success: true,
            contrato: {
                ...contrato,
                total_cuotas:   totalCuotas,
                cuotas_pagadas: cuotasPagadas,
                proxima_cuota:  proximaCuota,
                total_mora:     totalMora,
                total_atrasos:  totalAtrasos,
            },
            cuotas,
            pagos,
        }

    } catch (error) {
        console.error('obtenerContratoImprimir:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al cargar datos del contrato' }
    }
}
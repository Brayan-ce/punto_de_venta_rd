"use server"
import db from "@/_DB/db"
import { cookies } from 'next/headers'

async function getEmpresaId() {
    const cookieStore = await cookies()
    return cookieStore.get('empresaId')?.value
}

export async function obtenerNotificaciones() {
    let connection
    try {
        const empresaId = await getEmpresaId()
        if (!empresaId) return { success: false, mensaje: 'Sesión inválida' }

        connection = await db.getConnection()

        const [empresas] = await connection.execute(
            `SELECT notif_mostrar_proximas, notif_mostrar_vencidas, notif_mostrar_alertas, notif_proximas_dias
             FROM empresas WHERE id = ?`,
            [empresaId]
        )

        const fila = empresas[0] || {}
        const config = {
            mostrarProximas: fila.notif_mostrar_proximas == null ? true : !!fila.notif_mostrar_proximas,
            mostrarVencidas: fila.notif_mostrar_vencidas == null ? true : !!fila.notif_mostrar_vencidas,
            mostrarAlertas: fila.notif_mostrar_alertas == null ? true : !!fila.notif_mostrar_alertas,
            diasProximas: fila.notif_proximas_dias == null ? 7 : Math.min(Math.max(parseInt(fila.notif_proximas_dias) || 7, 1), 90),
        }

        let cuotasProximas = []
        let cuotasVencidas = []
        let alertas = []

        // Cuotas próximas (vence en los próximos N días configurables)
        if (config.mostrarProximas) {
            const [rows] = await connection.execute(
                `SELECT q.id, q.numero, q.monto, q.fecha_vencimiento,
                        c.id AS contrato_id, c.numero AS numero_contrato,
                        cl.id AS cliente_id, cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
                        p.nombre AS plan_nombre
                 FROM fin_cuotas q
                 JOIN fin_contratos c ON q.contrato_id = c.id
                 JOIN clientes cl ON c.cliente_id = cl.id
                 JOIN fin_planes p ON c.plan_id = p.id
                 WHERE q.empresa_id = ? AND q.estado = 'pendiente'
                   AND q.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
                   AND c.estado <> 'cancelado'
                 ORDER BY q.fecha_vencimiento ASC
                 LIMIT 100`,
                [empresaId, config.diasProximas]
            )
            cuotasProximas = rows
        }

        // Cuotas vencidas
        if (config.mostrarVencidas) {
            const [rows] = await connection.execute(
                `SELECT q.id, q.numero, q.monto, q.mora, q.fecha_vencimiento,
                        c.id AS contrato_id, c.numero AS numero_contrato,
                        cl.id AS cliente_id, cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
                        p.nombre AS plan_nombre
                 FROM fin_cuotas q
                 JOIN fin_contratos c ON q.contrato_id = c.id
                 JOIN clientes cl ON c.cliente_id = cl.id
                 JOIN fin_planes p ON c.plan_id = p.id
                 WHERE q.empresa_id = ? AND q.estado = 'vencida'
                   AND c.estado <> 'cancelado'
                 ORDER BY q.fecha_vencimiento ASC
                 LIMIT 100`,
                [empresaId]
            )
            cuotasVencidas = rows
        }

        // Alertas activas
        if (config.mostrarAlertas) {
            const [rows] = await connection.execute(
                `SELECT a.id, a.tipo, a.mensaje, a.fecha,
                        c.id AS contrato_id, c.numero AS numero_contrato,
                        cl.id AS cliente_id, cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono
                 FROM fin_alertas a
                 LEFT JOIN fin_contratos c ON a.contrato_id = c.id
                 LEFT JOIN clientes cl ON c.cliente_id = cl.id
                 WHERE a.empresa_id = ? AND a.estado = 'activa'
                 ORDER BY a.fecha DESC
                 LIMIT 100`,
                [empresaId]
            )
            alertas = rows
        }

        // Totales para stats
        const contadores = []
        const params = []
        contadores.push(`(SELECT COUNT(*) FROM fin_cuotas q
             JOIN fin_contratos c ON q.contrato_id = c.id
             WHERE q.empresa_id = ? AND q.estado = 'pendiente'
               AND q.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
               AND c.estado <> 'cancelado')`)
        params.push(empresaId, config.diasProximas)
        contadores.push(`(SELECT COUNT(*) FROM fin_cuotas q
             JOIN fin_contratos c ON q.contrato_id = c.id
             WHERE q.empresa_id = ? AND q.estado = 'vencida'
               AND c.estado <> 'cancelado')`)
        params.push(empresaId)
        contadores.push(`(SELECT COUNT(*) FROM fin_alertas a
             WHERE a.empresa_id = ? AND a.estado = 'activa')`)
        params.push(empresaId)

        const [[stats]] = await connection.execute(
            `SELECT ${contadores.join(', ')}`,
            params
        )

        connection.release()
        return {
            success: true,
            cuotasProximas: config.mostrarProximas ? cuotasProximas : [],
            cuotasVencidas: config.mostrarVencidas ? cuotasVencidas : [],
            alertas: config.mostrarAlertas ? alertas : [],
            stats: {
                proximas:  config.mostrarProximas ? (parseInt(stats ? stats[0] : 0) || 0) : 0,
                vencidas:  config.mostrarVencidas ? (parseInt(stats ? stats[1] : 0) || 0) : 0,
                alertas:   config.mostrarAlertas ? (parseInt(stats ? stats[2] : 0) || 0) : 0,
            },
            config: {
                mostrarProximas: config.mostrarProximas,
                mostrarVencidas: config.mostrarVencidas,
                mostrarAlertas: config.mostrarAlertas,
                diasProximas: config.diasProximas,
            }
        }
    } catch (error) {
        console.error('obtenerNotificaciones:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, cuotasProximas: [], cuotasVencidas: [], alertas: [], stats: {} }
    }
}

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
            `SELECT notif_mostrar_proximas, notif_mostrar_vencidas, notif_mostrar_alertas, notif_proximas_dias,
                    notif_sonido_activo, notif_sonido_tono
             FROM empresas WHERE id = ?`,
            [empresaId]
        )

        const fila = empresas[0] || {}
        const config = {
            mostrarProximas: fila.notif_mostrar_proximas == null ? true : !!fila.notif_mostrar_proximas,
            mostrarVencidas: fila.notif_mostrar_vencidas == null ? true : !!fila.notif_mostrar_vencidas,
            mostrarAlertas: fila.notif_mostrar_alertas == null ? true : !!fila.notif_mostrar_alertas,
            diasProximas: fila.notif_proximas_dias == null ? 7 : Math.min(Math.max(parseInt(fila.notif_proximas_dias) || 7, 1), 90),
            sonidoActivo: !!fila.notif_sonido_activo,
            sonidoTono: fila.notif_sonido_tono || 'campanilla',
        }

        let cuotasProximas = []
        let cuotasVencidas = []
        let alertas = []
        let productosPorVencer = []
        let productosVencidos = []

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

        // Productos proximos a vencer (fecha_vencimiento en los proximos N dias)
        if (config.mostrarProximas) {
            const [rows] = await connection.execute(
                `SELECT id, nombre, sku, codigo_barras, fecha_vencimiento, ubicacion_bodega, lote, stock
                 FROM productos
                 WHERE empresa_id = ? AND activo = TRUE AND fecha_vencimiento IS NOT NULL
                   AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
                 ORDER BY fecha_vencimiento ASC
                 LIMIT 100`,
                [empresaId, config.diasProximas]
            )
            productosPorVencer = rows
        }

        // Productos ya vencidos
        if (config.mostrarVencidas) {
            const [rows] = await connection.execute(
                `SELECT id, nombre, sku, codigo_barras, fecha_vencimiento, ubicacion_bodega, lote, stock
                 FROM productos
                 WHERE empresa_id = ? AND activo = TRUE AND fecha_vencimiento IS NOT NULL
                   AND fecha_vencimiento < CURDATE()
                 ORDER BY fecha_vencimiento ASC
                 LIMIT 100`,
                [empresaId]
            )
            productosVencidos = rows
        }

        // Totales para stats
        const contadores = []
        const params = []
        contadores.push(`(SELECT COUNT(*) FROM fin_cuotas q
             JOIN fin_contratos c ON q.contrato_id = c.id
             WHERE q.empresa_id = ? AND q.estado = 'pendiente'
               AND q.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
               AND c.estado <> 'cancelado') AS proximas`)
        params.push(empresaId, config.diasProximas)
        contadores.push(`(SELECT COUNT(*) FROM fin_cuotas q
             JOIN fin_contratos c ON q.contrato_id = c.id
             WHERE q.empresa_id = ? AND q.estado = 'vencida'
               AND c.estado <> 'cancelado') AS vencidas`)
        params.push(empresaId)
        contadores.push(`(SELECT COUNT(*) FROM fin_alertas a
             WHERE a.empresa_id = ? AND a.estado = 'activa') AS alertas`)
        params.push(empresaId)
        contadores.push(`(SELECT COUNT(*) FROM productos
             WHERE empresa_id = ? AND activo = TRUE AND fecha_vencimiento IS NOT NULL
               AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)) AS productos_por_vencer`)
        params.push(empresaId, config.diasProximas)
        contadores.push(`(SELECT COUNT(*) FROM productos
             WHERE empresa_id = ? AND activo = TRUE AND fecha_vencimiento IS NOT NULL
               AND fecha_vencimiento < CURDATE()) AS productos_vencidos`)
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
            productosPorVencer: config.mostrarProximas ? productosPorVencer : [],
            productosVencidos: config.mostrarVencidas ? productosVencidos : [],
            stats: {
                proximas:  config.mostrarProximas ? (parseInt(stats?.proximas) || 0) : 0,
                vencidas:  config.mostrarVencidas ? (parseInt(stats?.vencidas) || 0) : 0,
                alertas:   config.mostrarAlertas ? (parseInt(stats?.alertas) || 0) : 0,
                productosPorVencer: config.mostrarProximas ? (parseInt(stats?.productos_por_vencer) || 0) : 0,
                productosVencidos: config.mostrarVencidas ? (parseInt(stats?.productos_vencidos) || 0) : 0,
            },
            config: {
                mostrarProximas: config.mostrarProximas,
                mostrarVencidas: config.mostrarVencidas,
                mostrarAlertas: config.mostrarAlertas,
                diasProximas: config.diasProximas,
                sonidoActivo: config.sonidoActivo,
                sonidoTono: config.sonidoTono,
            }
        }
    } catch (error) {
        console.error('obtenerNotificaciones:', error)
        if (connection) connection.release()
        return { success: false, mensaje: error.message, cuotasProximas: [], cuotasVencidas: [], alertas: [], stats: {} }
    }
}

"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

const NOTIF_POR_PAGINA = 10
const NOTIF_POR_PAGINA_MAX = 15

export async function obtenerDatosAdmin() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !userTipo) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (userTipo === 'superadmin') {
            return {
                success: false,
                mensaje: 'Los superadmins deben acceder desde /superadmin',
                redirectTo: '/superadmin'
            }
        }

        if (userTipo !== 'admin' && userTipo !== 'vendedor' && userTipo !== 'financiamiento' && userTipo !== 'sucursales')
{
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        if (!empresaId) {
            return {
                success: false,
                mensaje: 'Empresa no asignada'
            }
        }

        connection = await db.getConnection()

        const [usuarios] = await connection.execute(
            `SELECT id,
                    nombre,
                    email,
                    avatar_url,
                    tipo,
                    system_mode,
                    offline_habilitado
             FROM usuarios
             WHERE id = ?
               AND empresa_id = ?
               AND activo = TRUE`,
            [userId, empresaId]
        )

        if (usuarios.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Usuario no encontrado'
            }
        }

        const [empresas] = await connection.execute(
            `SELECT id,
                    nombre_empresa,
                    rnc,
                    logo_url
             FROM empresas
             WHERE id = ?
               AND activo = TRUE`,
            [empresaId]
        )

        const [plataforma] = await connection.execute(
            `SELECT logo_url
             FROM plataforma_config
             WHERE logo_url IS NOT NULL
               AND logo_url != '' LIMIT 1`
        )

        connection.release()

        const logoPlataformaSistema = plataforma.length > 0 && plataforma[0].logo_url ? plataforma[0].logo_url : null

        return {
            success: true,
            usuario: usuarios[0],
            empresa: empresas.length > 0 ? empresas[0] : null,
            logoPlataforma: logoPlataformaSistema,
            systemMode: usuarios[0].system_mode || 'POS'
        }

    } catch (error) {
        console.error('Error al obtener datos del admin:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar datos'
        }
    }
}

export async function cerrarSesion() {
    try {
        const cookieStore = await cookies()

        cookieStore.delete('userId')
        cookieStore.delete('empresaId')
        cookieStore.delete('userTipo')

        return {
            success: true,
            mensaje: 'Sesion cerrada exitosamente'
        }

    } catch (error) {
        console.error('Error al cerrar sesion:', error)

        return {
            success: false,
            mensaje: 'Error al cerrar sesion'
        }
    }
}

function serializarNotif(obj) {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
        if (v instanceof Date) out[k] = v.toISOString().split('T')[0]
        else if (v === null || v === undefined) out[k] = null
        else out[k] = typeof v === 'bigint' ? Number(v) : v
    }
    return out
}

function sqlFilasAtraso() {
    return `
        SELECT
            cl.id AS cliente_id,
            CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), '')) AS cliente_nombre,
            cl.telefono,
            COALESCE(SUM(cu.monto + COALESCE(cu.mora, 0)), 0) AS monto_atraso,
            MAX(GREATEST(DATEDIFF(CURDATE(), cu.fecha_vencimiento), 0)) AS dias_atraso,
            MIN(cu.fecha_vencimiento) AS fecha_mas_antigua,
            1 AS tiene_financiamiento,
            0 AS tiene_credito,
            COUNT(DISTINCT cu.id) AS cuotas_vencidas,
            0 AS facturas_vencidas
        FROM fin_cuotas cu
        JOIN fin_contratos c ON cu.contrato_id = c.id
        JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.empresa_id = ?
          AND c.estado = 'activo'
          AND (
              cu.estado = 'vencida'
              OR (cu.estado IN ('pendiente', 'parcial') AND cu.fecha_vencimiento < CURDATE())
          )
        GROUP BY cl.id, cl.nombre, cl.apellidos, cl.telefono

        UNION ALL

        SELECT
            cl.id AS cliente_id,
            CONCAT(cl.nombre, IFNULL(CONCAT(' ', cl.apellidos), '')) AS cliente_nombre,
            cl.telefono,
            COALESCE(SUM(cxc.saldo_pendiente), 0) AS monto_atraso,
            MAX(GREATEST(DATEDIFF(CURDATE(), cxc.fecha_vencimiento), 0)) AS dias_atraso,
            MIN(cxc.fecha_vencimiento) AS fecha_mas_antigua,
            0 AS tiene_financiamiento,
            1 AS tiene_credito,
            0 AS cuotas_vencidas,
            COUNT(cxc.id) AS facturas_vencidas
        FROM cuentas_por_cobrar cxc
        JOIN clientes cl ON cxc.cliente_id = cl.id
        WHERE cxc.empresa_id = ?
          AND cxc.estado_cxc = 'vencida'
        GROUP BY cl.id, cl.nombre, cl.apellidos, cl.telefono
    `
}

export async function obtenerNotificacionesAtraso(opciones = {}) {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || !userTipo) {
            return { success: false, notificaciones: [], total: 0, pagina: 1, totalPaginas: 0, porPagina: NOTIF_POR_PAGINA }
        }

        const pagina = Math.max(parseInt(opciones.pagina) || 1, 1)
        const porPagina = Math.min(
            Math.max(parseInt(opciones.porPagina) || NOTIF_POR_PAGINA, 5),
            NOTIF_POR_PAGINA_MAX
        )
        const offset = (pagina - 1) * porPagina

        connection = await db.getConnection()

        const filasSql = sqlFilasAtraso()
        const paramsBase = [empresaId, empresaId]

        const [[{ total }]] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM (
                 SELECT cliente_id
                 FROM (${filasSql}) AS filas
                 GROUP BY cliente_id
             ) AS agrupados`,
            paramsBase
        )

        const totalClientes = parseInt(total) || 0
        const totalPaginas = totalClientes > 0 ? Math.ceil(totalClientes / porPagina) : 0
        const paginaSegura = totalPaginas > 0 ? Math.min(pagina, totalPaginas) : 1
        const offsetSeguro = (paginaSegura - 1) * porPagina

        const [rows] = await connection.execute(
            `SELECT
                cliente_id,
                MAX(cliente_nombre) AS cliente_nombre,
                MAX(telefono) AS telefono,
                SUM(monto_atraso) AS monto_atraso,
                MAX(dias_atraso) AS dias_atraso,
                MIN(fecha_mas_antigua) AS fecha_mas_antigua,
                MAX(tiene_financiamiento) AS tiene_financiamiento,
                MAX(tiene_credito) AS tiene_credito,
                SUM(cuotas_vencidas) AS cuotas_vencidas,
                SUM(facturas_vencidas) AS facturas_vencidas
             FROM (${filasSql}) AS filas
             GROUP BY cliente_id
             ORDER BY dias_atraso DESC, monto_atraso DESC
             LIMIT ? OFFSET ?`,
            [...paramsBase, porPagina, offsetSeguro]
        )

        connection.release()

        const notificaciones = rows.map((row) => serializarNotif({
            cliente_id: row.cliente_id,
            cliente_nombre: row.cliente_nombre,
            telefono: row.telefono || null,
            monto_atraso: parseFloat(row.monto_atraso) || 0,
            dias_atraso: parseInt(row.dias_atraso) || 0,
            fecha_mas_antigua: row.fecha_mas_antigua,
            tiene_financiamiento: !!row.tiene_financiamiento,
            tiene_credito: !!row.tiene_credito,
            cuotas_vencidas: parseInt(row.cuotas_vencidas) || 0,
            facturas_vencidas: parseInt(row.facturas_vencidas) || 0
        }))

        return {
            success: true,
            notificaciones,
            total: totalClientes,
            pagina: paginaSegura,
            totalPaginas,
            porPagina
        }
    } catch (error) {
        console.error('Error al obtener notificaciones de atraso:', error)
        if (connection) connection.release()
        return { success: false, notificaciones: [], total: 0, pagina: 1, totalPaginas: 0, porPagina: NOTIF_POR_PAGINA }
    }
}

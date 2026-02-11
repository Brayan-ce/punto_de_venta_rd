"use server"

import db from "@/_DB/db"
import { cookies } from 'next/headers'
import { eliminarImagenProducto } from '@/services/imageService'

// Función para obtener datos del dashboard
export async function obtenerDashboardEquipos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        // Estadísticas generales
        const [stats] = await connection.execute(
            `SELECT 
                COUNT(DISTINCT p.id) as total_equipos,
                COUNT(DISTINCT CASE WHEN p.activo = TRUE THEN p.id END) as equipos_activos,
                COUNT(CASE WHEN ap.estado = 'en_stock' THEN 1 END) as total_activos_disponibles,
                COUNT(CASE WHEN ap.estado = 'financiado' THEN 1 END) as total_activos_financiados,
                COUNT(CASE WHEN ap.estado = 'vendido' THEN 1 END) as total_activos_vendidos,
                COUNT(ap.id) as total_activos,
                SUM(CASE WHEN ap.estado = 'en_stock' THEN p.precio_venta ELSE 0 END) as valor_inventario
            FROM productos p
            LEFT JOIN activos_productos ap ON p.id = ap.producto_id AND ap.empresa_id = ?
            WHERE p.empresa_id = ? AND p.es_rastreable = TRUE`,
            [empresaId, empresaId]
        )

        // Equipos más recientes (últimos 6)
        const [equiposRecientes] = await connection.execute(
            `SELECT 
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.precio_venta,
                p.imagen_url,
                p.tipo_activo,
                p.fecha_creacion,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                COUNT(CASE WHEN ap.estado = 'en_stock' THEN 1 END) as activos_disponibles,
                COUNT(ap.id) as total_activos
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN activos_productos ap ON p.id = ap.producto_id
            WHERE p.empresa_id = ? AND p.es_rastreable = TRUE AND p.activo = TRUE
            GROUP BY p.id
            ORDER BY p.fecha_creacion DESC
            LIMIT 6`,
            [empresaId]
        )

        // Equipos con más unidades disponibles (top 6)
        const [equiposDestacados] = await connection.execute(
            `SELECT 
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.precio_venta,
                p.imagen_url,
                p.tipo_activo,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                COUNT(CASE WHEN ap.estado = 'en_stock' THEN 1 END) as activos_disponibles,
                COUNT(ap.id) as total_activos
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN activos_productos ap ON p.id = ap.producto_id
            WHERE p.empresa_id = ? AND p.es_rastreable = TRUE AND p.activo = TRUE
            GROUP BY p.id
            HAVING activos_disponibles > 0
            ORDER BY activos_disponibles DESC, total_activos DESC
            LIMIT 6`,
            [empresaId]
        )

        // Datos de financiamiento
        let datosFinanciamiento = {
            contratos_activos: 0,
            cuotas_pendientes: 0,
            cuotas_vencidas: 0,
            monto_por_cobrar: 0,
            contratos_recientes: []
        }

        // Verificar si existen las tablas de financiamiento
        const [tablasExisten] = await connection.execute(
            `SELECT COUNT(*) as existe FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'contratos_financiamiento'`
        )

        if (tablasExisten[0].existe > 0) {
            // Estadísticas de contratos
            const [statsContratos] = await connection.execute(
                `SELECT 
                    COUNT(DISTINCT cf.id) as contratos_activos,
                    SUM(cf.saldo_pendiente) as monto_por_cobrar,
                    (SELECT COUNT(*) FROM cuotas_financiamiento WHERE empresa_id = ? AND estado = 'pendiente') as cuotas_pendientes,
                    (SELECT COUNT(*) FROM cuotas_financiamiento WHERE empresa_id = ? AND estado = 'vencida') as cuotas_vencidas
                FROM contratos_financiamiento cf
                WHERE cf.empresa_id = ? AND cf.estado = 'activo'`,
                [empresaId, empresaId, empresaId]
            )

            // Contratos recientes
            const [contratosRecientes] = await connection.execute(
                `SELECT 
                    cf.id,
                    cf.numero_contrato,
                    cf.monto_financiado,
                    cf.saldo_pendiente,
                    cf.estado,
                    cf.fecha_contrato,
                    CONCAT(c.nombre, ' ', COALESCE(c.apellidos, '')) as cliente_nombre
                FROM contratos_financiamiento cf
                INNER JOIN clientes c ON cf.cliente_id = c.id
                WHERE cf.empresa_id = ? AND cf.estado IN ('activo', 'incumplido')
                ORDER BY cf.fecha_creacion DESC
                LIMIT 5`,
                [empresaId]
            )

            datosFinanciamiento = {
                contratos_activos: statsContratos[0]?.contratos_activos || 0,
                cuotas_pendientes: statsContratos[0]?.cuotas_pendientes || 0,
                cuotas_vencidas: statsContratos[0]?.cuotas_vencidas || 0,
                monto_por_cobrar: statsContratos[0]?.monto_por_cobrar || 0,
                contratos_recientes: contratosRecientes
            }
        }

        connection.release()

        return {
            success: true,
            estadisticas: stats[0],
            equiposRecientes: equiposRecientes,
            equiposDestacados: equiposDestacados,
            datosFinanciamiento: datosFinanciamiento,
            userTipo: userTipo
        }

    } catch (error) {
        console.error('Error al obtener dashboard de equipos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar dashboard'
        }
    }
}

// Función para obtener todos los equipos (listado completo)
export async function obtenerEquipos() {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesion invalida'
            }
        }

        connection = await db.getConnection()

        const [equipos] = await connection.execute(
            `SELECT 
                p.id,
                p.codigo_barras,
                p.sku,
                p.nombre,
                p.descripcion,
                p.categoria_id,
                p.marca_id,
                p.precio_compra,
                p.precio_venta,
                p.precio_oferta,
                p.imagen_url,
                p.aplica_itbis,
                p.activo,
                p.tipo_activo,
                p.permite_financiamiento,
                p.meses_max_financiamiento,
                p.meses_garantia,
                c.nombre as categoria_nombre,
                m.nombre as marca_nombre,
                um.abreviatura as unidad_medida_abreviatura,
                COUNT(CASE WHEN ap.estado = 'en_stock' THEN 1 END) as activos_disponibles,
                COUNT(CASE WHEN ap.estado = 'financiado' THEN 1 END) as activos_financiados,
                COUNT(CASE WHEN ap.estado = 'vendido' THEN 1 END) as activos_vendidos,
                COUNT(CASE WHEN ap.estado = 'asignado' THEN 1 END) as activos_asignados,
                COUNT(CASE WHEN ap.estado = 'mantenimiento' THEN 1 END) as activos_mantenimiento,
                COUNT(ap.id) as total_activos
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN marcas m ON p.marca_id = m.id
            LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id
            LEFT JOIN activos_productos ap ON p.id = ap.producto_id
            WHERE p.empresa_id = ? AND p.es_rastreable = TRUE
            GROUP BY p.id
            ORDER BY p.nombre ASC`,
            [empresaId]
        )

        const [categorias] = await connection.execute(
            `SELECT id, nombre
            FROM categorias
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        const [marcas] = await connection.execute(
            `SELECT id, nombre
            FROM marcas
            WHERE empresa_id = ? AND activo = TRUE
            ORDER BY nombre ASC`,
            [empresaId]
        )

        connection.release()

        return {
            success: true,
            equipos: equipos,
            categorias: categorias,
            marcas: marcas,
            userTipo: userTipo
        }

    } catch (error) {
        console.error('Error al obtener equipos:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al cargar equipos'
        }
    }
}

export async function eliminarEquipo(equipoId) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || userTipo !== 'admin') {
            return {
                success: false,
                mensaje: 'No tienes permisos para eliminar equipos'
            }
        }

        connection = await db.getConnection()

        // Verificar que el producto es rastreable
        const [producto] = await connection.execute(
            `SELECT id, imagen_url, es_rastreable FROM productos WHERE id = ? AND empresa_id = ?`,
            [equipoId, empresaId]
        )

        if (producto.length === 0) {
            connection.release()
            return {
                success: false,
                mensaje: 'Equipo no encontrado'
            }
        }

        if (!producto[0].es_rastreable) {
            connection.release()
            return {
                success: false,
                mensaje: 'Este producto no es un equipo rastreable'
            }
        }

        // Verificar si tiene activos asociados con estados críticos
        const [activosCriticos] = await connection.execute(
            `SELECT COUNT(*) as total FROM activos_productos 
            WHERE producto_id = ? AND estado IN ('financiado', 'vendido')`,
            [equipoId]
        )

        if (activosCriticos[0].total > 0) {
            connection.release()
            return {
                success: false,
                mensaje: `No se puede eliminar el equipo porque tiene ${activosCriticos[0].total} activo(s) financiado(s) o vendido(s)`
            }
        }

        // Soft delete del producto
        await connection.execute(
            `UPDATE productos SET activo = FALSE WHERE id = ? AND empresa_id = ?`,
            [equipoId, empresaId]
        )

        connection.release()

        // Eliminar imagen física si es local
        const imagenUrl = producto[0].imagen_url
        if (imagenUrl && imagenUrl.startsWith('/images/productos/')) {
            await eliminarImagenProducto(imagenUrl)
        }

        return {
            success: true,
            mensaje: 'Equipo eliminado exitosamente'
        }

    } catch (error) {
        console.error('Error al eliminar equipo:', error)
        
        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al eliminar equipo'
        }
    }
}


"use server"

import db from "@/_DB/db"
import {cookies} from 'next/headers'

export async function obtenerDatosEmpresa() {
    let connection
    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) return { success: false, mensaje: 'Sesion invalida' }

        connection = await db.getConnection()
        const [empresa] = await connection.execute(
            `SELECT moneda, simbolo_moneda, impuesto_nombre, impuesto_porcentaje, locale
             FROM empresas WHERE id = ? AND activo = TRUE`,
            [empresaId]
        )
        connection.release()

        if (!empresa.length) return { success: false, mensaje: 'Empresa no encontrada' }
        return { success: true, empresa: empresa[0] }
    } catch (error) {
        console.error('Error al obtener empresa:', error)
        if (connection) connection.release()
        return { success: false, mensaje: 'Error al obtener empresa' }
    }
}

const EMPRESA_SKU_PREFIX = 'EMP-'

async function sincronizarProductosEmpresaIsiweek(connection, empresaId) {
    // Obtener categoria por defecto para productos sincronizados
    const [categorias] = await connection.execute(
        `SELECT id
         FROM isiweek_categorias
         WHERE activo = TRUE
         ORDER BY orden ASC, id ASC
         LIMIT 1`
    )

    const categoriaDefaultId = categorias[0]?.id || null

    if (!categoriaDefaultId) {
        return
    }

    // Insertar productos faltantes de forma masiva
    await connection.execute(
        `INSERT INTO isiweek_productos (
            nombre,
            descripcion,
            categoria_id,
            precio,
            precio_volumen,
            cantidad_volumen,
            stock,
            imagen_url,
            sku,
            tiempo_entrega,
            activo,
            destacado
        )
        SELECT
            p.nombre,
            p.descripcion,
            ?,
            COALESCE(p.precio_venta, 0),
            NULL,
            NULL,
            COALESCE(p.stock, 0),
            p.imagen_url,
            CONCAT('${EMPRESA_SKU_PREFIX}', ?, '-', p.id),
            '1 a 2 dias depende el lugar',
            TRUE,
            FALSE
        FROM productos p
        LEFT JOIN isiweek_productos ip
               ON ip.sku = CONCAT('${EMPRESA_SKU_PREFIX}', ?, '-', p.id)
        WHERE p.empresa_id = ?
          AND p.activo = TRUE
          AND ip.id IS NULL`,
        [categoriaDefaultId, empresaId, empresaId, empresaId]
    )

    // Actualizar productos ya sincronizados en bloque
    await connection.execute(
        `UPDATE isiweek_productos ip
         INNER JOIN productos p
                 ON ip.sku = CONCAT('${EMPRESA_SKU_PREFIX}', ?, '-', p.id)
                AND p.empresa_id = ?
         SET ip.nombre = p.nombre,
             ip.descripcion = p.descripcion,
             ip.categoria_id = COALESCE(ip.categoria_id, ?),
             ip.precio = COALESCE(p.precio_venta, 0),
             ip.stock = COALESCE(p.stock, 0),
             ip.imagen_url = COALESCE(p.imagen_url, ip.imagen_url),
             ip.tiempo_entrega = COALESCE(ip.tiempo_entrega, '1 a 2 dias depende el lugar'),
             ip.activo = p.activo`,
        [empresaId, empresaId, categoriaDefaultId]
    )
}


/**
 * 🛒 Obtener productos B2B de la tienda IsiWeek
 * Visible para empresas cliente (admin / vendedor)
 */
/**
 * 🛒 Obtener productos B2B de la tienda IsiWeek
 * Uso: Server Action o API Route
 */
export async function obtenerProductosTiendaIsiWeek(categoriaId = null) {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                productos: [],
                mensaje: 'Sesion invalida o sin permisos'
            }
        }

        connection = await db.getConnection()

        await sincronizarProductosEmpresaIsiweek(connection, empresaId)

        let query = `
            SELECT 
                ip.id,
                ip.nombre,
                ip.descripcion,
                ip.precio,
                ip.precio_volumen,
                ip.cantidad_volumen,
                ip.stock,
                ip.imagen_url,
                ip.sku,
                ip.tiempo_entrega,
                ip.destacado,

                ic.id     AS categoria_id,
                ic.nombre AS categoria_nombre,

                (ip.precio_volumen IS NOT NULL 
                 AND ip.cantidad_volumen IS NOT NULL) AS tiene_precio_volumen,

                (ip.tiempo_entrega IS NULL 
                 OR ip.tiempo_entrega = '0'
                 OR ip.tiempo_entrega = '0 días') AS entrega_inmediata

            FROM isiweek_productos ip
            INNER JOIN isiweek_categorias ic 
                ON ic.id = ip.categoria_id
               AND ic.activo = TRUE
            WHERE ip.activo = TRUE
              AND (
                    COALESCE(ip.sku, '') NOT LIKE '${EMPRESA_SKU_PREFIX}%'
                    OR ip.sku LIKE ?
              )
        `

        const params = [`${EMPRESA_SKU_PREFIX}${empresaId}-%`]

        if (categoriaId !== null) {
            query += ` AND ip.categoria_id = ?`
            params.push(categoriaId)
        }

        query += `
            ORDER BY 
                ip.destacado DESC,
                ic.orden ASC,
                ip.nombre ASC
        `

        const [productos] = await connection.execute(query, params)

        return {
            success: true,
            productos
        }

    } catch (error) {
        console.error("❌ Error tienda IsiWeek:", error)
        return {
            success: false,
            productos: [],
            mensaje: "Error al cargar tienda IsiWeek"
        }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Obtener categorías disponibles en la tienda IsiWeek
 */
export async function obtenerCategoriasTiendaIsiWeek() {
    let connection

    try {
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                categorias: [],
                mensaje: 'Sesion invalida o sin permisos'
            }
        }

        connection = await db.getConnection()

        const [categorias] = await connection.execute(`
            SELECT
                ic.id,
                ic.nombre,
                ic.descripcion,
                ic.orden,
                COUNT(ip.id) AS cantidad_productos
            FROM isiweek_categorias ic
                     LEFT JOIN isiweek_productos ip
                               ON ip.categoria_id = ic.id
                                   AND ip.activo = TRUE
                                   AND (
                                       COALESCE(ip.sku, '') NOT LIKE '${EMPRESA_SKU_PREFIX}%'
                                       OR ip.sku LIKE ?
                                   )
            WHERE ic.activo = TRUE
            GROUP BY ic.id
            ORDER BY ic.orden ASC, ic.nombre ASC
        `, [`${EMPRESA_SKU_PREFIX}${empresaId}-%`])

        return {
            success: true,
            categorias
        }

    } catch (error) {
        console.error("❌ Error categorías IsiWeek:", error)
        return {
            success: false,
            categorias: [],
            mensaje: "Error al cargar categorías"
        }
    } finally {
        if (connection) connection.release()
    }
}

/**
 * Crear pedido B2B desde empresa cliente
 */
export async function crearPedidoB2B(datos) {
    let connection
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('userId')?.value
        const empresaId = cookieStore.get('empresaId')?.value
        const userTipo = cookieStore.get('userTipo')?.value

        if (!userId || !empresaId || (userTipo !== 'admin' && userTipo !== 'vendedor')) {
            return {
                success: false,
                mensaje: 'Sesión inválida o sin permisos'
            }
        }

        if (!datos.items || datos.items.length === 0) {
            return {
                success: false,
                mensaje: 'El pedido debe contener al menos un producto'
            }
        }

        connection = await db.getConnection()

        // Generar número de pedido
        const fecha = new Date()
        const año = fecha.getFullYear()
        const mes = String(fecha.getMonth() + 1).padStart(2, '0')
        const dia = String(fecha.getDate()).padStart(2, '0')

        // Obtener el último número del día
        const [ultimos] = await connection.execute(
            `SELECT numero_pedido
             FROM pedidos_b2b
             WHERE numero_pedido LIKE ?
             ORDER BY id DESC LIMIT 1`,
            [`B2B-${año}${mes}${dia}-%`]
        )

        let secuencia = 1
        if (ultimos.length > 0) {
            const ultimoNum = ultimos[0].numero_pedido
            const ultimaSecuencia = parseInt(ultimoNum.split('-')[2]) || 0
            secuencia = ultimaSecuencia + 1
        }

        const numeroPedido = `B2B-${año}${mes}${dia}-${String(secuencia).padStart(3, '0')}`

        // Calcular totales
        let subtotal = 0
        for (const item of datos.items) {
            // Determinar precio (volumen si aplica, sino precio normal)
            let precioAplicar = parseFloat(item.precio_unitario)
            if (item.precio_volumen && item.cantidad >= item.cantidad_volumen) {
                precioAplicar = parseFloat(item.precio_volumen)
            }
            subtotal += precioAplicar * parseInt(item.cantidad)
        }

        const total = subtotal - (datos.descuento || 0) + (datos.impuesto || 0)

        // Crear pedido
        const [resultadoPedido] = await connection.execute(
            `INSERT INTO pedidos_b2b (numero_pedido, empresa_id, usuario_id, metodo_pago,
                                      subtotal, descuento, impuesto, total, estado, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
            [
                numeroPedido,
                empresaId,
                userId,
                datos.metodo_pago || 'contra_entrega',
                subtotal,
                datos.descuento || 0,
                datos.impuesto || 0,
                total,
                datos.notas || null
            ]
        )

        const pedidoId = resultadoPedido.insertId

        // Crear items del pedido
        for (const item of datos.items) {
            let precioAplicar = parseFloat(item.precio_unitario)
            if (item.precio_volumen && item.cantidad >= item.cantidad_volumen) {
                precioAplicar = parseFloat(item.precio_volumen)
            }

            await connection.execute(
                `INSERT INTO pedidos_b2b_items (pedido_id, producto_id, cantidad, precio_unitario,
                                                precio_aplicado, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.producto_id,
                    item.cantidad,
                    item.precio_unitario,
                    precioAplicar,
                    precioAplicar * parseInt(item.cantidad)
                ]
            )
        }

        connection.release()

        return {
            success: true,
            mensaje: 'Pedido creado correctamente',
            pedidoId: pedidoId,
            numeroPedido: numeroPedido
        }

    } catch (error) {
        console.error('Error al crear pedido B2B:', error)

        if (connection) {
            connection.release()
        }

        return {
            success: false,
            mensaje: 'Error al crear pedido B2B'
        }
    }
}



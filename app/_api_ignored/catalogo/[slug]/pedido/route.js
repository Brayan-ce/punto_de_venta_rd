import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * POST /api/catalogo/[slug]/pedido
 * Crear un pedido desde el catálogo público
 */
export async function POST(request, { params }) {
    let connection
    try {
        const { slug } = await params
        const body = await request.json()

        if (!slug) {
            return NextResponse.json(
                { success: false, mensaje: 'Slug requerido' },
                { status: 400 }
            )
        }

        // Validar datos requeridos
        if (!body.cliente || !body.cliente.nombre || !body.cliente.telefono) {
            return NextResponse.json(
                { success: false, mensaje: 'Nombre y teléfono del cliente son obligatorios' },
                { status: 400 }
            )
        }

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json(
                { success: false, mensaje: 'El pedido debe contener al menos un producto' },
                { status: 400 }
            )
        }

        connection = await db.getConnection()

        // Verificar que el catálogo existe y está activo
        const [configs] = await connection.execute(
            `SELECT empresa_id FROM catalogo_config 
            WHERE url_slug = ? AND activo = TRUE
            LIMIT 1`,
            [slug]
        )

        if (configs.length === 0) {
            connection.release()
            return NextResponse.json(
                { success: false, mensaje: 'Catálogo no encontrado o inactivo' },
                { status: 404 }
            )
        }

        const empresaId = configs[0].empresa_id

        // Validar y obtener precios reales de los productos
        const productoIds = body.items.map(item => item.producto_id)
        const placeholders = productoIds.map(() => '?').join(',')

        const [productosBD] = await connection.execute(
            `SELECT 
                p.id,
                p.precio_venta,
                p.stock,
                COALESCE(pc.precio_catalogo, p.precio_venta) as precio_catalogo,
                COALESCE(pc.precio_oferta, p.precio_oferta) as precio_oferta,
                p.activo,
                pc.visible_catalogo,
                pc.activo as activo_catalogo
            FROM productos p
            LEFT JOIN productos_catalogo pc ON p.id = pc.producto_id AND pc.empresa_id = ?
            WHERE p.id IN (${placeholders})
            AND p.empresa_id = ?`,
            [empresaId, ...productoIds, empresaId]
        )

        // Validar que todos los productos existen y están disponibles
        const productosMap = {}
        productosBD.forEach(p => {
            productosMap[p.id] = p
        })

        for (const item of body.items) {
            const producto = productosMap[item.producto_id]
            if (!producto) {
                connection.release()
                return NextResponse.json(
                    { success: false, mensaje: `Producto ${item.producto_id} no encontrado` },
                    { status: 400 }
                )
            }
            if (!producto.activo || !producto.visible_catalogo || !producto.activo_catalogo) {
                connection.release()
                return NextResponse.json(
                    { success: false, mensaje: `Producto ${producto.id} no disponible en el catálogo` },
                    { status: 400 }
                )
            }
            if (producto.stock < item.cantidad) {
                connection.release()
                return NextResponse.json(
                    { success: false, mensaje: `Stock insuficiente para el producto ${producto.id}` },
                    { status: 400 }
                )
            }
        }

        // Calcular totales con precios reales de BD
        let subtotal = 0
        const itemsValidados = []

        for (const item of body.items) {
            const producto = productosMap[item.producto_id]
            const precio = producto.precio_oferta || producto.precio_catalogo || producto.precio_venta
            const cantidad = parseInt(item.cantidad)
            const itemSubtotal = parseFloat(precio) * cantidad

            itemsValidados.push({
                producto_id: producto.id,
                cantidad: cantidad,
                precio_unitario: parseFloat(precio),
                subtotal: itemSubtotal
            })

            subtotal += itemSubtotal
        }

        const descuento = parseFloat(body.descuento || 0)
        const impuesto = parseFloat(body.impuesto || 0)
        const envio = parseFloat(body.envio || 0)
        const total = subtotal - descuento + impuesto + envio

        // Generar número de pedido
        const fecha = new Date()
        const año = fecha.getFullYear()
        const mes = String(fecha.getMonth() + 1).padStart(2, '0')
        const dia = String(fecha.getDate()).padStart(2, '0')
        
        const [ultimos] = await connection.execute(
            `SELECT numero_pedido FROM pedidos_online 
            WHERE numero_pedido LIKE ? 
            ORDER BY id DESC LIMIT 1`,
            [`PED-${año}${mes}${dia}-%`]
        )

        let secuencia = 1
        if (ultimos.length > 0) {
            const ultimoNum = ultimos[0].numero_pedido
            const ultimaSecuencia = parseInt(ultimoNum.split('-')[2]) || 0
            secuencia = ultimaSecuencia + 1
        }

        const numeroPedido = `PED-${año}${mes}${dia}-${String(secuencia).padStart(3, '0')}`

        // Crear pedido
        const [resultadoPedido] = await connection.execute(
            `INSERT INTO pedidos_online (
                numero_pedido, empresa_id, cliente_nombre, cliente_telefono,
                cliente_email, cliente_direccion, metodo_pago, metodo_entrega,
                subtotal, descuento, impuesto, envio, total, estado, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
            [
                numeroPedido,
                empresaId,
                body.cliente.nombre,
                body.cliente.telefono,
                body.cliente.email || null,
                body.cliente.direccion || null,
                body.metodo_pago || 'contra_entrega',
                body.metodo_entrega || 'pickup',
                subtotal,
                descuento,
                impuesto,
                envio,
                total,
                body.notas || null
            ]
        )

        const pedidoId = resultadoPedido.insertId

        // Crear items del pedido
        for (const item of itemsValidados) {
            await connection.execute(
                `INSERT INTO pedidos_online_items (
                    pedido_id, producto_id, cantidad, precio_unitario, subtotal
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    pedidoId,
                    item.producto_id,
                    item.cantidad,
                    item.precio_unitario,
                    item.subtotal
                ]
            )
        }

        connection.release()

        return NextResponse.json({
            success: true,
            mensaje: 'Pedido creado correctamente',
            pedido: {
                id: pedidoId,
                numero_pedido: numeroPedido,
                total: total
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error al crear pedido:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al crear pedido' },
            { status: 500 }
        )
    }
}


import { NextResponse } from 'next/server'
import db from "@/_DB/db"

/**
 * POST /api/catalogo-superadmin/[slug]/pedido
 * Crear un pedido desde el catálogo público del superadministrador
 * Los pedidos se envían al WhatsApp del superadministrador
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
            `SELECT id, whatsapp FROM catalogo_superadmin_config 
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

        const config = configs[0]

        // Obtener WhatsApp del superadmin (prioridad: config > plataforma_config)
        let whatsappSuperAdmin = config.whatsapp
        if (!whatsappSuperAdmin) {
            const [plataforma] = await connection.execute(
                `SELECT telefono_whatsapp FROM plataforma_config LIMIT 1`
            )
            if (plataforma.length > 0 && plataforma[0].telefono_whatsapp) {
                whatsappSuperAdmin = plataforma[0].telefono_whatsapp
            }
        }

        // Validar y obtener precios reales de los productos
        const productoIds = body.items.map(item => item.producto_id)
        const placeholders = productoIds.map(() => '?').join(',')

        const [productosBD] = await connection.execute(
            `SELECT 
                p.id,
                p.nombre,
                p.precio_venta,
                p.precio_oferta,
                p.stock,
                p.activo,
                p.visible_catalogo
            FROM superadmin_productos_catalogo p
            WHERE p.id IN (${placeholders})`,
            [...productoIds]
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
            if (!producto.activo || !producto.visible_catalogo) {
                connection.release()
                return NextResponse.json(
                    { success: false, mensaje: `Producto ${producto.nombre} no disponible en el catálogo` },
                    { status: 400 }
                )
            }
            if (producto.stock < item.cantidad) {
                connection.release()
                return NextResponse.json(
                    { success: false, mensaje: `Stock insuficiente para el producto ${producto.nombre}` },
                    { status: 400 }
                )
            }
        }

        // Calcular totales con precios reales de BD
        let subtotal = 0
        const itemsValidados = []
        const itemsDetalle = []

        for (const item of body.items) {
            const producto = productosMap[item.producto_id]
            const precio = producto.precio_oferta || producto.precio_venta
            const cantidad = parseInt(item.cantidad)
            const itemSubtotal = parseFloat(precio) * cantidad

            itemsValidados.push({
                producto_id: producto.id,
                cantidad: cantidad,
                precio_unitario: parseFloat(precio),
                subtotal: itemSubtotal
            })

            itemsDetalle.push({
                nombre: producto.nombre,
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
            `SELECT numero_pedido FROM pedidos_superadmin 
            WHERE numero_pedido LIKE ? 
            ORDER BY id DESC LIMIT 1`,
            [`PED-SA-${año}${mes}${dia}-%`]
        )

        let secuencia = 1
        if (ultimos.length > 0) {
            const ultimoNum = ultimos[0].numero_pedido
            const ultimaSecuencia = parseInt(ultimoNum.split('-')[3]) || 0
            secuencia = ultimaSecuencia + 1
        }

        const numeroPedido = `PED-SA-${año}${mes}${dia}-${String(secuencia).padStart(3, '0')}`

        // Crear pedido en la tabla pedidos_superadmin
        const [resultadoPedido] = await connection.execute(
            `INSERT INTO pedidos_superadmin (
                numero_pedido, cliente_nombre, cliente_telefono,
                cliente_email, cliente_direccion, metodo_pago, metodo_entrega,
                subtotal, descuento, impuesto, envio, total, estado, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
            [
                numeroPedido,
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
                `INSERT INTO pedidos_superadmin_items (
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

        // Generar mensaje para WhatsApp
        let mensajeWhatsApp = `🛒 *NUEVO PEDIDO - ${numeroPedido}*\n\n`
        mensajeWhatsApp += `👤 *Cliente:*\n`
        mensajeWhatsApp += `• Nombre: ${body.cliente.nombre}\n`
        mensajeWhatsApp += `• Teléfono: ${body.cliente.telefono}\n`
        if (body.cliente.email) {
            mensajeWhatsApp += `• Email: ${body.cliente.email}\n`
        }
        if (body.cliente.direccion) {
            mensajeWhatsApp += `• Dirección: ${body.cliente.direccion}\n`
        }
        
        mensajeWhatsApp += `\n📦 *Productos:*\n`
        itemsDetalle.forEach((item, index) => {
            mensajeWhatsApp += `${index + 1}. ${item.nombre}\n`
            mensajeWhatsApp += `   Cantidad: ${item.cantidad} x RD$${item.precio_unitario.toFixed(2)} = RD$${item.subtotal.toFixed(2)}\n`
        })
        
        mensajeWhatsApp += `\n💰 *Totales:*\n`
        mensajeWhatsApp += `• Subtotal: RD$${subtotal.toFixed(2)}\n`
        if (descuento > 0) {
            mensajeWhatsApp += `• Descuento: -RD$${descuento.toFixed(2)}\n`
        }
        if (impuesto > 0) {
            mensajeWhatsApp += `• Impuesto: RD$${impuesto.toFixed(2)}\n`
        }
        if (envio > 0) {
            mensajeWhatsApp += `• Envío: RD$${envio.toFixed(2)}\n`
        }
        mensajeWhatsApp += `• *TOTAL: RD$${total.toFixed(2)}*\n`
        
        mensajeWhatsApp += `\n📋 *Información:*\n`
        mensajeWhatsApp += `• Método de pago: ${body.metodo_pago || 'Contra entrega'}\n`
        mensajeWhatsApp += `• Método de entrega: ${body.metodo_entrega === 'delivery' ? 'Delivery' : 'Pickup'}\n`
        if (body.notas) {
            mensajeWhatsApp += `• Notas: ${body.notas}\n`
        }

        // Generar URL de WhatsApp
        let whatsappUrl = null
        if (whatsappSuperAdmin) {
            const mensajeEncoded = encodeURIComponent(mensajeWhatsApp)
            whatsappUrl = `https://wa.me/${whatsappSuperAdmin.replace(/[^0-9]/g, '')}?text=${mensajeEncoded}`
        }

        connection.release()

        return NextResponse.json({
            success: true,
            mensaje: 'Pedido creado correctamente',
            pedido: {
                id: pedidoId,
                numero_pedido: numeroPedido,
                total: total
            },
            whatsapp_url: whatsappUrl,
            whatsapp_mensaje: mensajeWhatsApp
        }, { status: 201 })

    } catch (error) {
        console.error('Error al crear pedido superadmin:', error)
        
        if (connection) {
            connection.release()
        }

        return NextResponse.json(
            { success: false, mensaje: 'Error al crear pedido' },
            { status: 500 }
        )
    }
}


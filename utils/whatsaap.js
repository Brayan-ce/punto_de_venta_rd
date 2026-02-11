export function mensajePedidoAdmin({ numeroPedido, total, empresa }) {
    return `
📦 *Nuevo pedido B2B confirmado*

🏢 Empresa: ${empresa}
🧾 Pedido: ${numeroPedido}
💰 Total: RD$ ${total}

Por favor ingresar al panel.
`.trim()
}

export function linkWhatsApp(telefono, mensaje) {
    const num = telefono.replace(/[^\d]/g, "")
    return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`
}
import { imprimirTextoRaw, obtenerImpresoraPredeterminada } from './qzTrayService'

function zplText(value) {
    return String(value ?? '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\^~\\]/g, ' ')
        .slice(0, 48)
}

export function generarSelloZpl(producto, opciones = {}) {
    const codigo = producto.codigo_barras || producto.sku || String(producto.id)
    const moneda = opciones.simboloMoneda || 'RD$'
    const precio = Number(producto.precio_venta || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `^XA
^CI28
^PW600
^LL420
^LH0,0
^FO35,30^A0N,34,34^FD${zplText(producto.nombre)}^FS
^FO35,78^A0N,26,26^FD${zplText(producto.marca_nombre || '')}^FS
^FO35,125^A0N,42,42^FD${zplText(moneda)} ${precio}^FS
^BY2,3,90
^FO35,190^BCN,90,Y,N,N
^FD${zplText(codigo)}^FS
^FO35,330^A0N,22,22^FD${zplText(producto.sku ? `SKU: ${producto.sku}` : '')}^FS
^XZ`
}

export async function imprimirSelloZebra(producto, impresora = '') {
    const nombreImpresora = impresora || await obtenerImpresoraPredeterminada()
    if (!nombreImpresora) throw new Error('No se encontró una impresora disponible. Instala y abre QZ Tray.')
    await imprimirTextoRaw(nombreImpresora, generarSelloZpl(producto))
    return nombreImpresora
}

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request) {
    const codigo = new URL(request.url).searchParams.get('codigo')?.trim()
    if (!codigo || !/^\d{8,14}$/.test(codigo)) {
        return NextResponse.json({ success: false, mensaje: 'Introduce un código de barras válido' }, { status: 400 })
    }

    const controlador = new AbortController()
    const timeout = setTimeout(() => controlador.abort(), 7000)

    try {
        const respuesta = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json`, {
            headers: { Accept: 'application/json', 'User-Agent': 'IsiWeek/1.0' },
            signal: controlador.signal,
            cache: 'no-store'
        })
        if (!respuesta.ok) return NextResponse.json({ success: false, encontrado: false, mensaje: 'No se encontró información para ese código' })

        const datos = await respuesta.json()
        if (datos.status !== 1 || !datos.product) {
            return NextResponse.json({ success: true, encontrado: false, mensaje: 'No se encontró información para ese código' })
        }

        const producto = datos.product
        return NextResponse.json({
            success: true,
            encontrado: true,
            producto: {
                nombre: producto.product_name || producto.product_name_es || '',
                descripcion: producto.generic_name || producto.generic_name_es || '',
                imagen_url: producto.image_front_url || producto.image_url || null,
                marca: producto.brands || '',
                categoria: producto.categories || ''
            }
        })
    } catch (error) {
        const mensaje = error.name === 'AbortError' ? 'La consulta tardó demasiado' : 'No se pudo consultar la API de códigos'
        return NextResponse.json({ success: false, encontrado: false, mensaje }, { status: 502 })
    } finally {
        clearTimeout(timeout)
    }
}

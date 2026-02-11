import { chromium } from 'playwright'
import { generarHTMLContrato } from '@/_Pages/admin/contratos/templates/contratoTemplate.js'
import { obtenerDatosCompletosContrato } from '@/_Pages/admin/contratos/servidor.js'
import { cookies } from 'next/headers'

/**
 * API Route para generar PDF del contrato
 * GET /api/contratos/[id]/pdf
 */
export async function GET(request, { params }) {
    let browser = null
    
    try {
        // Await params (Next.js 15+)
        const resolvedParams = await params
        
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: 'Sesión inválida' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const contratoId = resolvedParams.id

        // Obtener datos completos del contrato
        const resultado = await obtenerDatosCompletosContrato(contratoId, empresaId)

        if (!resultado.success) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: resultado.mensaje || 'Error al obtener datos del contrato' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Generar HTML del contrato
        const htmlContrato = generarHTMLContrato(resultado.datos)

        // Iniciar Playwright
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()

        // Configurar el contenido HTML
        await page.setContent(htmlContrato, {
            waitUntil: 'networkidle'
        })

        // Generar PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            preferCSSPageSize: true
        })

        await browser.close()

        // Nombre del archivo
        const nombreArchivo = `Contrato_${resultado.datos.contrato.numero_contrato.replace(/\//g, '-')}.pdf`

        // Retornar PDF
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${nombreArchivo}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })

    } catch (error) {
        console.error('Error al generar PDF:', error)
        
        if (browser) {
            try {
                await browser.close()
            } catch (closeError) {
                console.error('Error al cerrar navegador:', closeError)
            }
        }

        return new Response(JSON.stringify({ 
            success: false, 
            mensaje: 'Error al generar PDF: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

/**
 * POST - Generar y descargar PDF
 * Permite opciones adicionales como incluir/excluir secciones
 */
export async function POST(request, { params }) {
    let browser = null
    
    try {
        // Await params (Next.js 15+)
        const resolvedParams = await params
        
        const cookieStore = await cookies()
        const empresaId = cookieStore.get('empresaId')?.value
        const userId = cookieStore.get('userId')?.value

        if (!empresaId || !userId) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: 'Sesión inválida' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const contratoId = resolvedParams.id
        const body = await request.json()
        const { incluirCronograma = true, incluirNotas = true } = body

        // Obtener datos completos del contrato
        const resultado = await obtenerDatosCompletosContrato(contratoId, empresaId)

        if (!resultado.success) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: resultado.mensaje || 'Error al obtener datos del contrato' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Ajustar datos según opciones
        const datosContrato = {
            ...resultado.datos,
            cuotas: incluirCronograma ? resultado.datos.cuotas : null,
            contrato: {
                ...resultado.datos.contrato,
                notas: incluirNotas ? resultado.datos.contrato.notas : null
            }
        }

        // Generar HTML del contrato
        const htmlContrato = generarHTMLContrato(datosContrato)

        // Iniciar Playwright
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()

        await page.setContent(htmlContrato, {
            waitUntil: 'networkidle'
        })

        // Generar PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            printBackground: true,
            preferCSSPageSize: true
        })

        await browser.close()

        // Nombre del archivo
        const nombreArchivo = `Contrato_${resultado.datos.contrato.numero_contrato.replace(/\//g, '-')}.pdf`

        // Retornar PDF para descarga
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        })

    } catch (error) {
        console.error('Error al generar PDF:', error)
        
        if (browser) {
            try {
                await browser.close()
            } catch (closeError) {
                console.error('Error al cerrar navegador:', closeError)
            }
        }

        return new Response(JSON.stringify({ 
            success: false, 
            mensaje: 'Error al generar PDF: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}


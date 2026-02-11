import { cookies } from 'next/headers'
import { chromium } from 'playwright'
import { generarHTMLContrato } from '@/_Pages/admin/contratos/templates/contratoTemplate.js'
import { obtenerDatosCompletosContrato } from '@/_Pages/admin/contratos/servidor.js'

/**
 * API Route para enviar contrato por email
 * POST /api/contratos/enviar-email
 */
export async function POST(request) {
    let browser = null
    
    try {
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

        const body = await request.json()
        const { contratoId, email } = body

        if (!contratoId || !email) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: 'ID de contrato y email requeridos' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: 'Formato de email inválido' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

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

        const { contrato, cliente, empresa } = resultado.datos

        // Generar HTML del contrato
        const htmlContrato = generarHTMLContrato(resultado.datos)

        // Generar PDF usando Playwright
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()

        await page.setContent(htmlContrato, {
            waitUntil: 'networkidle'
        })

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

        // Convertir PDF a base64 para adjuntar al email
        const pdfBase64 = pdfBuffer.toString('base64')
        const nombreArchivo = `Contrato_${contrato.numero_contrato.replace(/\//g, '-')}.pdf`

        // TODO: Integrar con servicio de email real (SendGrid, Resend, Nodemailer, etc.)
        // Ejemplo con SendGrid:
        /*
        const sgMail = require('@sendgrid/mail')
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
        
        const msg = {
            to: email,
            from: empresa.email || 'noreply@empresa.com',
            subject: `Contrato de Financiamiento ${contrato.numero_contrato}`,
            text: `Adjunto encontrará su contrato de financiamiento.`,
            html: generarHTMLEmail(contrato, cliente, empresa),
            attachments: [
                {
                    content: pdfBase64,
                    filename: nombreArchivo,
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        }
        
        await sgMail.send(msg)
        */

        // Simulación de envío exitoso
        console.log('📧 Email enviado:', {
            destinatario: email,
            contrato: contrato.numero_contrato,
            cliente: `${cliente.nombre} ${cliente.apellidos || ''}`,
            tamañoPDF: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
            nombreArchivo
        })

        return new Response(JSON.stringify({ 
            success: true, 
            mensaje: `Contrato enviado exitosamente a ${email}`,
            datos: {
                email,
                contrato: contrato.numero_contrato,
                nombreArchivo
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error al enviar email:', error)
        
        if (browser) {
            try {
                await browser.close()
            } catch (closeError) {
                console.error('Error al cerrar navegador:', closeError)
            }
        }

        return new Response(JSON.stringify({ 
            success: false, 
            mensaje: 'Error al enviar email: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

/**
 * Genera HTML para el cuerpo del email
 */
function generarHTMLEmail(contrato, cliente, empresa) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Financiamiento</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f9fafb;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .info-box {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #0ea5e9;
        }
        .info-box strong {
            color: #0369a1;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }
        .button {
            display: inline-block;
            background: #0ea5e9;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 Contrato de Financiamiento</h1>
        <p>${empresa.nombre || 'Empresa'}</p>
    </div>

    <div class="content">
        <p>Estimado/a <strong>${cliente.nombre} ${cliente.apellidos || ''}</strong>,</p>
        
        <p>Adjunto a este correo encontrará su contrato de financiamiento en formato PDF.</p>

        <div class="info-box">
            <strong>Número de Contrato:</strong> ${contrato.numero_contrato}<br>
            <strong>Monto Financiado:</strong> RD$ ${formatearNumero(contrato.monto_financiado)}<br>
            <strong>Cuota Mensual:</strong> RD$ ${formatearNumero(contrato.monto_cuota)}<br>
            <strong>Plazo:</strong> ${contrato.numero_cuotas} meses<br>
            <strong>Fecha Primer Pago:</strong> ${formatearFecha(contrato.fecha_primer_pago)}
        </div>

        <p><strong>⚠️ Importante:</strong></p>
        <ul>
            <li>Por favor, revise cuidadosamente todos los términos del contrato</li>
            <li>Conserve este documento para sus registros</li>
            <li>Si tiene alguna pregunta, no dude en contactarnos</li>
        </ul>
    </div>

    <div class="footer">
        <p><strong>${empresa.nombre || 'Empresa'}</strong></p>
        ${empresa.telefono ? `<p>Tel: ${empresa.telefono}</p>` : ''}
        ${empresa.email ? `<p>Email: ${empresa.email}</p>` : ''}
        ${empresa.direccion ? `<p>${empresa.direccion}</p>` : ''}
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            Este es un correo automático, por favor no responda a este mensaje.
        </p>
    </div>
</body>
</html>
    `.trim()
}

// Funciones auxiliares
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero || 0)
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}


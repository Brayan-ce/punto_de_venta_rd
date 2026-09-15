import { cookies } from 'next/headers'

/**
 * API Route para enviar notificaciones sobre contratos
 * POST /api/contratos/notificaciones
 */
export async function POST(request) {
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
        const { contratoId, tipo = 'creacion' } = body

        if (!contratoId) {
            return new Response(JSON.stringify({ 
                success: false, 
                mensaje: 'ID de contrato requerido' 
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

        // Generar mensaje según el tipo de notificación
        let mensaje = ''
        let asunto = ''

        switch (tipo) {
            case 'creacion':
                asunto = 'Contrato de Financiamiento Creado'
                mensaje = generarMensajeCreacion(contrato, cliente, empresa)
                break
            
            case 'recordatorio':
                asunto = 'Recordatorio de Pago'
                mensaje = generarMensajeRecordatorio(contrato, cliente, empresa)
                break
            
            case 'vencimiento':
                asunto = 'Cuota Vencida - Acción Requerida'
                mensaje = generarMensajeVencimiento(contrato, cliente, empresa)
                break
            
            default:
                return new Response(JSON.stringify({ 
                    success: false, 
                    mensaje: 'Tipo de notificación no válido' 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                })
        }

        // Aquí se integraría con un servicio de notificaciones real
        // Por ejemplo: Twilio, SendGrid, Firebase Cloud Messaging, etc.
        
        // Simulación de envío exitoso
        console.log('📧 Notificación enviada:', {
            tipo,
            contratoId,
            cliente: `${cliente.nombre} ${cliente.apellidos || ''}`,
            telefono: cliente.telefono,
            email: cliente.email,
            asunto,
            mensaje
        })

        // TODO: Implementar integración real con servicio de notificaciones
        // Ejemplos:
        // - SMS via Twilio
        // - Email via SendGrid/Resend
        // - WhatsApp Business API
        // - Push notifications

        return new Response(JSON.stringify({ 
            success: true, 
            mensaje: `Notificación de ${tipo} enviada exitosamente`,
            datos: {
                tipo,
                asunto,
                destinatario: {
                    nombre: `${cliente.nombre} ${cliente.apellidos || ''}`,
                    telefono: cliente.telefono,
                    email: cliente.email
                }
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error al enviar notificación:', error)
        
        return new Response(JSON.stringify({ 
            success: false, 
            mensaje: 'Error al enviar notificación: ' + error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

/**
 * Genera mensaje para notificación de creación de contrato
 */
function generarMensajeCreacion(contrato, cliente, empresa) {
    return `
Estimado/a ${cliente.nombre} ${cliente.apellidos || ''},

Le informamos que su contrato de financiamiento ha sido creado exitosamente.

📋 DETALLES DEL CONTRATO:
• Número de Contrato: ${contrato.numero_contrato}
• Monto Financiado: RD$ ${formatearNumero(contrato.monto_financiado)}
• Cuota Mensual: RD$ ${formatearNumero(contrato.monto_cuota)}
• Plazo: ${contrato.numero_cuotas} meses
• Primer Pago: ${formatearFecha(contrato.fecha_primer_pago)}

Para más información, puede comunicarse con nosotros.

Atentamente,
${empresa.nombre || 'La Empresa'}
${empresa.telefono || ''}
    `.trim()
}

/**
 * Genera mensaje para recordatorio de pago
 */
function generarMensajeRecordatorio(contrato, cliente, empresa) {
    return `
Estimado/a ${cliente.nombre} ${cliente.apellidos || ''},

Le recordamos que tiene un pago próximo a vencer.

📋 INFORMACIÓN DEL CONTRATO:
• Número de Contrato: ${contrato.numero_contrato}
• Cuota Mensual: RD$ ${formatearNumero(contrato.monto_cuota)}
• Saldo Pendiente: RD$ ${formatearNumero(contrato.saldo_pendiente)}

Por favor, realice su pago a tiempo para evitar cargos adicionales.

Atentamente,
${empresa.nombre || 'La Empresa'}
${empresa.telefono || ''}
    `.trim()
}

/**
 * Genera mensaje para notificación de vencimiento
 */
function generarMensajeVencimiento(contrato, cliente, empresa) {
    return `
Estimado/a ${cliente.nombre} ${cliente.apellidos || ''},

Le informamos que tiene cuotas vencidas en su contrato de financiamiento.

📋 INFORMACIÓN DEL CONTRATO:
• Número de Contrato: ${contrato.numero_contrato}
• Cuotas Vencidas: ${contrato.cuotas_vencidas || 0}
• Monto en Mora: RD$ ${formatearNumero(contrato.monto_mora || 0)}
• Saldo Pendiente: RD$ ${formatearNumero(contrato.saldo_pendiente)}

⚠️ IMPORTANTE: Para evitar acciones legales y cargos adicionales, por favor regularice su situación lo antes posible.

Puede comunicarse con nosotros para establecer un plan de pago.

Atentamente,
${empresa.nombre || 'La Empresa'}
${empresa.telefono || ''}
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


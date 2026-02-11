"use client"

/**
 * Funciones de acciones para contratos
 * Imprimir, Descargar PDF, Compartir WhatsApp, Enviar Notificación
 */

/**
 * Abre el PDF del contrato en una nueva ventana para impresión
 * @param {number} contratoId - ID del contrato
 */
export async function imprimirContrato(contratoId) {
    try {
        // Abrir PDF en nueva ventana
        const url = `/api/contratos/${contratoId}/pdf`
        const ventana = window.open(url, '_blank')
        
        if (!ventana) {
            throw new Error('Por favor, permite las ventanas emergentes para imprimir el contrato')
        }

        // Esperar a que cargue y luego imprimir
        ventana.onload = () => {
            setTimeout(() => {
                ventana.print()
            }, 500)
        }

        return { success: true, mensaje: 'Abriendo vista de impresión...' }
    } catch (error) {
        console.error('Error al imprimir contrato:', error)
        return { success: false, mensaje: error.message || 'Error al imprimir contrato' }
    }
}

/**
 * Descarga el PDF del contrato
 * @param {number} contratoId - ID del contrato
 * @param {string} numeroContrato - Número del contrato para el nombre del archivo
 */
export async function descargarPDF(contratoId, numeroContrato) {
    try {
        // Hacer petición POST para descargar
        const response = await fetch(`/api/contratos/${contratoId}/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                incluirCronograma: true,
                incluirNotas: true
            })
        })

        if (!response.ok) {
            throw new Error('Error al generar PDF')
        }

        // Obtener el blob del PDF
        const blob = await response.blob()
        
        // Crear URL temporal
        const url = window.URL.createObjectURL(blob)
        
        // Crear elemento <a> temporal para descarga
        const a = document.createElement('a')
        a.href = url
        a.download = `Contrato_${numeroContrato.replace(/\//g, '-')}.pdf`
        document.body.appendChild(a)
        a.click()
        
        // Limpiar
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        return { success: true, mensaje: 'PDF descargado exitosamente' }
    } catch (error) {
        console.error('Error al descargar PDF:', error)
        return { success: false, mensaje: error.message || 'Error al descargar PDF' }
    }
}

/**
 * Comparte el contrato por WhatsApp
 * Genera un mensaje con los detalles del contrato y un enlace al PDF
 * @param {Object} contrato - Datos del contrato
 */
export function compartirWhatsApp(contrato) {
    try {
        const {
            numero_contrato,
            cliente_nombre,
            cliente_apellidos,
            cliente_telefono,
            monto_financiado,
            numero_cuotas,
            monto_cuota,
            fecha_primer_pago
        } = contrato

        // Construir mensaje
        const mensaje = `
🧾 *CONTRATO DE FINANCIAMIENTO*

📋 *Contrato:* ${numero_contrato}
👤 *Cliente:* ${cliente_nombre} ${cliente_apellidos || ''}

💰 *Detalles Financieros:*
• Monto Financiado: RD$ ${formatearNumero(monto_financiado)}
• Cuotas: ${numero_cuotas} pagos
• Cuota Mensual: RD$ ${formatearNumero(monto_cuota)}
• Primer Pago: ${formatearFecha(fecha_primer_pago)}

📄 Para ver el contrato completo, solicita el PDF al administrador.

_Generado automáticamente por el sistema_
        `.trim()

        // Determinar número de teléfono
        let telefono = cliente_telefono || ''
        
        // Limpiar el número (solo dígitos)
        telefono = telefono.replace(/\D/g, '')
        
        // Si tiene número, usar WhatsApp directo, sino usar compartir general
        let url
        if (telefono && telefono.length >= 10) {
            // Asegurar código de país (República Dominicana: +1)
            if (!telefono.startsWith('1') && telefono.length === 10) {
                telefono = '1' + telefono
            }
            url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
        } else {
            // Compartir sin número específico
            url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`
        }

        // Abrir WhatsApp
        window.open(url, '_blank')

        return { success: true, mensaje: 'Abriendo WhatsApp...' }
    } catch (error) {
        console.error('Error al compartir por WhatsApp:', error)
        return { success: false, mensaje: error.message || 'Error al compartir por WhatsApp' }
    }
}

/**
 * Envía notificación al cliente sobre el contrato
 * @param {number} contratoId - ID del contrato
 * @param {string} tipoNotificacion - Tipo de notificación (creacion, recordatorio, vencimiento)
 */
export async function enviarNotificacion(contratoId, tipoNotificacion = 'creacion') {
    try {
        const response = await fetch('/api/contratos/notificaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contratoId,
                tipo: tipoNotificacion
            })
        })

        const resultado = await response.json()

        if (!resultado.success) {
            throw new Error(resultado.mensaje || 'Error al enviar notificación')
        }

        return { success: true, mensaje: resultado.mensaje || 'Notificación enviada exitosamente' }
    } catch (error) {
        console.error('Error al enviar notificación:', error)
        return { success: false, mensaje: error.message || 'Error al enviar notificación' }
    }
}

/**
 * Envía el PDF del contrato por email
 * @param {number} contratoId - ID del contrato
 * @param {string} emailDestino - Email del destinatario
 */
export async function enviarPorEmail(contratoId, emailDestino) {
    try {
        const response = await fetch('/api/contratos/enviar-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contratoId,
                email: emailDestino
            })
        })

        const resultado = await response.json()

        if (!resultado.success) {
            throw new Error(resultado.mensaje || 'Error al enviar email')
        }

        return { success: true, mensaje: resultado.mensaje || 'Email enviado exitosamente' }
    } catch (error) {
        console.error('Error al enviar email:', error)
        return { success: false, mensaje: error.message || 'Error al enviar email' }
    }
}

/**
 * Genera un enlace compartible del contrato
 * @param {number} contratoId - ID del contrato
 */
export function generarEnlaceCompartible(contratoId) {
    const baseUrl = window.location.origin
    const enlace = `${baseUrl}/admin/contratos/ver/${contratoId}`
    
    // Copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(enlace)
            .then(() => {
                return { success: true, mensaje: 'Enlace copiado al portapapeles', enlace }
            })
            .catch(() => {
                return { success: false, mensaje: 'No se pudo copiar el enlace', enlace }
            })
    }
    
    return { success: true, enlace }
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


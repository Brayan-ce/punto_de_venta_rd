import { Resend } from 'resend'

export async function enviarFacturaPorCorreo(pago, factura, pdf) {
    if (!pago.cliente_email) throw new Error('El pago no tiene correo electrónico para el envío')
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
        throw new Error('Resend no está configurado en el servidor')
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: pago.cliente_email,
        subject: `Comprobante de pago ${factura.numero_factura} - isiweek`,
        html: `<p>Hola ${pago.cliente_nombre},</p><p>Tu pago fue confirmado correctamente.</p><p><strong>Factura:</strong> ${factura.numero_factura}<br/><strong>Total:</strong> ${pago.moneda} ${Number(pago.monto).toFixed(2)}</p><p>Adjuntamos tu comprobante de pago.</p><p>Gracias por utilizar isiweek.</p>`,
        attachments: [{ filename: `${factura.numero_factura}.pdf`, content: pdf }]
    })
    if (error) throw new Error(error.message || 'Resend no pudo aceptar el correo')
    if (!data?.id) throw new Error('Resend no confirmó la entrega del correo')
    return data.id
}
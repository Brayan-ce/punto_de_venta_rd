import nodemailer from 'nodemailer'

let transporter = null

function obtenerTransporte() {
    if (transporter) return transporter

    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
        throw new Error('SMTP no configurado. Revisa las variables SMTP_HOST, SMTP_USER, SMTP_PASS en .env')
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    })

    return transporter
}

export async function enviarCorreo({ para, asunto, html }) {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    const fromName = process.env.SMTP_FROM_NAME || 'IsiWeek POS'

    const info = await obtenerTransporte().sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: para,
        subject: asunto,
        html
    })

    return info
}

export function generarPlantillaOtp(codigo, nombrePlataforma) {
    const nombre = nombrePlataforma || 'IsiWeek'
    return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background: #f4f7fc; margin: 0; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px 28px; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #1d6fce; margin: 0; font-size: 22px;">${nombre}</h2>
                    <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Código de verificación</p>
                </div>
                <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
                    <p style="color: #374151; font-size: 14px; margin: 0 0 12px;">Tu código de inicio de sesión es:</p>
                    <div style="font-size: 42px; font-weight: 800; color: #1d6fce; letter-spacing: 8px; font-family: 'Courier New', monospace;">${codigo}</div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">Este código expira en 5 minutos.</p>
                </div>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Si no solicitaste este código, ignora este correo.</p>
            </div>
        </body>
        </html>
    `
}

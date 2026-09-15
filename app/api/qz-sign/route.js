import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { obtenerSesionFirmada } from '@/lib/auth/session';

export async function POST(request) {
    try {
        const { message } = await request.json();
        const sesion = await obtenerSesionFirmada();
        if (!sesion || !['admin', 'superadmin'].includes(sesion.tipo) || typeof message !== 'string' || !message) {
            return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
        }
        
        // La clave privada nunca debe estar dentro de public: el navegador solo recibe el certificado.
        const privateKeyPath = path.join(process.cwd(), '.qz', 'qz-private-key.pem');
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        
        const sign = crypto.createSign('SHA512');
        sign.update(message);
        sign.end();
        
        const signature = sign.sign(privateKey, 'base64');
        
        return NextResponse.json({ signature });
    } catch (error) {
        console.error('Error firmando mensaje:', error);
        return NextResponse.json({ error: 'Error al firmar mensaje' }, { status: 500 });
    }
}
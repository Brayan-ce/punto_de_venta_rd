import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const { message } = await request.json();
        
        const privateKeyPath = path.join(process.cwd(), 'public', 'certificates', 'private-key.pem');
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
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = cookies();
        const userId = cookieStore.get('userId')?.value;
        const empresaId = cookieStore.get('empresaId')?.value;

        if (!userId || !empresaId) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Retornar estado de sincronización
        // En una implementación real, esto podría verificar timestamps
        // de última sincronización en la base de datos
        return NextResponse.json({
            success: true,
            lastSync: new Date().toISOString(),
            message: 'Estado de sincronización obtenido',
        });
    } catch (error) {
        console.error('Error obteniendo estado de sincronización:', error);
        return NextResponse.json(
            { error: 'Error obteniendo estado: ' + error.message },
            { status: 500 }
        );
    }
}

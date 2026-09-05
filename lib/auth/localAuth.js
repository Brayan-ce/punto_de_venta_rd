export async function loginLocal() {
    if (typeof window === 'undefined') return { success: false, message: 'Entorno no soportado' }

    const raw = localStorage.getItem('offlineSession')

    if (!raw) {
        return {
            success: false,
            message: 'No hay sesión offline disponible. Se requiere al menos un inicio de sesión online previo.'
        }
    }

    try {
        const session = JSON.parse(raw)
        const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000

        if (Date.now() - session.timestamp > SIETE_DIAS) {
            localStorage.removeItem('offlineSession')
            return {
                success: false,
                message: 'La sesión offline ha expirado. Por favor, conéctate a internet para renovarla.'
            }
        }

        return {
            success: true,
            usuario: {
                id: session.userId,
                nombre: session.nombre,
                email: session.email,
                empresa_id: session.empresaId,
                nombre_empresa: session.nombreEmpresa
            },
            tipo: session.tipo,
            offline: true
        }
    } catch (error) {
        console.error('Error in loginLocal:', error)
        return {
            success: false,
            message: 'Sesión offline corrupta o inválida'
        }
    }
}

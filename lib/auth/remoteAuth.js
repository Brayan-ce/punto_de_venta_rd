// lib/auth/remoteAuth.ts (o .js)
// Re-checking login.js, it imports from ./servidor
import { iniciarSesion } from '@/_Pages/main/login/servidor'

export async function loginRemote(email, password) {
    try {
        const result = await iniciarSesion(email, password)

        if (!result.success) {
            return result
        }

        // 💾 Guardar sesión para uso offline
        localStorage.setItem(
            'offlineSession',
            JSON.stringify({
                userId: result.usuario.id,
                tipo: result.tipo,
                nombre: result.usuario.nombre,
                email: result.usuario.email,
                empresaId: result.usuario.empresa_id,
                nombreEmpresa: result.usuario.nombre_empresa,
                timestamp: Date.now()
            })
        )

        return result
    } catch (error) {
        console.error('Error in loginRemote:', error)
        return {
            success: false,
            message: 'Error de conexión con el servidor'
        }
    }
}

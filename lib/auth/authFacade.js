import { loginRemote } from './remoteAuth'
import { loginLocal } from './localAuth'

/**
 * Facade para el sistema de autenticación.
 * Decide qué método usar dependiendo del estado de conexión.
 */
export async function login(email, password, isOnline) {
    if (isOnline) {
        return await loginRemote(email, password)
    }

    return await loginLocal()
}

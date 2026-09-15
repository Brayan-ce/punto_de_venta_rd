import { cookies } from 'next/headers'

export async function requirePrinterSession(request) {
    const rawCookie = request?.headers?.get('cookie') || ''
    if (!rawCookie) throw new Error('Sesión no válida para imprimir')

    const cookieStore = request?.cookies || await cookies()
    const userId = cookieStore.get('userId')?.value
    const userType = cookieStore.get('userTipo')?.value
    const companyId = cookieStore.get('empresaId')?.value

    if (!userId || !userType || (userType !== 'superadmin' && !companyId)) {
        throw new Error('Sesión no válida para imprimir')
    }

    return { userId, userType, companyId }
}
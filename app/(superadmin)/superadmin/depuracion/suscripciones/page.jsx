import GestionSuscripciones from '@/_Pages/superadmin/depuracion/suscripciones/suscripciones'
import { obtenerSuscripciones } from '@/_Pages/superadmin/depuracion/suscripciones/servidor'

export const metadata = {
    title: 'Gestión de Suscripciones | SuperAdmin',
    description: 'Administración de planes y estados comerciales'
}

export default async function SuscripcionesPage() {
    const result = await obtenerSuscripciones()
    const suscripciones = result.success ? result.suscripciones : []

    return <GestionSuscripciones suscripcionesIniciales={suscripciones} />
}

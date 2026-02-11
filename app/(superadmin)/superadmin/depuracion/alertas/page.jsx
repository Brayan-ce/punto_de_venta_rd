import Alertas from '@/_Pages/superadmin/depuracion/alertas/alertas'
import { obtenerAlertas } from '@/_Pages/superadmin/depuracion/alertas/servidor'

export const metadata = {
    title: 'Centro de Alertas | SuperAdmin',
    description: 'Gestión de incidencias críticas'
}

export default async function AlertasPage() {
    const result = await obtenerAlertas()
    const alertas = result.success ? result.alertas : []

    return <Alertas alertasIniciales={alertas} />
}

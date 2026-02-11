
import Depuracion from '@/_Pages/superadmin/depuracion/depuracion'
import { obtenerEstadisticasDepuracion } from '@/_Pages/superadmin/depuracion/clientes/servidor'
import { obtenerEmpresasConProblemas } from '@/_Pages/superadmin/depuracion/suscripciones/servidor'

// Metadata
export const metadata = {
    title: 'Depuración y Auditoría | SuperAdmin',
    description: 'Centro de control de integridad del sistema'
}

export default async function DepuracionPage() {
    // Fetch data in parallel
    const [estadisticasResult, empresasResult] = await Promise.all([
        obtenerEstadisticasDepuracion(),
        obtenerEmpresasConProblemas()
    ])

    const estadisticas = estadisticasResult.success ? estadisticasResult.estadisticas : {}
    const empresasProblemas = empresasResult.success ? empresasResult.empresas : []

    return (
        <Depuracion
            estadisticas={estadisticas}
            empresasProblemas={empresasProblemas}
        />
    )
}

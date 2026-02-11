import VentasDepuracion from '@/_Pages/superadmin/depuracion/ventas/ventas'
import { obtenerVentasAnomalas } from '@/_Pages/superadmin/depuracion/ventas/servidor'

export const metadata = {
    title: 'Depuración de Ventas | SuperAdmin',
    description: 'Control de integridad en facturación'
}

export default async function VentasDepuracionPage() {
    const result = await obtenerVentasAnomalas()
    const ventas = result.success ? result.ventas : []

    return <VentasDepuracion ventasAnomalas={ventas} />
}

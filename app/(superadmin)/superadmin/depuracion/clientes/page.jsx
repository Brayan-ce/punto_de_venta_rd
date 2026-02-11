import ClientesDepuracion from '@/_Pages/superadmin/depuracion/clientes/clientes'
import { obtenerDuplicadosDetectados } from '@/_Pages/superadmin/depuracion/clientes/servidor'

export const metadata = {
    title: 'Depuración de Clientes | SuperAdmin',
    description: 'Gestión de duplicados'
}

export default async function ClientesPage() {
    const result = await obtenerDuplicadosDetectados()
    const duplicados = result.success ? result.duplicados : []

    return <ClientesDepuracion duplicadosIniciales={duplicados} />
}

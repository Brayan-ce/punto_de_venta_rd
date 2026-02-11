import Auditoria from '@/_Pages/superadmin/depuracion/auditoria/auditoria'
import { obtenerRegistrosAuditoria } from '@/_Pages/superadmin/depuracion/auditoria/servidor'

export const metadata = {
    title: 'Auditoría del Sistema | SuperAdmin',
    description: 'Registro histórico de operaciones'
}

export default async function AuditoriaPage() {
    const result = await obtenerRegistrosAuditoria()
    const registros = result.success ? result.registros : []

    return <Auditoria registrosIniciales={registros} />
}

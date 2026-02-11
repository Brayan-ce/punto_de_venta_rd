import ControlCajas from '@/_Pages/superadmin/depuracion/cajas/cajas'
import { obtenerCajasAbiertas, obtenerCajasConInconsistencias } from '@/_Pages/superadmin/depuracion/cajas/servidor'

export const metadata = {
    title: 'Control de Cajas | SuperAdmin',
    description: 'Auditoría de aperturas y cierres'
}

export default async function CajasPage() {
    const [cajasAbiertasRes, cajasInconsistentesRes] = await Promise.all([
        obtenerCajasAbiertas(),
        obtenerCajasConInconsistencias()
    ])

    const cajasAbiertas = cajasAbiertasRes.success ? cajasAbiertasRes.cajas : []
    const cajasInconsistentes = cajasInconsistentesRes.success ? cajasInconsistentesRes.cajas : []

    return (
        <ControlCajas
            cajasAbiertasIniciales={cajasAbiertas}
            cajasInconsistentesIniciales={cajasInconsistentes}
        />
    )
}

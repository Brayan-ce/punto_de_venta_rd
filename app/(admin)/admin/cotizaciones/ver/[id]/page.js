import VerCotizacionAdmin from "@/_Pages/admin/cotizaciones/ver/ver"

export const metadata = {
    title: 'Ver Cotización - Admin',
    description: 'Ver detalles de la cotización',
}

export default async function VerCotizacionPage({ params }) {
    const { id } = await params
    return <VerCotizacionAdmin id={id} />
}

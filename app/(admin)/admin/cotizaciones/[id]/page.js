import VerCotizacionAdmin from "@/_Pages/admin/cotizaciones/ver/ver"

export const metadata = {
    title: 'Detalle de Cotización - Admin',
}

export default async function VerCotizacionPage({ params }) {
    const { id } = await params
    return <VerCotizacionAdmin id={id} />
}

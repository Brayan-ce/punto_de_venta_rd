import ImprimirCotizacion from "@/_Pages/admin/cotizaciones/imprimir/imprimir"

export const metadata = {
    title: 'Imprimir Cotización - Admin',
    description: 'Vista de impresión de la cotización',
}

export default async function ImprimirCotizacionPage({ params }) {
    const { id } = await params
    return <ImprimirCotizacion id={id} />
}

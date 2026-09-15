import EditarCotizacion from "@/_Pages/admin/cotizaciones/editar/editar"

export const metadata = {
    title: 'Editar Cotización - Admin',
    description: 'Actualizar información y productos de la cotización',
}

export default async function EditarCotizacionPage({ params }) {
    const { id } = await params
    return <EditarCotizacion id={id} />
}

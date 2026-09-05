import DetalleConduce from "@/_Pages/admin/conduces/DetalleConduce"

export const metadata = {
    title: 'Detalle de Conduce - Admin',
}

export default async function VerConducePage({ params }) {
    const { id } = await params
    return <DetalleConduce id={id} />
}

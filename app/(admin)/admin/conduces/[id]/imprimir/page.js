import ImprimirConduce from "@/_Pages/admin/conduces/ImprimirConduce"

export const metadata = {
    title: 'Imprimir Conduce - Admin',
}

export default async function ImprimirConducePage({ params }) {
    const { id } = await params
    return <ImprimirConduce id={id} />
}

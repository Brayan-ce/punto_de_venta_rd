import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import ImprimirCobro from "@/_Pages/admin/cobros/imprimir/imprimir"

export default async function Page({ params }) {
    const { id } = await params
    return (
        <ClienteWrapper>
            <ImprimirCobro abonoId={id} />
        </ClienteWrapper>
    )
}

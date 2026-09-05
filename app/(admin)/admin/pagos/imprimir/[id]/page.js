import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper"
import ImprimirPago from "@/_Pages/admin/pagos/imprimir/imprimir"

export default function page() {
    return (
        <ClienteWrapper>
            <ImprimirPago />
        </ClienteWrapper>
    )
}

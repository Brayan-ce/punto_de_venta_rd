import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VentaRapida from "@/_Pages/admin/ventas/rapida/rapida";

export default function page() {
    return (
        <div>
            <ClienteWrapper>
                <VentaRapida />
            </ClienteWrapper>
        </div>
    )
}

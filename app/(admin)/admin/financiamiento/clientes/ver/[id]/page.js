import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerClienteFinanciamiento from "@/_Pages/admin/financiamiento/clientes/ver/ver";

export default function VerClienteFinanciamientoPage() {
    return (
        <div>
            <ClienteWrapper>
                <VerClienteFinanciamiento />
            </ClienteWrapper>
        </div>
    );
}

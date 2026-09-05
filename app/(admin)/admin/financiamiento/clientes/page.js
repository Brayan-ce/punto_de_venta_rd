import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ClientesFinanciamiento from "@/_Pages/admin/financiamiento/clientes/clientes";

export default function ClientesFinanciamientoPage() {
    return (
        <div>
            <ClienteWrapper>
                <ClientesFinanciamiento />
            </ClienteWrapper>
        </div>
    );
}

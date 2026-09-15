import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CrearClienteFinanciamiento from "@/_Pages/admin/financiamiento/clientes/crear/crear";

export default function CrearClienteFinanciamientoPage() {
    return (
        <div>
            <ClienteWrapper>
                <CrearClienteFinanciamiento />
            </ClienteWrapper>
        </div>
    );
}

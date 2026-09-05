import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarClienteFinanciamiento from "@/_Pages/admin/financiamiento/clientes/editar/editar";

export default function EditarClienteFinanciamientoPage() {
    return (
        <div>
            <ClienteWrapper>
                <EditarClienteFinanciamiento />
            </ClienteWrapper>
        </div>
    );
}

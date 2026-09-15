import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import CuotasFinanciamiento from "@/_Pages/admin/cuotas/cuotas";

export const metadata = {
    title: 'Cuotas de Financiamiento | Gestión de Cobros',
    description: 'Gestión y seguimiento de cuotas de financiamiento, control de cobros y mora'
};

export default function Page() {
    return (
        <ClienteWrapper>
            <CuotasFinanciamiento />
        </ClienteWrapper>
    );
}


import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoPlan from "@/_Pages/admin/planes/nuevo/nuevo";

export default function Page() {
    return (
        <ClienteWrapper>
            <NuevoPlan />
        </ClienteWrapper>
    );
}


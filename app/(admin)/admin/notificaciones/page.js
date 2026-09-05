import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import Notificaciones from "@/_Pages/admin/notificaciones/notificaciones";

export const metadata = {
    title: 'Notificaciones | Financiamiento',
    description: 'Cuotas por vencer, vencidas y alertas de financiamiento'
};

export default function Page() {
    return (
        <ClienteWrapper>
            <Notificaciones />
        </ClienteWrapper>
    );
}

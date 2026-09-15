import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerCuota from "@/_Pages/admin/cuotas/ver/[id]/ver";

export default async function Page({ params }) {
    const { id } = await params;
    
    return (
        <ClienteWrapper>
            <VerCuota cuotaId={id} />
        </ClienteWrapper>
    );
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    return {
        title: `Cuota #${id} | Financiamiento`,
        description: 'Detalle de cuota de financiamiento'
    };
}


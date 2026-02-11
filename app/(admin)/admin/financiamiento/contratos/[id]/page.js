import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerContratoFinanciamiento from "@/_Pages/admin/contratos/ver/[id]/ver";

export default async function VerContratoPage({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <VerContratoFinanciamiento />
    </ClienteWrapper>
  );
}





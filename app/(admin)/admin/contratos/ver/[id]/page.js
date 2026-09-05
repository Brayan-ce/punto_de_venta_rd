import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerContratoFinanciamiento from "@/_Pages/admin/contratos/ver/[id]/ver";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <VerContratoFinanciamiento />
    </ClienteWrapper>
  );
}


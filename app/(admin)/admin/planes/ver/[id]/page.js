import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerPlan from "@/_Pages/admin/planes/ver/ver";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <VerPlan planId={id} />
    </ClienteWrapper>
  );
}


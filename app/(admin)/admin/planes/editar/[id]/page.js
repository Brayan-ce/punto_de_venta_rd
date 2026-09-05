import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarPlan from "@/_Pages/admin/planes/editar/editar";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <EditarPlan planId={id} />
    </ClienteWrapper>
  );
}


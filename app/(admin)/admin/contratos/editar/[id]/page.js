import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarContrato from "@/_Pages/admin/contratos/editar/editar";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <EditarContrato />
    </ClienteWrapper>
  );
}


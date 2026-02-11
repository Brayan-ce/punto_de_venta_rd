import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarObra from "@/_Pages/admin/obras/editar/editar";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <EditarObra id={id} />
    </ClienteWrapper>
  );
}


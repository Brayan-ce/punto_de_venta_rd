import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerObra from "@/_Pages/admin/obras/ver/ver";

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <ClienteWrapper>
      <VerObra id={id} />
    </ClienteWrapper>
  );
}


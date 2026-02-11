import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerBitacora from "@/_Pages/admin/bitacora/ver/ver";

export default function Page({ params }) {
  return (
    <ClienteWrapper>
      <VerBitacora id={params.id} />
    </ClienteWrapper>
  );
}


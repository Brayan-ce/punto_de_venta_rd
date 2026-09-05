import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaObra from "@/_Pages/admin/obras/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevaObra />
    </ClienteWrapper>
  );
}


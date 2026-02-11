import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoContrato from "@/_Pages/admin/contratos/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevoContrato />
    </ClienteWrapper>
  );
}


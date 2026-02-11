import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoServicio from "@/_Pages/admin/servicios/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevoServicio />
    </ClienteWrapper>
  );
}


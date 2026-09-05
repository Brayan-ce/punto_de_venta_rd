import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoTrabajador from "@/_Pages/admin/personal/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevoTrabajador />
    </ClienteWrapper>
  );
}


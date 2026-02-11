import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import AsignarPersonal from "@/_Pages/admin/personal/asignar/asignar";

export default function Page() {
  return (
    <ClienteWrapper>
      <AsignarPersonal />
    </ClienteWrapper>
  );
}


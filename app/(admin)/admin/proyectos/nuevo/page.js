import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoProyecto from "@/_Pages/admin/proyectos/nuevo/nuevo";

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevoProyecto />
    </ClienteWrapper>
  );
}


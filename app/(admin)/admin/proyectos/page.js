import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ProyectosAdmin from "@/_Pages/admin/proyectos/proyectos";

export default function Page() {
  return (
    <ClienteWrapper>
      <ProyectosAdmin />
    </ClienteWrapper>
  );
}


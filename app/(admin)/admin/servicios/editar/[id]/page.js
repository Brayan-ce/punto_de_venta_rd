import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarServicio from "@/_Pages/admin/servicios/editar/editar";

export const metadata = {
  title: 'Editar Servicio | Punto de Venta RD',
  description: 'Actualizar información y configuración del servicio',
}

export default function Page() {
  return (
    <ClienteWrapper>
      <EditarServicio />
    </ClienteWrapper>
  );
}


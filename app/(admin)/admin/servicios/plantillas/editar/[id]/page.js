import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarPlantilla from "@/_Pages/admin/servicios/plantillas/editar/editar";

export const metadata = {
  title: 'Editar Plantilla de Servicio | Punto de Venta RD',
  description: 'Actualizar información y configuración de la plantilla de servicio',
}

export default function Page() {
  return (
    <ClienteWrapper>
      <EditarPlantilla />
    </ClienteWrapper>
  );
}


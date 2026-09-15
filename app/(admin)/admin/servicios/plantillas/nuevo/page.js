import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaPlantilla from "@/_Pages/admin/servicios/plantillas/nuevo/nuevo";

export const metadata = {
  title: 'Nueva Plantilla de Servicio | Punto de Venta RD',
  description: 'Crear una nueva plantilla de servicio reutilizable',
}

export default function Page() {
  return (
    <ClienteWrapper>
      <NuevaPlantilla />
    </ClienteWrapper>
  );
}


import { redirect } from "next/navigation";
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaVenta from "@/_Pages/admin/ventas/nueva/nueva";
import { obtenerDatosAdmin } from "@/_Pages/admin/header/servidor";

export default async function page() {
  const datos = await obtenerDatosAdmin();
  if (datos.success && datos.systemMode === "OBRAS") {
    redirect("/admin/manejo-simple");
  }
  return (
    <div>
      <ClienteWrapper>
        <NuevaVenta></NuevaVenta>
      </ClienteWrapper>
    </div>
  );
}

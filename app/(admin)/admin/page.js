import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaVenta from "@/_Pages/admin/ventas/nueva/nueva";
import { obtenerDatosAdmin } from "@/_Pages/admin/header/servidor";
import { verificarModuloHabilitado } from "@/lib/modulos/servidor";

export default async function page() {
  const datos = await obtenerDatosAdmin();
  if (datos.success) {
    const cookieStore = await cookies();
    const empresaId = cookieStore.get('empresaId')?.value;
    if (empresaId) {
      const tieneFinanciamiento = await verificarModuloHabilitado(parseInt(empresaId), 'financiamiento');
      const tienePos = await verificarModuloHabilitado(parseInt(empresaId), 'pos');
      if (tieneFinanciamiento && !tienePos) {
        redirect("/admin/financiamiento");
      }
    }
  }
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

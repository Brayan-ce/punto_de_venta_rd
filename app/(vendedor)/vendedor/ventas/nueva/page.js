// app/(vendedor)/vendedor/ventas/nueva/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaVentaAdmin from "@/_Pages/admin/ventas/nueva/nueva";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevaVentaAdmin returnPath="/vendedor/ventas" rapidaPath="/vendedor/ventas/rapida" />
      </ClienteWrapper>
    </div>
  );
}

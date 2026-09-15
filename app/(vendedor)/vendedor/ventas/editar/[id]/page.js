// app/(vendedor)/vendedor/ventas/editar/[id]/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarVentaAdmin from "@/_Pages/admin/ventas/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarVentaAdmin returnPath="/vendedor/ventas" />
      </ClienteWrapper>
    </div>
  );
}

// app/(vendedor)/vendedor/ventas/ver/[id]/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerVentaAdmin from "@/_Pages/admin/ventas/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerVentaAdmin returnPath="/vendedor/ventas" basePath="/vendedor" />
      </ClienteWrapper>
    </div>
  );
}

// app/(vendedor)/vendedor/ventas/rapida/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VentaRapida from "@/_Pages/admin/ventas/rapida/rapida";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VentaRapida returnPath="/vendedor/ventas" />
      </ClienteWrapper>
    </div>
  );
}

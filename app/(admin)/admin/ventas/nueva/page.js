// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaVentaAdmin from "@/_Pages/admin/ventas/nueva/nueva";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevaVentaAdmin></NuevaVentaAdmin>
      </ClienteWrapper>
    </div>
  );
}

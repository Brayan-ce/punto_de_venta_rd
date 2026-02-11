// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarVentaAdmin from "@/_Pages/admin/ventas/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarVentaAdmin></EditarVentaAdmin>
      </ClienteWrapper>
    </div>
  );
}

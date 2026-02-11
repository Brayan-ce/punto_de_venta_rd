// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarProductoAdmin from "@/_Pages/admin/productos/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarProductoAdmin></EditarProductoAdmin>
      </ClienteWrapper>
    </div>
  );
}

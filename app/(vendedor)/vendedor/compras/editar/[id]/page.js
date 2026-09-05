// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import EditarCompra from "@/_Pages/admin/compras/editar/editar";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <EditarCompra></EditarCompra>
      </ClienteWrapper>
    </div>
  );
}
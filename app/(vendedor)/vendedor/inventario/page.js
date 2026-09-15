// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import InventarioAdmin from "@/_Pages/admin/inventario/inventario";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <InventarioAdmin></InventarioAdmin>
      </ClienteWrapper>
    </div>
  );
}

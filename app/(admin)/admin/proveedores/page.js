// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import ProveedoresAdmin from "@/_Pages/admin/proveedores/proveedores";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <ProveedoresAdmin></ProveedoresAdmin>
      </ClienteWrapper>
    </div>
  );
}

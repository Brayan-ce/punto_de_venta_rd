// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevoProductoAdmin from "@/_Pages/admin/productos/nuevo/nuevo";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevoProductoAdmin></NuevoProductoAdmin>
      </ClienteWrapper>
    </div>
  );
}

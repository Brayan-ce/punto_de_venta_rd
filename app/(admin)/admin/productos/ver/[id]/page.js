// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerProductoAdmin from "@/_Pages/admin/productos/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerProductoAdmin></VerProductoAdmin>
      </ClienteWrapper>
    </div>
  );
}

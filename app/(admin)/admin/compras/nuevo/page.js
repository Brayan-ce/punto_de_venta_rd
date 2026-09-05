// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import NuevaCompraAdmin from "@/_Pages/admin/compras/nuevo/nuevo";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <NuevaCompraAdmin></NuevaCompraAdmin>
      </ClienteWrapper>
    </div>
  );
}

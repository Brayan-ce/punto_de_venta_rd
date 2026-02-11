// app/page.js
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import VerCompraAdmin from "@/_Pages/admin/compras/ver/ver";
export default function page() {
  return (
    <div>
      <ClienteWrapper>
        <VerCompraAdmin></VerCompraAdmin>
      </ClienteWrapper>
    </div>
  );
}
